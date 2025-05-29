// server.js (create this in the root of your project)
require("dotenv").config()
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const connectDB = require('./config/db.config');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "http://localhost:5173",
        methods: ["GET", "POST"]
    }
});

// Store active rooms and users
const rooms = new Map();
const files = new Map();

io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    // Join room
    socket.on('join-room', ({ roomId, username }) => {
        socket.join(roomId);

        // Initialize room if it doesn't exist
        if (!rooms.has(roomId)) {
            rooms.set(roomId, new Map());
        }

        // Add user to room
        rooms.get(roomId).set(socket.id, { username });

        console.log(`${username} joined room: ${roomId}`);

        // Notify others that someone joined
        socket.to(roomId).emit('user-joined-room', {
            socketId: socket.id,
            username
        });
    });

    // User has media and is ready for video calls
    socket.on('user-with-media', ({ roomId, username }) => {
        // Get all users in the room except the sender
        const usersInRoom = [];
        if (rooms.has(roomId)) {
            rooms.get(roomId).forEach((user, id) => {
                if (id !== socket.id) {
                    usersInRoom.push({
                        socketId: id,
                        username: user.username
                    });
                }
            });
        }

        // Send all existing users to the new user
        socket.emit('all-users', usersInRoom);
    });

    // Sending signal (initiating peer connection)
    socket.on('sending-signal', ({ userToSignal, callerId, signal, username }) => {
        io.to(userToSignal).emit('user-joined', {
            signal,
            callerId,
            username
        });
    });

    // Returning signal (accepting peer connection)
    socket.on('returning-signal', ({ signal, callerId }) => {
        io.to(callerId).emit('receiving-returned-signal', {
            signal,
            id: socket.id
        });
    });

    // Check if user is first in room (for whiteboard teacher role)
    socket.on('check-teacher', ({ roomId }) => {
        if (rooms.has(roomId)) {
            const isFirst = rooms.get(roomId).size === 1 ||
                [...rooms.get(roomId).keys()][0] === socket.id;
            socket.emit('is-teacher', isFirst);
        } else {
            socket.emit('is-teacher', true); // Default to true if room doesn't exist yet
        }
    });

    // Whiteboard drawing
    socket.on('whiteboard-draw', ({ roomId, drawData }) => {
        socket.to(roomId).emit('whiteboard-update', { drawData });
    });

    // Send message
    socket.on('send-message', (messageData) => {
        socket.to(messageData.roomId).emit('receive-message', messageData);
    });

    // Share file
    socket.on('share-file', (fileData) => {
        // Store file
        if (!files.has(fileData.roomId)) {
            files.set(fileData.roomId, []);
        }
        files.get(fileData.roomId).push(fileData);

        // Share with others in room
        socket.to(fileData.roomId).emit('file-shared', fileData);
    });

    // Get all files in a room
    socket.on('get-files', ({ roomId }) => {
        const roomFiles = files.get(roomId) || [];
        socket.emit('all-files', roomFiles);
    });

    // Leave room
    socket.on('leave-room', ({ roomId, username }) => {
        if (rooms.has(roomId)) {
            rooms.get(roomId).delete(socket.id);
            if (rooms.get(roomId).size === 0) {
                rooms.delete(roomId);
            }
        }
        socket.leave(roomId);
        console.log(`${username} left room: ${roomId}`);
    });

    // Handle disconnection
    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);

        // Find and remove user from all rooms
        rooms.forEach((users, roomId) => {
            if (users.has(socket.id)) {
                users.delete(socket.id);
                // Notify others in the room
                socket.to(roomId).emit('user-disconnected', socket.id);

                // Clean up empty rooms
                if (users.size === 0) {
                    rooms.delete(roomId);
                }
            }
        });
    });
});

// Basic route for testing
app.get('/', (req, res) => {
    res.send('Virtual Classroom Server is running');
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, async() => {
    await connectDB()
    console.log(`Server running on port ${PORT}`);
});