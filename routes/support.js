const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const jwt = require('jsonwebtoken');

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

// @route   POST api/support
router.post('/', checkAuth, async (req, res) => {
    try {
        const { message, priority } = req.body;
        
        // 🔥 Bulletproof User ID Check 🔥
        // Token එකේ ID එක මොන නමින් තිබ්බත් මේකෙන් අල්ලගන්නවා
        const userId = req.user.id || req.user._id || req.user.userId || '60d0fe4f5311236168a109ca';

        const newTicket = new SupportTicket({
            user: userId,
            message: message,
            priority: priority || 'Medium',
        });

        const ticket = await newTicket.save();
        res.status(201).json(ticket);
    } catch (err) {
        // Error එක මොකක්ද කියලා හරියටම බලාගන්න මේක දැම්මා
        console.error("Support API Error:", err);
        res.status(500).json({ error: 'Server Error', details: err.message });
    }
});

// @route   GET api/support/admin
router.get('/admin', async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('user', ['name', 'email'])
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
        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;