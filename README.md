# RealTime_TaskManagement_System

A comprehensive task management application built with Node.js, Express, SQLite, and Socket.IO for real-time collaboration. This system allows users to create, update, and manage tasks in real-time, with live updates across all connected clients.

## Features

- **Real-time Task Management**: Create, update, delete, and assign tasks with instant synchronization across all users.
- **User Collaboration**: Multiple users can work on tasks simultaneously with live notifications.
- **Persistent Storage**: Tasks are stored in a SQLite database for reliability.
- **WebSocket Communication**: Utilizes Socket.IO for efficient real-time communication.
- **Responsive Frontend**: Built with HTML, CSS, and JavaScript for a seamless user experience.

## Technologies Used

- **Backend**:
  - Node.js
  - Express.js
  - SQLite3
  - Socket.IO

- **Frontend**:
  - HTML5
  - CSS3
  - JavaScript (ES6+)

## Installation

1. **Clone the repository**:
   ```bash
   git clone https://github.com/your-username/RealTime_TaskManagement_System.git
   cd RealTime_TaskManagement_System
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Start the server**:
   ```bash
   npm start
   ```

   The server will run on `http://localhost:3000`.

## Usage

1. Open your browser and navigate to `http://localhost:3000`.
2. Create new tasks, assign them, and collaborate in real-time with other users.
3. Tasks are automatically saved to the SQLite database and synced across all connected clients.

## API Endpoints

- `GET /tasks`: Retrieve all tasks.
- `POST /tasks`: Create a new task.
- `PUT /tasks/:id`: Update a task by ID.
- `DELETE /tasks/:id`: Delete a task by ID.

## Socket.IO Events

- `connection`: Fired when a client connects (provides socketId).
- `disconnect`: Fired when a client disconnects.
- `taskCreated`: Emitted when a new task is created.
- `taskUpdated`: Emitted when a task is updated.
- `taskDeleted`: Emitted when a task is deleted.

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request.

## License

This project is licensed under the MIT License.
