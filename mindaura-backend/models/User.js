const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
        },
        password: {
            type: String,
            required: true,
        },
        resetPasswordOtp: {
            type: String,
        },
        resetPasswordExpire: {
            type: Date,
        },
        profilePicture: {
            type: String,
            default: "", // Default is an empty string if no picture is provided
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        dateOfBirth: {
            type: Date,
        },
        age: {
            type: String,
        },
        expoPushToken: {
            type: String,
        },
        status: {
            type: String,
            enum: ['ACTIVE', 'SUSPENDED'],
            default: 'ACTIVE',
        },
        tier: {
            type: String,
            default: 'TIER 1',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('User', UserSchema);