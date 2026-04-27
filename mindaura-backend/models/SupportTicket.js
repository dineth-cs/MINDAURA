const mongoose = require('mongoose');

const SupportTicketSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        message: {
            type: String,
            required: true,
        },
        status: {
            type: String,
            enum: ['pending', 'in-progress', 'resolved'],
            default: 'pending',
        },
        priority: {
            type: String,
            // අර Frontend එකේ තියෙන විදියටම කැපිටල් අකුරින් දැම්මා
            enum: ['Low', 'Medium', 'High'], 
            default: 'Medium',
        },
        history: [{
            sender: { type: String, enum: ['user', 'admin'] },
            text: String,
            time: { type: Date, default: Date.now }
        }],
    },
    { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);