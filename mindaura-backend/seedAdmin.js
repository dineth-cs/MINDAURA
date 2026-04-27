require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

// Pointing to your User model
const User = require('./models/User'); 

async function seedAdmin() {
    try {
        // 1. Connect to MongoDB using process.env.MONGO_URI
        // Includes { family: 4 } to bypass the querySrv ENOTFOUND local DNS issue
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/mindaura';
        await mongoose.connect(MONGO_URI, { family: 4 });
        console.log("✅ Successfully connected to MongoDB for seeding.");

        const email = 'admin@mindaura.com';
        const rawPassword = 'password123';

        // Optional: Check if one exists to avoid duplicate key errors
        let existingUser = await User.findOne({ email });
        if (existingUser) {
            console.log("⚠️ Admin user already existed. Dropping old record to recreate.");
            await User.deleteOne({ email });
        }

        // 2. Hash the password 'password123' using bcrypt
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(rawPassword, salt);

        // 3. Create and save a new admin user with the correct flags
        const newAdmin = new User({
            name: "Master Admin",
            email: email,
            password: hashedPassword,
            isAdmin: true, // Ensuring this user has full admin panel access
        });

        await newAdmin.save();
        console.log(`\n🎉 Admin user successfully authored and saved to MongoDB!`);
        console.log(`➡️ Email: ${email}`);
        console.log(`➡️ Password: ${rawPassword}`);
        console.log(`\nYou can now log in securely at the admin panel.`);

    } catch (error) {
        console.error("❌ Error seeding admin user:", error);
    } finally {
        // 4. Disconnect from the database and exit
        console.log("Cleaning up and disconnecting from database...");
        await mongoose.disconnect();
        process.exit(0);
    }
}

// Execute the function
seedAdmin();
