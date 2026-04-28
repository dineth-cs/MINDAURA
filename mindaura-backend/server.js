const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const http = require('http');
const { Server } = require("socket.io");

// Initialize environment variables
dotenv.config();

// Set up the Express app
const app = express();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.io
const io = new Server(server, {
    cors: {
        origin: "*", // Allowed for all requests (Mobile & Web)
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

// Middleware to inject the 'io' instance so it can strictly be used in our routes
app.use((req, res, next) => {
    req.io = io;
    next();
});

// Apply middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Routes
const authRoutes = require('./routes/auth');
const supportRoutes = require('./routes/support');
const adminRoutes = require('./routes/admin');
const emotionRoutes = require('./routes/emotion');
const journalRoutes = require('./routes/journal');
const chatRoutes = require('./routes/chatRoutes');
const auditMiddleware = require('./middleware/auditMiddleware');

// Mount routes
app.use('/api/auth', authRoutes);
app.use('/api/support', auditMiddleware, supportRoutes);
app.use('/api/admin', auditMiddleware, adminRoutes);
app.use('/api/emotion', emotionRoutes);
app.use('/api/journal', journalRoutes);
app.use('/api/chat', chatRoutes);

// Socket.io Listener Logic
io.on('connection', (socket) => {
    console.log('⚡ New Socket.io client connected:', socket.id);

    // Join Private User Room (for account status changes)
    socket.on('join_user', (userId) => {
        if (userId) {
            socket.join(userId);
            console.log(`🔌 User ${userId} joined their private room.`);
        }
    });

    // Join Admin Notifications Room
    socket.on('join_admin', () => {
        socket.join('admin_notifications');
        console.log(`🔌 Admin ${socket.id} joined global admin notification room.`);
    });

    // Listen for users or admins joining specific ticket rooms
    socket.on('join_ticket', (ticketId) => {
        if (ticketId) {
            socket.join(ticketId);
            console.log(`🔌 Socket ${socket.id} successfully joined ticket room: ${ticketId}`);
        }
    });

    socket.on('disconnect', () => {
        console.log('❌ Client disconnected:', socket.id);
    });
});

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
    family: 4 // Forces IPv4 to bypass local DNS+SRV network errors
})
    .then(() => console.log("Successfully connected to MongoDB"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Simple test route
app.get('/', (req, res) => {
    res.send('MindAura Backend is successfully running! (Socket.io Enabled)');
});

// Start the server (Using the HTTP server instance now instead of Express natively!)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server is running with Socket.io on port ${PORT}`));