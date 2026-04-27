const mongoose = require('mongoose');

const AuditLogSchema = new mongoose.Schema(
    {
        action: {
            type: String,
            required: true, // e.g., 'ADMIN_LOGIN', 'USER_BAN', 'CONFIG_UPDATE'
        },
        user: {
            type: String, // Initiator name or ID
            required: true,
        },
        target: {
            type: String, // Target node or user ID
            default: 'N/A',
        },
        status: {
            type: String,
            enum: ['Success', 'Failed', 'Blocked'],
            default: 'Success',
        },
        ip: {
            type: String,
            default: '0.0.0.0',
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model('AuditLog', AuditLogSchema);
