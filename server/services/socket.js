// services/socket.js
const socketio = require('socket.io');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Room = require('../models/Room');
const Message = require('../models/Message');
const Document = require('../models/Document');
const ParticipationRecord = require('../models/ParticipationRecord');

// For file storage
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
const util = require('util');
const writeFileAsync = util.promisify(fs.writeFile);
const mkdirAsync = util.promisify(fs.mkdir);

const UPLOADS_DIR = path.join(__dirname, '../uploads');

// Ensure uploads directory exists
(async () => {
    try {
        await mkdirAsync(UPLOADS_DIR, { recursive: true });
    } catch (err) {
        console.error('Error creating uploads directory:', err);
    }
})();

// Socket.io setup and handling
const setupSocketIO = (server) => {
    const io = socketio(server, {
        cors: {
            origin: process.env.FRONTEND_URL || "http://localhost:3000",
            methods: ["GET", "POST"],
            credentials: true
        }
    });

    // Middleware for socket authentication
    io.use(async (socket, next) => {
        try {
            const token = socket.handshake.auth.token;

            if (!token) {
                // Allow connection without auth for demo/testing
                socket.user = {
                    _id: null,
                    username: socket.handshake.auth.username || 'Guest'
                };
                return next();
            }

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourjwtsecretkey');
            const user = await User.findById(decoded.id);

            if (!user) {
                return next(new Error('User not found'));
            }

            // Attach user to socket
            socket.user = {
                _id: user._id,
                username: user.username,
                role: user.role
            };

            next();
        } catch (error) {
            return next(new Error('Authentication error'));
        }
    });

    // Track active rooms and user participation
    const activeRooms = new Map();
    const userRooms = new Map();
    const participationRecords = new Map();

    // Initialize participant tracking
    const initializeParticipation = (userId, username, roomId) => {
        const recordKey = `${roomId}:${userId}`;

        if (!participationRecords.has(recordKey)) {
            participationRecords.set(recordKey, {
                userId,
                username,
                roomId,
                joinTime: Date.now(),
                lastActivity: Date.now(),
                speaking: false,
                speakingTime: 0,
                speakingStart: null,
                messageCount: 0,
                whiteboardInteractions: 0,
                documentShares: 0,
                handRaises: 0,
                reactions: 0,
            });
        }

        return participationRecords.get(recordKey);
    };

    // Update participation metrics
    const updateParticipation = (userId, roomId, metric, value = 1) => {
        const recordKey = `${roomId}:${userId}`;
        if (participationRecords.has(recordKey)) {
            const record = participationRecords.get(recordKey);
            record.lastActivity = Date.now();

            switch (metric) {
                case 'speaking':
                    if (value && !record.speaking) {
                        record.speaking = true;
                        record.speakingStart = Date.now();
                    } else if (!value && record.speaking) {
                        record.speaking = false;
                        record.speakingTime += (Date.now() - record.speakingStart) / 1000;
                        record.speakingStart = null;
                    }
                    break;
                case 'message':
                    record.messageCount += value;
                    break;
                case 'whiteboard':
                    record.whiteboardInteractions += value;
                    break;
                case 'document':
                    record.documentShares += value;
                    break;
                case 'handRaise':
                    record.handRaises += value;
                    break;
                case 'reaction':
                    record.reactions += value;
                    break;
            }
        }
    };

    // Save participation data to database
    const saveParticipationData = async (roomId, userId) => {
        try {
            const recordKey = `${roomId}:${userId}`;
            if (participationRecords.has(recordKey)) {
                const record = participationRecords.get(recordKey);

                // If still speaking when leaving, update time
                if (record.speaking && record.speakingStart) {
                    record.speakingTime += (Date.now() - record.speakingStart) / 1000;
                }

                const totalTimePresent = (Date.now() - record.joinTime) / 1000;

                // Calculate engagement score (simple algorithm - can be more sophisticated)
                const engagementScore = Math.min(100,
                    (record.messageCount * 5) +
                    (record.whiteboardInteractions * 3) +
                    (record.documentShares * 5) +
                    (record.handRaises * 2) +
                    (record.reactions * 1) +
                    (record.speakingTime > 0 ? Math.min(50, record.speakingTime / 10) : 0)
                );

                // Save to MongoDB
                await ParticipationRecord.create({
                    roomId,
                    userId: record.userId,
                    username: record.username,
                    metrics: {
                        totalTimePresent,
                        speechTime: record.speakingTime,
                        messagesSent: record.messageCount,
                        whiteboardInteractions: record.whiteboardInteractions,
                        documentsShared: record.documentShares,
                        handRaises: record.handRaises,
                        reactions: record.reactions,
                        attentionScore: 90, // Placeholder - could be calculated from focus events
                    },
                    engagementScore
                });

                // Remove record from memory
                participationRecords.delete(recordKey);
            }
        } catch (error) {
            console.error('Error saving participation data:', error);
        }
    };

    io.on('connection', async (socket) => {
        console.log(`User connected: ${socket.id} (${socket.user.username})`);

        // Join room
        socket.on('join-room', async ({ roomId, username }) => {
            try {
                socket.join(roomId);
                const userId = socket.user._id || socket.id;

                // Track which room this user is in
                userRooms.set(socket.id, roomId);

                // Initialize room tracking if needed
                if (!activeRooms.has(roomId)) {
                    activeRooms.set(roomId, new Map());

                    // Try to find room in database or create a temporary record
                    let room = await Room.findOne({ roomId });
                    if (!room && userId) {
                        room = await Room.create({
                            roomId,
                            name: roomId,
                            createdBy: userId,
                            participants: [{ userId, role: 'host' }]
                        });
                    }
                }

                // Add user to room's active participants
                activeRooms.get(roomId).set(socket.id, {
                    userId,
                    username: socket.user.username || username,
                    role: socket.user.role || 'participant'
                });

                // Initialize participation tracking
                initializeParticipation(userId, socket.user.username || username, roomId);

                // Update room participants in DB
                if (socket.user._id) {
                    await Room.findOneAndUpdate(
                        { roomId },
                        {
                            $addToSet: {
                                participants: {
                                    userId: socket.user._id,
                                    role: activeRooms.get(roomId).get(socket.id).role
                                }
                            }
                        }
                    );
                }

                // Notify others that someone joined
                socket.to(roomId).emit('user-joined-room', {
                    socketId: socket.id,
                    userId,
                    username: socket.user.username || username
                });

                console.log(`${socket.user.username || username} joined room: ${roomId}`);

                // Send room participants list
                const participants = [];
                activeRooms.get(roomId).forEach((user, id) => {
                    participants.push({
                        socketId: id,
                        userId: user.userId,
                        username: user.username,
                        role: user.role
                    });
                });

                io.to(socket.id).emit('room-participants', participants);

                // Send chat history
                const messages = await Message.find({ roomId })
                    .sort({ timestamp: -1 })
                    .limit(50)
                    .sort({ timestamp: 1 });

                io.to(socket.id).emit('chat-history', messages);
            } catch (error) {
                console.error(`Error joining room: ${error.message}`);
                socket.emit('error', { message: 'Failed to join room' });
            }
        });

        // User has media and is ready for video calls
        socket.on('user-with-media', ({ roomId }) => {
            try {
                const usersInRoom = [];

                if (activeRooms.has(roomId)) {
                    activeRooms.get(roomId).forEach((user, id) => {
                        if (id !== socket.id) {
                            usersInRoom.push({
                                socketId: id,
                                userId: user.userId,
                                username: user.username
                            });
                        }
                    });
                }

                // Send all existing users to the new user
                socket.emit('all-users', usersInRoom);
            } catch (error) {
                console.error(`Error getting users with media: ${error.message}`);
            }
        });

        // WebRTC Signaling
        socket.on('sending-signal', ({ userToSignal, callerId, signal, username }) => {
            io.to(userToSignal).emit('user-joined', {
                signal,
                callerId,
                username
            });
        });

        socket.on('returning-signal', ({ signal, callerId }) => {
            io.to(callerId).emit('receiving-returned-signal', {
                signal,
                id: socket.id
            });
        });

        // Determine if user is teacher/host
        socket.on('check-teacher', ({ roomId }) => {
            try {
                const isTeacher =
                    socket.user.role === 'teacher' ||
                    (activeRooms.has(roomId) &&
                        activeRooms.get(roomId).size === 1);

                socket.emit('is-teacher', isTeacher);
            } catch (error) {
                console.error(`Error checking teacher role: ${error.message}`);
                socket.emit('is-teacher', false);
            }
        });

        // Handle whiteboard drawing
        socket.on('whiteboard-draw', ({ roomId, drawData }) => {
            try {
                socket.to(roomId).emit('whiteboard-update', { drawData });

                // Update participation metrics
                const userId = socket.user._id || socket.id;
                updateParticipation(userId, roomId, 'whiteboard');
            } catch (error) {
                console.error(`Error handling whiteboard: ${error.message}`);
            }
        });

        // Handle chat messages
        socket.on('send-message', async (messageData) => {
            try {
                const { roomId, text, type } = messageData;
                const userId = socket.user._id || socket.id;
                const username = socket.user.username || messageData.sender;

                // Create message in database
                const message = await Message.create({
                    roomId,
                    sender: userId,
                    senderName: username,
                    text,
                    type: type || 'text',
                    timestamp: new Date()
                });

                // Broadcast to other users
                const messageToSend = {
                    _id: message._id,
                    roomId,
                    sender: userId,
                    senderName: username,
                    text,
                    type: type || 'text',
                    timestamp: message.timestamp
                };

                socket.to(roomId).emit('receive-message', messageToSend);

                // Update participation metrics
                updateParticipation(userId, roomId, 'message');
            } catch (error) {
                console.error(`Error sending message: ${error.message}`);
                socket.emit('error', { message: 'Failed to send message' });
            }
        });

        // Handle file sharing
        socket.on('share-file', async (fileData) => {
            try {
                const { roomId, name, type, size, data } = fileData;
                const userId = socket.user._id || socket.id;
                const username = socket.user.username || fileData.uploadedBy;

                // Process base64 file data
                const base64Data = data.split(';base64,').pop();
                const fileId = uuidv4();
                const fileExt = name.split('.').pop();
                const fileName = `${fileId}.${fileExt}`;
                const filePath = path.join(UPLOADS_DIR, fileName);

                // Save file to disk
                await writeFileAsync(filePath, base64Data, { encoding: 'base64' });

                // Save document reference to database
                const document = await Document.create({
                    name,
                    roomId,
                    uploadedBy: userId,
                    uploadedByName: username,
                    fileType: type,
                    fileSize: size,
                    filePath: `/uploads/${fileName}`
                });

                // Create file message
                await Message.create({
                    roomId,
                    sender: userId,
                    senderName: username,
                    text: `Shared a file: ${name}`,
                    type: 'file',
                    fileUrl: `/uploads/${fileName}`,
                    fileName: name,
                    fileType: type,
                    fileSize: size,
                    timestamp: new Date()
                });

                // Prepare document data to send
                const documentToSend = {
                    _id: document._id,
                    name: document.name,
                    roomId: document.roomId,
                    uploadedBy: document.uploadedBy,
                    uploadedByName: document.uploadedByName,
                    fileType: document.fileType,
                    fileSize: document.fileSize,
                    filePath: document.filePath,
                    uploadedAt: document.uploadedAt
                };

                // Broadcast to others in room
                socket.to(roomId).emit('file-shared', documentToSend);

                // Update participation metrics
                updateParticipation(userId, roomId, 'document');
            } catch (error) {
                console.error(`Error sharing file: ${error.message}`);
                socket.emit('error', { message: 'Failed to share file' });
            }
        });

        // Get room files
        socket.on('get-files', async ({ roomId }) => {
            try {
                const documents = await Document.find({ roomId })
                    .sort({ uploadedAt: -1 });

                socket.emit('all-files', documents);
            } catch (error) {
                console.error(`Error getting files: ${error.message}`);
                socket.emit('error', { message: 'Failed to retrieve files' });
            }
        });

        // Track speaking status for participation metrics
        socket.on('speaking-status', ({ roomId, isSpeaking }) => {
            const userId = socket.user._id || socket.id;
            updateParticipation(userId, roomId, 'speaking', isSpeaking);
        });

        // Hand raise for participation
        socket.on('hand-raise', ({ roomId, isRaised }) => {
            try {
                const userId = socket.user._id || socket.id;
                const username = socket.user.username;

                // Broadcast to room
                socket.to(roomId).emit('user-hand-raise', {
                    userId,
                    username,
                    isRaised
                });

                // Update participation metrics if raising hand
                if (isRaised) {
                    updateParticipation(userId, roomId, 'handRaise');
                }
            } catch (error) {
                console.error(`Error with hand raise: ${error.message}`);
            }
        });

        // Send reaction
        socket.on('send-reaction', ({ roomId, reaction }) => {
            try {
                const userId = socket.user._id || socket.id;
                const username = socket.user.username;

                // Broadcast to room
                socket.to(roomId).emit('user-reaction', {
                    userId,
                    username,
                    reaction
                });

                // Update participation metrics
                updateParticipation(userId, roomId, 'reaction');
            } catch (error) {
                console.error(`Error sending reaction: ${error.message}`);
            }
        });

        // Get participation insights (for teachers)
        socket.on('get-participation-insights', async ({ roomId }) => {
            try {
                if (socket.user.role === 'teacher' || socket.user.role === 'admin') {
                    // Calculate current session insights from memory
                    const currentInsights = [];

                    participationRecords.forEach((record, key) => {
                        if (key.startsWith(`${roomId}:`)) {
                            // If still in the room, include the record
                            const { userId, username, metrics, engagementScore } = record;
                            currentInsights.push({
                                userId,
                                username,
                                totalTimePresent: metrics.totalTimePresent,
                                speechTime: metrics.speechTime,
                                messagesSent: metrics.messagesSent,
                                whiteboardInteractions: metrics.whiteboardInteractions,
                                documentsShared: metrics.documentsShared,
                                handRaises: metrics.handRaises,
                                reactions: metrics.reactions,
                                engagementScore,
                            });
                        }
                    });

                    // Send insights to the requesting teacher/admin
                    socket.emit('participation-insights', currentInsights);
                } else {
                    // If not a teacher/admin, deny the request
                    socket.emit('error', { message: 'Permission denied: Only teachers/admins can view participation insights' });
                }
            } catch (error) {
                console.error(`Error getting participation insights: ${error.message}`);
                socket.emit('error', { message: 'Failed to retrieve participation insights' });
            }
        });

        // When the user disconnects, remove them from the room
        socket.on('disconnect', async () => {
            try {
                const roomId = userRooms.get(socket.id);

                if (roomId) {
                    // Remove user from active room
                    activeRooms.get(roomId).delete(socket.id);

                    // If the room becomes empty, remove it from activeRooms map
                    if (activeRooms.get(roomId).size === 0) {
                        activeRooms.delete(roomId);
                    }

                    // Save participation data to database when user disconnects
                    const userId = socket.user._id || socket.id;
                    await saveParticipationData(roomId, userId);

                    // Notify other participants that this user left
                    socket.to(roomId).emit('user-left-room', { socketId: socket.id });

                    console.log(`${socket.user.username} disconnected from room: ${roomId}`);
                }
            } catch (error) {
                console.error(`Error on disconnect: ${error.message}`);
            } finally {
                // Cleanup user data
                userRooms.delete(socket.id);
            }
        });
    });
};

module.exports = setupSocketIO;
