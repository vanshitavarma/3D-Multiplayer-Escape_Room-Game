require('dotenv').config();
const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
// Removed MongoDB connection as it is no longer required

const app = express();
const server = http.createServer(app);

// Middleware
app.use(cors());
app.use(express.json());

// Socket.io Setup
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for LAN testing
        methods: ["GET", "POST"]
    }
});

// Import the logic handling socket events
const registerSocketHandlers = require('./socket/roomHandlers');

io.on('connection', (socket) => {
    console.log(`User Connected: ${socket.id}`);
    registerSocketHandlers(io, socket);

    socket.on('disconnect', () => {
        console.log(`User Disconnected: ${socket.id}`);
    });
});

app.get('/api/status', (req, res) => {
    res.send('Escape Room API is running...');
});

const path = require('path');
if (process.env.NODE_ENV === "production") {
    // Static files output by Vite
    app.use(express.static(path.join(__dirname, '../client/dist')));

    // Any other request goes to the React app
    app.get(/(.*)/, (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client', 'dist', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('Escape Room API is running in development mode...');
    });
}

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
