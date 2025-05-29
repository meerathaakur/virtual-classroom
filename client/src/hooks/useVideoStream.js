import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Custom hook for managing video streams in the virtual classroom
 * 
 * @param {Object} options - Configuration options for the video stream
 * @returns {Object} Video stream utilities and state
 */
const useVideoStream = (options = {}) => {
    const [localStream, setLocalStream] = useState(null);
    const [isVideoEnabled, setIsVideoEnabled] = useState(true);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [screenShareStream, setScreenShareStream] = useState(null);
    const [error, setError] = useState(null);
    const [deviceStatus, setDeviceStatus] = useState({
        video: 'pending',  // 'pending', 'available', 'unavailable', 'denied'
        audio: 'pending'
    });

    // Store peer connections in a ref to maintain between renders
    const peerConnectionsRef = useRef({});

    // Default video constraints
    const defaultConstraints = {
        video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user'
        },
        audio: {
            echoCancellation: true,
            noiseSuppression: true
        },
        ...options
    };

    // Initialize local media stream
    const initializeStream = useCallback(async (customConstraints = defaultConstraints) => {
        try {
            // Check if we already have a stream and clean it up
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }

            const newStream = await navigator.mediaDevices.getUserMedia(customConstraints);

            setLocalStream(newStream);
            setIsVideoEnabled(true);
            setIsAudioEnabled(true);
            setError(null);

            setDeviceStatus({
                video: newStream.getVideoTracks().length > 0 ? 'available' : 'unavailable',
                audio: newStream.getAudioTracks().length > 0 ? 'available' : 'unavailable'
            });

            return newStream;
        } catch (err) {
            console.error('Error accessing media devices:', err);

            // Set appropriate error states based on the error
            if (err.name === 'NotAllowedError') {
                setDeviceStatus({
                    video: customConstraints.video ? 'denied' : 'pending',
                    audio: customConstraints.audio ? 'denied' : 'pending'
                });
                setError('Permission to access camera or microphone was denied');
            } else if (err.name === 'NotFoundError') {
                setDeviceStatus({
                    video: customConstraints.video ? 'unavailable' : 'pending',
                    audio: customConstraints.audio ? 'unavailable' : 'pending'
                });
                setError('Required media devices not found');
            } else {
                setError(`Failed to access media: ${err.message}`);
            }

            return null;
        }
    }, [localStream, defaultConstraints]);

    // Function to toggle video
    const toggleVideo = useCallback(() => {
        if (!localStream) return;

        const videoTracks = localStream.getVideoTracks();
        videoTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        setIsVideoEnabled(videoTracks.length > 0 ? videoTracks[0].enabled : false);
    }, [localStream]);

    // Function to toggle audio
    const toggleAudio = useCallback(() => {
        if (!localStream) return;

        const audioTracks = localStream.getAudioTracks();
        audioTracks.forEach(track => {
            track.enabled = !track.enabled;
        });

        setIsAudioEnabled(audioTracks.length > 0 ? audioTracks[0].enabled : false);
    }, [localStream]);

    // Function to start screen sharing
    const startScreenSharing = useCallback(async () => {
        try {
            if (isScreenSharing) return;

            const stream = await navigator.mediaDevices.getDisplayMedia({
                video: {
                    cursor: 'always'
                },
                audio: false
            });

            // Handle when user stops screen sharing via the browser UI
            stream.getVideoTracks()[0].onended = () => {
                stopScreenSharing();
            };

            setScreenShareStream(stream);
            setIsScreenSharing(true);

            return stream;
        } catch (err) {
            console.error('Error starting screen share:', err);
            setError(`Screen sharing failed: ${err.message}`);
            return null;
        }
    }, [isScreenSharing]);

    // Function to stop screen sharing
    const stopScreenSharing = useCallback(() => {
        if (screenShareStream) {
            screenShareStream.getTracks().forEach(track => track.stop());
            setScreenShareStream(null);
        }
        setIsScreenSharing(false);
    }, [screenShareStream]);

    // Function to get available media devices
    const getAvailableDevices = useCallback(async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();

            return {
                videoDevices: devices.filter(device => device.kind === 'videoinput'),
                audioDevices: devices.filter(device => device.kind === 'audioinput'),
                audioOutputDevices: devices.filter(device => device.kind === 'audiooutput')
            };
        } catch (err) {
            console.error('Error getting available devices:', err);
            setError(`Failed to get available devices: ${err.message}`);
            return {
                videoDevices: [],
                audioDevices: [],
                audioOutputDevices: []
            };
        }
    }, []);

    // Function to switch camera device
    const switchCamera = useCallback(async (deviceId) => {
        try {
            const newConstraints = {
                ...defaultConstraints,
                video: {
                    ...defaultConstraints.video,
                    deviceId: { exact: deviceId }
                }
            };

            return await initializeStream(newConstraints);
        } catch (err) {
            console.error('Error switching camera:', err);
            setError(`Failed to switch camera: ${err.message}`);
            return null;
        }
    }, [defaultConstraints, initializeStream]);

    // Function to switch microphone
    const switchMicrophone = useCallback(async (deviceId) => {
        try {
            const newConstraints = {
                ...defaultConstraints,
                audio: {
                    ...defaultConstraints.audio,
                    deviceId: { exact: deviceId }
                }
            };

            return await initializeStream(newConstraints);
        } catch (err) {
            console.error('Error switching microphone:', err);
            setError(`Failed to switch microphone: ${err.message}`);
            return null;
        }
    }, [defaultConstraints, initializeStream]);

    // Clean up streams when component unmounts
    useEffect(() => {
        return () => {
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (screenShareStream) {
                screenShareStream.getTracks().forEach(track => track.stop());
            }

            // Close any peer connections
            Object.values(peerConnectionsRef.current).forEach(pc => {
                if (pc && typeof pc.close === 'function') {
                    pc.close();
                }
            });
        };
    }, [localStream, screenShareStream]);

    return {
        localStream,
        screenShareStream,
        isVideoEnabled,
        isAudioEnabled,
        isScreenSharing,
        deviceStatus,
        error,
        initializeStream,
        toggleVideo,
        toggleAudio,
        startScreenSharing,
        stopScreenSharing,
        getAvailableDevices,
        switchCamera,
        switchMicrophone,
        peerConnections: peerConnectionsRef.current
    };
};

export default useVideoStream;