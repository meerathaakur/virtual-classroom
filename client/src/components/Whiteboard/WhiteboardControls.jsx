// src/components/Whiteboard/WhiteboardControls.jsx
import React from 'react';
// import { ArrowLeftIcon, XIcon } from '@heroicons/react/outline';

const WhiteboardControls = ({
    brushColor,
    setBrushColor,
    brushRadius,
    setBrushRadius,
    clearWhiteboard,
    undoWhiteboard,
    isTeacher
}) => {
    const colorOptions = [
        '#000000', // Black
        '#FF0000', // Red
        '#00FF00', // Green
        '#0000FF', // Blue
        '#FFFF00', // Yellow
        '#FF00FF', // Magenta
        '#00FFFF', // Cyan
    ];

    const brushSizes = [2, 4, 8, 12];

    return (
        <div className="bg-gray-100 p-3 border-b border-gray-200 flex items-center justify-between">
            <div className="flex items-center space-x-6">
                {/* Colors */}
                <div className="flex items-center space-x-1">
                    {colorOptions.map(color => (
                        <button
                            key={color}
                            className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                            style={{ backgroundColor: color }}
                            onClick={() => setBrushColor(color)}
                            disabled={!isTeacher}
                        />
                    ))}
                </div>

                {/* Brush sizes */}
                <div className="flex items-center space-x-2">
                    {brushSizes.map(size => (
                        <button
                            key={size}
                            className={`w-8 h-8 flex items-center justify-center rounded ${brushRadius === size ? 'bg-gray-300' : 'bg-white'}`}
                            onClick={() => setBrushRadius(size)}
                            disabled={!isTeacher}
                        >
                            <div
                                className="rounded-full bg-black"
                                style={{ width: size, height: size }}
                            />
                        </button>
                    //     <button
                    //     key={color}
                    //     className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    //     style={{ backgroundColor: color }}
                    //     onClick={() => setBrushColor(color)}
                    //     disabled={!isTeacher}
                    //     title={`Select ${color}`}
                    //   />

                    // <button
                    //     key={color}
                    //     className={`w-6 h-6 rounded-full ${brushColor === color ? 'ring-2 ring-offset-2 ring-primary' : ''}`}
                    //     style={{ backgroundColor: color }}
                    //     onClick={() => setBrushColor(color)}
                    //     disabled={!isTeacher}
                    //     title={`Select ${color}`}
                    //     >
                    //     </button>

                    //     <button
                    //     key={size}
                    //     className={`w-8 h-8 flex items-center justify-center rounded ${brushRadius === size ? 'bg-gray-300' : 'bg-white'}`}
                    //     onClick={() => setBrushRadius(size)}
                    //     disabled={!isTeacher}
                    //     title={`Brush size: ${size}px`}
                    //     >
                    //     <div 
                    //         className="rounded-full bg-black" 
                    //         style={{ width: size, height: size }}
                    //     />
                    //     </button>
                    ))}
                </div>
            </div>

            <div className="flex items-center space-x-2">
                <button
                    className="p-2 bg-white rounded hover:bg-gray-200"
                    onClick={undoWhiteboard}
                    disabled={!isTeacher}
                    title="Undo"
                >
                    {/* <ArrowLeftIcon className="h-5 w-5" /> */}
                </button>

                <button
                    className="p-2 bg-white rounded hover:bg-gray-200"
                    onClick={clearWhiteboard}
                    disabled={!isTeacher}
                    title="Clear"
                >
                    {/* <XIcon className="h-5 w-5" /> */}
                </button>

                {!isTeacher && (
                    <span className="text-sm text-gray-600">View Only Mode</span>
                )}
            </div>
        </div>
    );
};

export default WhiteboardControls;