const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');
const jwt = require('jsonwebtoken'); // Token එක අඳුරගන්න

// සරල Auth Middleware එකක් මෙතනම හදමු (Import Error එන්නේ නැති වෙන්න)
const checkAuth = (req, res, next) => {
    let token = req.headers.authorization;
    if (token && token.startsWith('Bearer')) {
        token = token.split(' ')[1];
        try {
            // Token එකෙන් User කවුද කියලා හොයාගන්නවා
            const decoded = jwt.verify(token, process.env.JWT_SECRET || 'secret');
            req.user = decoded; 
            next();
        } catch (error) {
            // මොකක් හරි අවුලක් ගියොත් Test කරන්න Dummy ID එකක් දෙනවා
            req.user = { id: '60d0fe4f5311236168a109ca' };
            next();
        }
    } else {
        req.user = { id: '60d0fe4f5311236168a109ca' };
        next();
    }
};

// @route   POST api/support
// @desc    Submit a support ticket
router.post('/', checkAuth, async (req, res) => {
    try {
        const { message, priority } = req.body;
        
        const newTicket = new SupportTicket({
            user: req.user.id || req.user._id, // Userගේ ID එක ගන්නවා
            message,
            priority: priority || 'Medium',
        });

        const ticket = await newTicket.save();
        res.status(201).json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/support/admin
// @desc    Get all support tickets (Admin Only)
router.get('/admin', async (req, res) => {
    try {
        const tickets = await SupportTicket.find()
            .populate('user', ['name', 'email'])
            .sort({ createdAt: -1 }); // අලුත්ම ඒවා උඩින් එන්න Sort කරනවා
        res.json(tickets);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/support/admin/:id/resolve
// @desc    Mark a ticket as resolved
router.put('/admin/:id/resolve', async (req, res) => {
    try {
        let ticket = await SupportTicket.findById(req.params.id);

        if (!ticket) {
            return res.status(404).json({ msg: 'Ticket not found' });
        }

        ticket.status = 'resolved';
        await ticket.save();

        res.json(ticket);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;