// src/components/VideoConference/VideoGrid.jsx
import React, { useEffect, useRef } from 'react';

const VideoGrid = ({ peers, userVideo }) => {
    const videoRefs = useRef(new Map());

    useEffect(() => {
        peers.forEach(peer => {
            peer.peer.on('stream', stream => {
                if (videoRefs.current.has(peer.peerId)) {
                    const videoElement = videoRefs.current.get(peer.peerId);
                    if (videoElement) {
                        videoElement.srcObject = stream;
                    }
                }
            });
        });
    }, [peers]);

    const gridColsClass = () => {
        const count = peers.length + 1; // +1 for user's own video
        if (count === 1) return 'grid-cols-1';
        if (count === 2) return 'grid-cols-2';
        if (count <= 4) return 'grid-cols-2';
        if (count <= 9) return 'grid-cols-3';
        return 'grid-cols-4';
    };

    return (
        <div className={`grid ${gridColsClass()} gap-4 h-full`}>
            {/* User's own video */}
            <div className="relative bg-gray-800 rounded-lg overflow-hidden">
                <video
                    ref={userVideo}
                    muted
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                />
                {/* <video
                    ref={el => {
                        if (el) {
                            videoRefs.current.set(peer.peerId, el);
                        }
                    }}
                    onError={(e) => { e.target.srcObject = null; }}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                /> */}
                <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                    You
                </div>
            </div>

            {/* Peers videos */}
            {peers.map(peer => (
                <div key={peer.peerId} className="relative bg-gray-800 rounded-lg overflow-hidden">
                    <video
                        ref={el => {
                            if (el) {
                                videoRefs.current.set(peer.peerId, el);
                            }
                        }}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-2 left-2 bg-gray-900 bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                        {peer.username || 'Peer'}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default VideoGrid;