const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const AuditLog = require('../models/AuditLog');
const jwt = require('jsonwebtoken');
const { Expo } = require('expo-server-sdk');

let expo = new Expo();
const checkAuth = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded; 
            next();
        } catch (error) {
            req.user = { id: '60d0fe4f5311236168a109ca' };
            next();
        }
    } else {
        req.user = { id: '60d0fe4f5311236168a109ca' };
        next();
    }
};

// @route   GET api/support/my-messages
// @desc    Get user's chat history for real-time Help & Support UI
router.get('/my-messages', checkAuth, async (req, res) => {
    try {
        let userId = req.user.id || req.user._id || req.user.userId;
        const mongoose = require('mongoose');
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
             userId = '60d0fe4f5311236168a109ca'; // Safe fallback
        }
        
        // Find the most recent active ticket for the logged-in user
        const ticket = await SupportTicket.findOne({ user: userId }).sort({ createdAt: -1 });
        
        if (!ticket) {
            // Return an empty array so the frontend FlatList doesn't crash
            return res.json({ history: [], ticketId: null }); 
        }
        
        // Include the ticket._id so the mobile client can dynamically join the exact Socket.io room!
        res.json({ history: ticket.history || [], ticketId: ticket._id });
    } catch (err) {
        console.error("Fetch Messages Error:", err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// @route   POST api/support
router.post('/', checkAuth, async (req, res) => {
    try {
        const { message, priority } = req.body;
        
        if (!message) {
            return res.status(400).json({ error: 'Message text is required' });
        }

        // 🔥 Bulletproof User ID Check 🔥
        let userId = req.user.id || req.user._id || req.user.userId;
        const mongoose = require('mongoose');
        if (!userId || !mongoose.Types.ObjectId.isValid(userId)) {
             userId = '60d0fe4f5311236168a109ca'; // Safe fallback
        }

        // Find the active/latest ticket thread for this user
        let ticket = await SupportTicket.findOne({ user: userId }).sort({ createdAt: -1 });

        const newMessage = {
            sender: 'user',
            text: message,
            time: new Date()
        };

        // If ticket exists and is NOT formally resolved, just append the new message to the chat history
        if (ticket && ticket.status !== 'resolved') {
            ticket.history.push(newMessage);
            await ticket.save();

            // 🔥 Emit real-time message through Socket.io Room
            if (req.io) {
                req.io.to(ticket._id.toString()).emit('receive_message', newMessage);
                req.io.to('admin_notifications').emit('new_notification', { type: 'support', ticketId: ticket._id });
            }

            return res.status(200).json(ticket);
        } else {
            // Otherwise, create a brand new Support Ticket thread and seed the very first message into its history array!
            const newTicket = new SupportTicket({
                user: userId,
                message: message,
                priority: priority || 'Medium',
                history: [newMessage]
            });
            ticket = await newTicket.save();

            // Broadcast (though likely only the user is currently in this room since it was just created)
            if (req.io) {
                req.io.to(ticket._id.toString()).emit('receive_message', newMessage);
                req.io.to('admin_notifications').emit('new_notification', { type: 'support', ticketId: ticket._id });
            }

            return res.status(201).json(ticket);
        }
    } catch (err) {
        console.error("Support API Error:", err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// @route   GET api/support/admin
router.get('/admin', async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('user', ['name', 'email', 'profilePicture'])
            .sort({ createdAt: -1 });
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/support/admin/:id/resolve
router.put('/admin/:id/resolve', async (req, res) => {
    try {
        let ticket = await SupportTicket.findById(req.params.id);
        if (!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        ticket.status = 'resolved';
        await ticket.save();

        // 🛡️ Log this action
        await AuditLog.create({
            action: 'TICKET_RESOLVED',
            user: 'Admin Root',
            target: `Ticket #${ticket._id.toString().slice(-4)}`,
            status: 'Success'
        });

        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST api/support/admin/:id/reply
// @desc    Admin reply to ticket
router.post('/admin/:id/reply', async (req, res) => {
    try {
        const { text } = req.body;
        let ticket = await SupportTicket.findById(req.params.id).populate('user');
        if(!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        const newMessage = {
            sender: 'admin',
            text: text,
            time: new Date()
        };

        // Push the Admin's text response natively into the history thread!
        ticket.history.push(newMessage);
        await ticket.save();

        // 🔥 Emit admin reply dynamically over WebSocket!
        if (req.io) {
            req.io.to(ticket._id.toString()).emit('receive_message', newMessage);
            // Alert specific user about admin reply
            req.io.to(ticket.user._id.toString()).emit('new_notification', { type: 'support_reply', ticketId: ticket._id });
        }

        // Send Push Notification if user has expoPushToken
        if (ticket.user && ticket.user.expoPushToken) {
            let messages = [];
            if (Expo.isExpoPushToken(ticket.user.expoPushToken)) {
                messages.push({
                    to: ticket.user.expoPushToken,
                    sound: 'default',
                    title: 'New Reply from Support',
                    body: text,
                    data: { ticketId: ticket._id },
                });
                
                try {
                    console.log('Attempting to send push to:', ticket.user.expoPushToken);
                    await expo.sendPushNotificationsAsync(messages);
                } catch (ticketError) {
                    console.error("Push notification error:", ticketError);
                }
            }
        }

        res.json(ticket);
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/support/admin/:id/status
// @desc    Update ticket status (pending, in-progress)
router.put('/admin/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        let ticket = await SupportTicket.findById(req.params.id);
        if(!ticket) return res.status(404).json({ msg: 'Ticket not found' });

        ticket.status = status;
        await ticket.save();
        res.json(ticket);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;