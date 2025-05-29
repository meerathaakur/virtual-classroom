// src/pages/LandingPage.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';

const LandingPage = () => {
    const [roomId, setRoomId] = useState('');
    const [username, setUsername] = useState(localStorage.getItem('username') || '');
    const [isCreating, setIsCreating] = useState(true);
    const navigate = useNavigate();

    const handleSubmit = (e) => {
        e.preventDefault();
        if (roomId.trim() && username.trim()) {
            // Store user info in localStorage
            const isValidRoom = validateRoom(roomId);
            if (!isValidRoom) {
                alert("Room ID does not exist");
                return;
            }
            localStorage.setItem('username', username);
            // Navigate to the classroom
            navigate(`/classroom/${roomId}`);
        }
    };
    const validateRoom = (roomId) => {
        // Example logic for checking if the room exists
        return roomId === '123'; // For demo purposes, only room '123' is valid
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
            <div className="max-w-md w-full p-6 bg-white rounded-lg shadow-lg">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-primary">Virtual Classroom</h1>
                    <p className="text-gray-600 mt-2">Connect, Collaborate, Learn</p>
                </div>

                <div className="flex mb-6">
                    <button
                        className={`flex-1 py-2 ${isCreating ? 'bg-primary text-white' : 'bg-gray-200'}`}
                        onClick={() => setIsCreating(true)}
                    >
                        Create Room
                    </button>
                    <button
                        className={`flex-1 py-2 ${!isCreating ? 'bg-primary text-white' : 'bg-gray-200'}`}
                        onClick={() => setIsCreating(false)}
                    >
                        Join Room
                    </button>
                </div>

                <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="username">
                            Your Name
                        </label>
                        <input
                            id="username"
                            type="text"
                            className="input w-full"
                            placeholder="Enter your name"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-6">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="roomId">
                            {isCreating ? 'Room Name' : 'Room ID'}
                        </label>
                        <input
                            id="roomId"
                            type="text"
                            className="input w-full"
                            placeholder={isCreating ? "Enter a room name" : "Enter room ID"}
                            value={roomId}
                            onChange={(e) => setRoomId(e.target.value)}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full btn btn-primary"
                    >
                        {isCreating ? 'Create & Join' : 'Join Room'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default LandingPage;


// import React, { useState } from 'react';
// import { useNavigate } from 'react-router-dom';

// const LandingPage = () => {
//     const [roomId, setRoomId] = useState('');
//     const navigate = useNavigate();

//     const handleJoinRoom = () => {
//         if (roomId) {
//             navigate(`/classroom/${roomId}`);
//         }
//     };

//     return (
//         <div className="flex items-center justify-center h-screen">
//             <div className="text-center">
//                 <h1 className="text-4xl font-bold">Welcome to the Virtual Classroom</h1>
//                 <input
//                     type="text"
//                     className="mt-4 p-2 border rounded"
//                     placeholder="Enter room ID"
//                     value={roomId}
//                     onChange={(e) => setRoomId(e.target.value)}
//                 />
//                 <button
//                     onClick={handleJoinRoom}
//                     className="mt-4 p-2 bg-blue-500 text-white rounded"
//                 >
//                     Join Classroom
//                 </button>
//             </div>
//         </div>
//     );
// };

// export default LandingPage;
