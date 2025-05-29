import { useState, useEffect, useRef, useCallback } from 'react';
import io from 'socket.io-client';

/**
 * Custom hook for managing socket.io connections and events in the virtual classroom
 * 
 * @param {string} url - The URL of the socket server
 * @param {Object} options - Socket.io connection options
 * @returns {Object} Socket connection and utility methods
 */
const useSocket = (url = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000', options = {}) => {
    const [isConnected, setIsConnected] = useState(false);
    const [lastMessage, setLastMessage] = useState(null);
    const [roomId, setRoomId] = useState(null);
    const [participants, setParticipants] = useState([]);
    const [error, setError] = useState(null);

    // Use a ref to store the socket instance to maintain it between renders
    const socketRef = useRef(null);

    // Initialize socket connection
    useEffect(() => {
        // Create new socket connection
        const newSocket = io(url, {
            transports: ['websocket'],
            ...options
        });

        // Store socket instance in ref
        socketRef.current = newSocket;

        // Socket event handlers
        const onConnect = () => {
            setIsConnected(true);
            setError(null);
            console.log('Socket connected');
        };

        const onDisconnect = (reason) => {
            setIsConnected(false);
            console.log(`Socket disconnected: ${reason}`);
        };

        const onError = (err) => {
            setError(err.message || 'Socket connection error');
            console.error('Socket error:', err);
        };

        const onRoomUpdate = (roomData) => {
            setParticipants(roomData.participants || []);
        };

        // Register event listeners
        newSocket.on('connect', onConnect);
        newSocket.on('disconnect', onDisconnect);
        newSocket.on('error', onError);
        newSocket.on('room_update', onRoomUpdate);

        // Cleanup function
        return () => {
            if (newSocket) {
                newSocket.off('connect', onConnect);
                newSocket.off('disconnect', onDisconnect);
                newSocket.off('error', onError);
                newSocket.off('room_update', onRoomUpdate);
                newSocket.disconnect();
            }
        };
    }, [url, options]);

    // Function to join a classroom room
    const joinRoom = useCallback((roomIdentifier, userData) => {
        if (!socketRef.current || !isConnected) {
            setError('Socket not connected. Cannot join room.');
            return;
        }

        socketRef.current.emit('join_room', { roomId: roomIdentifier, user: userData }, (response) => {
            if (response.success) {
                setRoomId(roomIdentifier);
                setParticipants(response.participants || []);
            } else {
                setError(response.error || 'Failed to join room');
            }
        });
    }, [isConnected]);

    // Function to leave the current room
    const leaveRoom = useCallback(() => {
        if (!socketRef.current || !isConnected || !roomId) return;

        socketRef.current.emit('leave_room', { roomId }, (response) => {
            if (response.success) {
                setRoomId(null);
                setParticipants([]);
            } else {
                setError(response.error || 'Failed to leave room');
            }
        });
    }, [isConnected, roomId]);

    // Function to send a message to the room
    const sendMessage = useCallback((messageType, payload) => {
        if (!socketRef.current || !isConnected || !roomId) {
            setError('Socket not connected or not in a room. Cannot send message.');
            return false;
        }

        socketRef.current.emit('message', {
            roomId,
            type: messageType,
            payload
        });

        return true;
    }, [isConnected, roomId]);

    // Function to subscribe to a specific event
    const subscribe = useCallback((event, callback) => {
        if (!socketRef.current) return () => { };

        socketRef.current.on(event, callback);
        return () => socketRef.current.off(event, callback);
    }, []);

    // Function to emit custom events
    const emit = useCallback((event, data, callback) => {
        if (!socketRef.current || !isConnected) {
            setError('Socket not connected. Cannot emit event.');
            return;
        }

        socketRef.current.emit(event, data, callback);
    }, [isConnected]);

    return {
        socket: socketRef.current,
        isConnected,
        roomId,
        participants,
        lastMessage,
        error,
        joinRoom,
        leaveRoom,
        sendMessage,
        subscribe,
        emit
    };
};

export default useSocket;