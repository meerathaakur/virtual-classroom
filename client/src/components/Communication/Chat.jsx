// src/components/Communication/Chat.jsx
import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../../context/SocketContext';
// import { PaperAirplaneIcon } from '@heroicons/react/solid';

const Chat = ({ roomId, username }) => {
    const { socket } = useSocket();
    const [message, setMessage] = useState('');
    const [messages, setMessages] = useState([]);
    const messagesEndRef = useRef(null);

    useEffect(() => {
        if (!socket) return;

        // Listen for incoming messages
        socket.on('receive-message', (messageData) => {
            setMessages(prevMessages => [...prevMessages, messageData]);
        });

        return () => {
            socket.off('receive-message');
        };
    }, [socket]);

    // Scroll to bottom when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMessage = (e) => {
        e.preventDefault();
        if (!message.trim() || !socket) return;

        const messageData = {
            roomId,
            sender: username,
            text: message,
            timestamp: new Date().toISOString(),
            id: Date.now().toString(),
        };

        // Send message to server
        socket.emit('send-message', messageData);

        // Add message to local state
        setMessages(prevMessages => [...prevMessages, messageData]);

        // Clear input
        setMessage('');
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;//changes
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
                {/* Messages area */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {messages.length === 0 ? (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            No messages yet. Start a conversation!
                        </div>
                    ) : (
                        messages.map((msg) => (
                            <div
                                key={msg.id}
                                className={`mb-4 ${msg.sender === username ? 'text-right' : ''}`}
                            >
                                <div
                                    className={`inline-block rounded-lg px-4 py-2 max-w-xs ${msg.sender === username
                                        ? 'bg-primary text-white'
                                        : 'bg-gray-200 text-gray-800'
                                        }`}
                                >
                                    {msg.sender !== username && (
                                        <div className="font-semibold text-sm">{msg.sender}</div>
                                    )}
                                    <div>{msg.text}</div>
                                    <div className="text-xs opacity-75 mt-1 pt-1">
                                        {formatTime(msg.timestamp)}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                    <div ref={messagesEndRef} />
                </div>

                {/* Message input */}
                <form onSubmit={sendMessage} className="border-t border-gray-200 p-4">
                    <div className="flex">
                        <input
                            type="text"
                            className="flex-1 input"
                            placeholder="Type a message..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                        />
                        <button
                            type="submit"
                            className="ml-2 p-2 bg-primary text-white rounded-md"
                            disabled={!message.trim()}
                        >
                            {/* <PaperAirplaneIcon className="h-5 w-5" /> */}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Chat;