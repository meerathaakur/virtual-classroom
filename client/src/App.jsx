import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import ClassroomPage from './pages/ClassroomPage';
import LandingPage from './pages/LandingPage';
import { SocketProvider } from './context/SocketContext';

function App() {
  return (
    <SocketProvider>
      <Router>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/classroom/:roomId" element={<ClassroomPage />} />
        </Routes>
      </Router>
    </SocketProvider>
  );
}

export default App;