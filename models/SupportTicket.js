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
            enum: ['open', 'resolved'],
            default: 'open',
        },
        priority: {
            type: String,
            // අර Frontend එකේ තියෙන විදියටම කැපිටල් අකුරින් දැම්මා
            enum: ['Low', 'Medium', 'High'], 
            default: 'Medium',
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('SupportTicket', SupportTicketSchema);