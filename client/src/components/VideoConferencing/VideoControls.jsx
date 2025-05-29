
// src/components/VideoConference/VideoControls.jsx
import React from 'react';
// import { MicrophoneIcon, VideoCameraIcon, XIcon } from '@heroicons/react/solid';
// import { MicrophoneIcon as MicrophoneIconOutline, VideoCameraIcon as VideoCameraIconOutline } from '@heroicons/react/outline';

const VideoControls = ({ audioEnabled, videoEnabled, toggleAudio, toggleVideo }) => {
    return (
        <div className="bg-white p-4 border-t border-gray-200 flex justify-center space-x-6">
            <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-200' : 'bg-red-500 text-white'}`}
            >
                {/* {audioEnabled ? (
                    <MicrophoneIcon className="h-6 w-6" />
                ) : (
                    <MicrophoneIconOutline className="h-6 w-6" />
                )} */}
            </button>
            {/* <button
                onClick={toggleAudio}
                className={`p-3 rounded-full ${audioEnabled ? 'bg-gray-200' : 'bg-red-500 text-white'}`}
                aria-label={audioEnabled ? "Mute Audio" : "Unmute Audio"}
            >
                {audioEnabled ? (
                    <MicrophoneIcon className="h-6 w-6" />
                ) : (
                    <MicrophoneIconOutline className="h-6 w-6" />
                )}
            </button> */}
            <button
                onClick={toggleVideo}
                className={`p-3 rounded-full ${videoEnabled ? 'bg-gray-200' : 'bg-red-500 text-white'}`}
            >
                {/* {videoEnabled ? (
                    <VideoCameraIcon className="h-6 w-6" />
                ) : (
                    <VideoCameraIconOutline className="h-6 w-6" />
                )} */}
            </button>
        </div>
    );
};

export default VideoControls;