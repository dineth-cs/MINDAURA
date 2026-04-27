const AuditLog = require('../models/AuditLog');

const auditMiddleware = async (req, res, next) => {
    // Only log write operations (POST, PUT, DELETE) on admin routes
    if (['POST', 'PUT', 'DELETE'].includes(req.method)) {
        const path = req.originalUrl;
        
        // Skip logs for login attempts themselves (optional, but cleaner)
        if (path.includes('login')) return next();

        // Capture early response finish to log the final status
        res.on('finish', async () => {
            try {
                // Common action naming based on path
                let action = 'ADMIN_ACTION';
                if (path.includes('users')) action = 'USER_MODIFICATION';
                if (path.includes('support')) action = 'SUPPORT_INTERACTION';
                if (path.includes('status')) action = 'STATUS_UPDATE';
                if (path.includes('reply')) action = 'TICKET_REPLY';

                await AuditLog.create({
                    action: `${req.method}_${action}`,
                    user: req.user ? (req.user.name || req.user.email || 'Admin User') : 'System Admin',
                    target: path.split('/').pop() || 'Global',
                    status: res.statusCode >= 400 ? 'Failed' : 'Success',
                    ip: req.ip || req.connection.remoteAddress || '0.0.0.0',
                    timestamp: new Date()
                });
            } catch (err) {
                console.error("Audit Middleware Error:", err);
            }
        });
    }
    next();
};

module.exports = auditMiddleware;
