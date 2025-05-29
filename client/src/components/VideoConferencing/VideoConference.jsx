// src/components/VideoConference/VideoConference.jsx
import React, { useEffect, useRef, useState } from 'react';
// import Peer from 'simple-peer';
import { useSocket } from '../../context/SocketContext';
import VideoControls from './VideoControls';
import VideoGrid from './VideoGrid';

const VideoConference = ({ roomId, username }) => {
    const { socket } = useSocket();
    const [peers, setPeers] = useState([]);
    const [stream, setStream] = useState(null);
    const [audioEnabled, setAudioEnabled] = useState(true);
    const [videoEnabled, setVideoEnabled] = useState(true);
    const userVideo = useRef();
    const peersRef = useRef([]);

    useEffect(() => {
        // Get user's audio and video
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(currentStream => {
                setStream(currentStream);
                if (userVideo.current) {
                    userVideo.current.srcObject = currentStream;
                }

                // Tell server you've joined with media
                socket.emit('user-with-media', { roomId, username });

                // Listen for other users in the room
                socket.on('all-users', users => {
                    const peers = [];
                    users.forEach(user => {
                        const peer = createPeer(user.socketId, socket.id, currentStream);
                        peersRef.current.push({
                            peerId: user.socketId,
                            peer,
                            username: user.username
                        });
                        peers.push({
                            peerId: user.socketId,
                            peer,
                            username: user.username
                        });
                    });
                    setPeers(peers);
                });

                // Handle new user joining
                socket.on('user-joined', payload => {
                    const peer = addPeer(payload.signal, payload.callerId, currentStream);
                    peersRef.current.push({
                        peerId: payload.callerId,
                        peer,
                        username: payload.username
                    });
                    setPeers(prev => [...prev, { peerId: payload.callerId, peer, username: payload.username }]);
                });

                // Receiving returned signal
                socket.on('receiving-returned-signal', payload => {
                    const item = peersRef.current.find(p => p.peerId === payload.id);
                    if (item) {
                        item.peer.signal(payload.signal);
                    }
                });

                // Handle user disconnect
                socket.on('user-disconnected', userId => {
                    const peerObj = peersRef.current.find(p => p.peerId === userId);
                    if (peerObj) {
                        peerObj.peer.destroy();
                    }
                    const peers = peersRef.current.filter(p => p.peerId !== userId);
                    peersRef.current = peers;
                    setPeers(peers);
                });
            })
            .catch(error => {
                console.error("Error getting media devices:", error);
            });

        return () => {
            // Clean up
            if (stream) {
                stream.getTracks().forEach(track => {
                    track.stop();
                });
            }

            socket.off('all-users');
            socket.off('user-joined');
            socket.off('receiving-returned-signal');
            socket.off('user-disconnected');
        };
    }, [socket, roomId, username]);

    // Create a peer for an existing user
    function createPeer(userToSignal, callerId, stream) {
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket.emit('sending-signal', { userToSignal, callerId, signal, username });
        });

        return peer;
    }

    // Add a peer for a new user
    function addPeer(incomingSignal, callerId, stream) {
        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream,
        });

        peer.on('signal', signal => {
            socket.emit('returning-signal', { signal, callerId });
        });

        peer.signal(incomingSignal);

        return peer;
    }

    // Toggle audio
    const toggleAudio = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !audioEnabled;
            });
            setAudioEnabled(!audioEnabled);
        }
    };

    // Toggle video
    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
                track.enabled = !videoEnabled;
            });
            setVideoEnabled(!videoEnabled);
        }
    };

    // const handleReconnection = (userId) => { // creating it as test
    //     const item = peersRef.current.find(p => p.peerId === userId);
    //     if (!item) return;
    
    //     // Recreate the peer if connection drops
    //     const peer = createPeer(userId, socket.id, stream);
    //     peersRef.current.push({ peerId: userId, peer, username: item.username });
    //     setPeers(prev => [...prev, { peerId: userId, peer, username: item.username }]);
    //   };
    
    //   socket.on('user-reconnected', (userId) => {
    //     handleReconnection(userId);
    //   });

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 p-4 overflow-auto">
                <VideoGrid peers={peers} userVideo={userVideo} />
            </div>
            <VideoControls
                audioEnabled={audioEnabled}
                videoEnabled={videoEnabled}
                toggleAudio={toggleAudio}
                toggleVideo={toggleVideo}
            />
        </div>
    );
};

export default VideoConference;