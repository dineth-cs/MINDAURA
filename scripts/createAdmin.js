require('dotenv').config();
const mongoose = require('mongoose');
const bcryptjs = require('bcryptjs');
const User = require('../models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindaura';

async function createAdmin() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.error("Usage: node scripts/createAdmin.js <email> <password>");
        process.exit(1);
    }
    const [email, password] = args;

    try {
        await mongoose.connect(MONGO_URI);
        console.log("Connected to MongoDB.");

        let user = await User.findOne({ email });
        if (user) {
            console.log(`User ${email} already exists. Forcing upgrade to Admin level authorization...`);
            user.isAdmin = true;
            user.password = await bcryptjs.hash(password, 10);
            await user.save();
        } else {
            const hashedPassword = await bcryptjs.hash(password, 10);
            user = new User({
                name: "System Administrator",
                email,
                password: hashedPassword,
                isAdmin: true
            });
            await user.save();
        }
        
        console.log(`✅ Administrator ${email} successfully registered!`);
        console.log(`✅ You may now securely log in to the Dashboard at /admin/login.`);
        process.exit(0);
    } catch (err) {
        console.error("Exception during Admin injection:", err);
        process.exit(1);
    }
}

createAdmin();
