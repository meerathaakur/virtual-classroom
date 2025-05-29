// src/components/Communication/DocumentSharing.jsx
import React, { useState, useEffect } from 'react';
import { useSocket } from '../../context/SocketContext';
// import { DocumentIcon, DownloadIcon, UploadIcon, XIcon } from '@heroicons/react/outline';

const DocumentSharing = ({ roomId, username }) => {
    const { socket } = useSocket();
    const [files, setFiles] = useState([]);
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        if (!socket) return;

        // Listen for shared files
        socket.on('file-shared', (fileData) => {
            setFiles(prev => [...prev, fileData]);
        });

        // Get existing files when joining
        socket.emit('get-files', { roomId });
        socket.on('all-files', (allFiles) => {
            setFiles(allFiles);
        });

        return () => {
            socket.off('file-shared');
            socket.off('all-files');
        };
    }, [socket, roomId]);

    const handleFileUpload = (e) => {
        const file = e.target.files[0];
        if (!file || !socket) return;

        setUploading(true);

        // Convert file to base64 for simple demo purposes
        // In a real app, you might use a file storage service
        const reader = new FileReader();
        reader.onload = () => {
            const base64File = reader.result;

            // For demo purposes, limit file size
            if (base64File.length > 5000000) { // ~5MB limit
                alert('File too large. Please choose a smaller file.');
                setUploading(false);
                return;
            }

            const fileData = {
                id: Date.now().toString(),
                name: file.name,
                type: file.type,
                size: file.size,
                data: base64File,
                uploadedBy: username,
                roomId,
                timestamp: new Date().toISOString()
            };

            // Share file with room
            socket.emit('share-file', fileData);

            // Add to local state
            setFiles(prev => [...prev, fileData]);
            setUploading(false);
        };

        reader.readAsDataURL(file);
    };

    const downloadFile = (file) => {
        const link = document.createElement('a');
        link.href = file.data;
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatSize = (bytes) => {
        if (bytes < 1024) return bytes + ' bytes';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
        else return (bytes / 1048576).toFixed(1) + ' MB';
    };

    const formatTime = (timestamp) => {
        const date = new Date(timestamp);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getFileIcon = (fileType) => {
        if (fileType.includes('image')) return '🖼️';
        if (fileType.includes('pdf')) return '📄';
        if (fileType.includes('word') || fileType.includes('document')) return '📝';
        if (fileType.includes('spreadsheet') || fileType.includes('excel')) return '📊';
        if (fileType.includes('presentation') || fileType.includes('powerpoint')) return '📑';
        return '📁';
    };

    return (
        <div className="h-full flex flex-col p-4">
            <div className="bg-white rounded-lg shadow flex-1 flex flex-col overflow-hidden">
                {/* Header with upload button */}
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-lg font-semibold">Shared Documents</h2>
                    <label className="btn btn-primary flex items-center cursor-pointer">
                        {/* <UploadIcon className="h-5 w-5 mr-2" /> */}
                        {uploading ? 'Uploading...' : 'Upload File'}
                        <input
                            type="file"
                            className="hidden"
                            onChange={handleFileUpload}
                            disabled={uploading}
                        />
                    </label>
                </div>

                {/* Files list */}
                <div className="flex-1 p-4 overflow-y-auto">
                    {files.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-full text-gray-500">
                            {/* <DocumentIcon className="h-12 w-12 mb-2" /> */}
                            <p>No documents shared yet</p>
                            <p className="text-sm mt-1">Upload a file to share with the class</p>
                        </div>
                    ) : (
                        <div className="grid gap-4 grid-cols-1 md:grid-cols-2">
                            {files.map((file) => (
                                <div
                                    key={file.id}
                                    className="border border-gray-200 rounded-lg p-3 flex"
                                >
                                    <div className="text-3xl mr-3">{getFileIcon(file.type)}</div>
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">{file.name}</div>
                                        <div className="text-gray-500 text-sm">
                                            {formatSize(file.size)} • Shared by {file.uploadedBy}
                                        </div>
                                        <div className="text-gray-500 text-xs mt-1">
                                            {formatTime(file.timestamp)}
                                        </div>
                                    </div>
                                    <button
                                        className="p-2 text-primary hover:bg-gray-100 rounded-full"
                                        onClick={() => downloadFile(file)}
                                        title="Download"
                                    >
                                        {/* <DownloadIcon className="h-5 w-5" /> */}
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default DocumentSharing;