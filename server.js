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
const supportRoutes = require('./routes/support');

app.use('/api/auth', authRoutes);
app.use('/api/support', supportRoutes);

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


const support = require('./routes/support');
app.use('/api/support', support);

// මේක උඩින්ම හරි, අනිත් require තියෙන තැනින් හරි දාන්න
const supportRoutes = require('./routes/support');

// මේක අනිත් app.use තියෙන තැනින් දාන්න
app.use('/api/support', supportRoutes);
