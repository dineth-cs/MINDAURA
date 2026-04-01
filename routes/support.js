const express = require('express');
const router = express.Router();
const SupportTicket = require('../models/SupportTicket');

// ඔයාගේ Auth Middleware එක මෙතනින් Import කරගන්න
// (Token එකෙන් User කවුද කියලා අඳුරගන්න එකයි, Admin ද කියලා බලන එකයි)
const { protect, admin } = require('../middleware/authMiddleware'); 

// @route   POST api/support
// @desc    Submit a support ticket
router.post('/', protect, async (req, res) => {
    try {
        const { message, priority } = req.body;
        
        // protect middleware එකෙන් එන නියම User ID එක මෙතනට දානවා (req.user._id)
        const newTicket = new SupportTicket({
            user: req.user._id, 
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
router.get('/admin', protect, admin, async (req, res) => {
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
// @desc    Mark a ticket as resolved (Admin Only)
router.put('/admin/:id/resolve', protect, admin, async (req, res) => {
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