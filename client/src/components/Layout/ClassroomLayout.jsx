import React from 'react';
import Header from './Header';
import Sidebar from './Sidebar';

const ClassroomLayout = () => {
  return (
    <div>
      <Header />
      <Sidebar />
      <div>
        {/* Main content area */}
      </div>
    </div>
  );
};

export default ClassroomLayout;
