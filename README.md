# virtual-classroom

## Introduction
A brief introduction of your project goes here. You may want to cover the purpose of your project, its core functionality, and what problems it solves.

## Project Type
Frontend | Backend | Fullstack

## Deplolyed App
Frontend: https://deployed-site.whatever
Backend: https://deployed-site.whatever
Database: https://deployed-site.whatever

## Directory Structure
my-app/
├─ backend/
├─ frontend/
│  ├─ ...

## Video Walkthrough of the project
Attach a very short video walkthough of all of the features [ 1 - 3 minutes ]

## Video Walkthrough of the codebase
Attach a very short video walkthough of codebase [ 1 - 5 minutes ]

## Features
List out the key features of your application.

- Feature 1
- Feature 2
- Feature 3

## design decisions or assumptions
List your design desissions & assumptions

## Installation & Getting started
Detailed instructions on how to install, configure, and get the project running. For BE/FS projects, guide the reviewer how to check mongodb schema etc.

```bash
npm install my-project
cd my-project
npm start
```

## Usage
Provide instructions and examples on how to use your project.

```bash
# Example
```

Include screenshots as necessary.

## Credentials
Provide user credentials for autheticated pages

## APIs Used
If your application relies on external APIs, document them and include any necessary links or references.

## API Endpoints
In case of Backend Applications provide a list of your API endpoints, methods, brief descriptions, and examples of request/response.
GET /api/items - retrieve all items
POST /api/items - create a new item


## Technology Stack
List and provide a brief overview of the technologies used in the project.

- Node.js
- Express.js
- MongoDB
- Other libraries/modules

### Virtual Classroom

**Context:**  
With the rise of remote learning, virtual classrooms have become an essential tool in modern education. They replicate the traditional classroom experience by enabling real-time collaboration between students and teachers. Key features such as video conferencing, interactive whiteboards, and document sharing create an immersive and interactive learning environment, making remote education effective and engaging.

**Project Goal:**  
Develop a web-based virtual classroom that supports seamless video conferencing, document sharing, and real-time collaboration through features like interactive whiteboards and chat. The goal is to create an intuitive and engaging interface that fosters communication and participation, mimicking the physical classroom experience in a digital setting.

---

**Key Frontend Features:**

### 1. **Video Conferencing Integration**

**Objective:**  
Allow students and teachers to interact through real-time video calls, ensuring smooth communication during virtual classes.

**Frontend Focus:**

- **Sleek Video Interface:** Design a responsive video interface that integrates with WebRTC or third-party APIs (like Zoom or Jitsi). Include intuitive controls for enabling/disabling audio and video, as well as screen-sharing options.
- **Live Status Indicators:** Provide live status indicators such as "speaking," "muted," or "raised hand" to keep participants informed during sessions.
- **Participant Grid:** Implement a grid layout that dynamically adjusts based on the number of participants, ensuring all students and teachers are visible during the session.
- **Responsive Controls:** Include easy-to-use buttons for video, microphone, and screen share, with hover animations and tooltips for better usability.

---

### 2. **Interactive Whiteboard**

**Objective:**  
Allow real-time collaboration through a virtual whiteboard where teachers and students can draw, write, and share ideas visually.

**Frontend Focus:**

- **Canvas-based Drawing Tools:** Use HTML5 Canvas APIs to build a responsive and collaborative whiteboard tool. Users can draw, write, and sketch in real time, with changes reflected instantly for all participants.
- **Multi-user Collaboration:** Enable both teachers and students to collaborate by adding features like color selection, line thickness controls, and various drawing tools (e.g., pen, highlighter).
- **Undo/Redo Options:** Provide undo/redo functionality for users, making it easier to correct mistakes during collaborative sessions.
- **Eraser & Clear Screen:** Include erasers for specific deletions and an option for teachers to clear the entire whiteboard when needed.

---

### 3. **Document Sharing and Chat**

**Objective:**  
Facilitate real-time document sharing and text-based communication during class sessions to support interaction and resource exchange.

**Frontend Focus:**

- **Drag-and-Drop File Sharing:** Create a drag-and-drop interface where students and teachers can upload documents, PDFs, or images during the session. Display live previews of shared documents in the chat for easy access.
- **Real-time Chat Interface:** Design a smooth, real-time chat interface that allows participants to send text messages, links, and notifications. Incorporate typing indicators and timestamps to make communication more fluid.
- **User Notifications:** Display real-time notifications when a new document is shared or when someone sends a message in the chat, ensuring no one misses important updates.
- **Chat Filters:** Allow participants to filter chat messages by types (e.g., “Questions,” “Files Shared”) to quickly find relevant information during the session.

---

### Advanced AI Feature

**AI-Powered Participation Insights:**  
Integrate AI to track student participation (e.g., how often they speak or use chat). Provide teachers with insights into student engagement levels.  
**Frontend Focus:**  
Visualize participation metrics in a dashboard with color-coded indicators, showing which students are active or passive during class.