const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');

// Initialize environment variables
dotenv.config();

// Set up the Express app
const app = express();

// Apply middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

const authRoutes = require('./routes/auth');
app.use('/api/auth', authRoutes);

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("Successfully connected to MongoDB"))
    .catch((err) => console.log("MongoDB connection error:", err));

// Simple test route
app.get('/', (req, res) => {
    res.send('MindAura Backend is successfully running!');
});

// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
