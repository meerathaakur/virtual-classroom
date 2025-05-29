// src/pages/ClassroomPage.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useSocket } from '../context/SocketContext';
import VideoConference from '../components/VideoConferencing/VideoConference';
import Whiteboard from '../components/Whiteboard/Whiteboard';
import Chat from '../components/Communication/Chat';
import DocumentSharing from '../components/Communication/DocumentSharing';

const ClassroomPage = () => {
    const { roomId } = useParams();
    const { socket, connected } = useSocket();
    const [activeTab, setActiveTab] = useState('video'); // 'video', 'whiteboard', 'chat', 'docs'
    const username = localStorage.getItem('username') || 'Anonymous';

    useEffect(() => {
        if (socket && connected) {
            // Join the specific room
            socket.emit('join-room', { roomId, username }, (response) => { //making changes from here if else statement ans response
                if (response.success) {
                    setLoading(false)
                }
                else {
                    setError('Room not found or an error occurred')
                    setLoading(false)
                }
            });

            return () => {
                // Leave the room when component unmounts
                socket.emit('leave-room', { roomId, username });
            };
        }
    }, [socket, connected, roomId, username]);
    if (loading) {
        return <div className="text-center py-10">Loading...</div>;
    }

    if (error) {
        return <div className="text-center py-10 text-red-500">{error}</div>;
    }
    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <header className="bg-white shadow-sm border-b border-gray-200">
                <div className="container mx-auto px-4 py-3 flex items-center justify-between">
                    <h1 className="text-2xl font-bold text-primary">Virtual Classroom</h1>
                    <div className="flex items-center space-x-4">
                        <span className="text-gray-600">Room: {roomId}</span>
                        <span className="text-gray-600">User: {username}</span>
                    </div>
                </div>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200">
                <div className="container mx-auto px-4">
                    <nav className="flex space-x-6">
                        <button
                            className={`py-3 px-1 border-b-2 ${activeTab === 'video' ? 'border-primary text-primary' : 'border-transparent'}`}
                            onClick={() => setActiveTab('video')}
                        >
                            Video Conference
                        </button>
                        <button
                            className={`py-3 px-1 border-b-2 ${activeTab === 'whiteboard' ? 'border-primary text-primary' : 'border-transparent'}`}
                            onClick={() => setActiveTab('whiteboard')}
                        >
                            Whiteboard
                        </button>
                        <button
                            className={`py-3 px-1 border-b-2 ${activeTab === 'chat' ? 'border-primary text-primary' : 'border-transparent'}`}
                            onClick={() => setActiveTab('chat')}
                        >
                            Chat
                        </button>
                        <button
                            className={`py-3 px-1 border-b-2 ${activeTab === 'docs' ? 'border-primary text-primary' : 'border-transparent'}`}
                            onClick={() => setActiveTab('docs')}
                        >
                            Documents
                        </button>
                    </nav>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 bg-gray-50 overflow-hidden">
                {activeTab === 'video' && <VideoConference roomId={roomId} username={username} />}
                {activeTab === 'whiteboard' && <Whiteboard roomId={roomId} username={username} />}
                {activeTab === 'chat' && <Chat roomId={roomId} username={username} />}
                {activeTab === 'docs' && <DocumentSharing roomId={roomId} username={username} />}
            </div>
        </div>
    );
};

export default ClassroomPage;
