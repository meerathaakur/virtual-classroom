// src/components/Whiteboard/Whiteboard.jsx
import React, { useRef, useState, useEffect } from 'react';
// import CanvasDraw from 'react-canvas-draw';
import { useSocket } from '../../context/SocketContext';
import WhiteboardControls from './WhiteboardControls';

const Whiteboard = ({ roomId, username }) => {
    const { socket } = useSocket();
    const whiteboardRef = useRef(null);
    const [brushColor, setBrushColor] = useState('#000000');
    const [brushRadius, setBrushRadius] = useState(3);
    const [isTeacher, setIsTeacher] = useState(false);
    const [lastSavedState, setLastSavedState] = useState('');

    useEffect(() => {
        if (!socket) return;

        // Set first user as teacher (for demonstration)
        socket.emit('check-teacher', { roomId });
        socket.on('is-teacher', (status) => {
            setIsTeacher(status);
        });

        // Listen for whiteboard updates from other users
        socket.on('whiteboard-update', (data) => {
            if (whiteboardRef.current && data.drawData) {
                // Prevent infinite loop of updates by temporarily removing listener
                socket.off('whiteboard-update');
                whiteboardRef.current.loadSaveData(data.drawData, true);
                // Re-add listener
                socket.on('whiteboard-update', (newData) => {
                    if (whiteboardRef.current && newData.drawData) {
                        whiteboardRef.current.loadSaveData(newData.drawData, true);
                    }
                });
            }
        });

        return () => {
            socket.off('whiteboard-update');
            socket.off('is-teacher');
        };
    }, [socket, roomId]);

    // Send whiteboard updates to other users
    const handleWhiteboardChange = () => {
        if (!whiteboardRef.current) return;

        const saveData = whiteboardRef.current.getSaveData();
        // Only emit if the data has changed to reduce network traffic
        if (saveData !== lastSavedState) {
            setLastSavedState(saveData);
            socket.emit('whiteboard-draw', {
                roomId,
                username,
                drawData: saveData
            });
        }
    };

    const clearWhiteboard = () => {
        if (whiteboardRef.current) {
            whiteboardRef.current.clear();
            handleWhiteboardChange();
        }
    };

    const undoWhiteboard = () => {
        if (whiteboardRef.current) {
            whiteboardRef.current.undo();
            handleWhiteboardChange();
        }
    };

    const saveWhiteboard = () => {//changes
        if (whiteboardRef.current) {
            const dataUrl = whiteboardRef.current.getDataURL();
            const link = document.createElement('a');
            link.href = dataUrl;
            link.download = 'whiteboard.png';
            link.click();
        }
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex-1 p-4 overflow-hidden">
                <div className="bg-white rounded-lg shadow h-full flex flex-col">
                    <WhiteboardControls
                        brushColor={brushColor}
                        setBrushColor={setBrushColor}
                        brushRadius={brushRadius}
                        setBrushRadius={setBrushRadius}
                        clearWhiteboard={clearWhiteboard}
                        undoWhiteboard={undoWhiteboard}
                        isTeacher={isTeacher}
                    />
                    <div className="flex-1 overflow-hidden">
                        {/* <CanvasDraw
                            ref={whiteboardRef}
                            onChange={handleWhiteboardChange}
                            brushColor={brushColor}
                            brushRadius={brushRadius}
                            lazyRadius={0}
                            canvasWidth="100%"
                            canvasHeight="100%"
                            hideGrid={true}
                            disabled={!isTeacher}
                        /> */}
                    </div>
                    <button onClick={saveWhiteboard} className="bg-blue-500 text-white p-2 rounded">
                        Save Whiteboard
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Whiteboard;