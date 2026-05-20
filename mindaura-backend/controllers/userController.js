const User = require('../models/User');
const MoodEntry = require('../models/MoodEntry');
const SupportTicket = require('../models/SupportTicket');

const clearUserData = async (req, res) => {
    try {
        const userId = req.user._id;

        // Soft delete: Hide the mood entry from the user but keep it for admin analytics
        await MoodEntry.updateMany({ user: userId }, { $set: { clearedByUser: true } });

        res.status(200).json({ message: "All your mood history has been cleared successfully." });
    } catch (error) {
        console.error("Clear data error:", error);
        res.status(500).json({ message: "Server error while clearing data." });
    }
};

const deleteUserAccount = async (req, res) => {
    try {
        const userId = req.user._id;

        // Cascade delete: Remove associated data and then the user
        await Promise.all([
            MoodEntry.deleteMany({ user: userId }),
            SupportTicket.deleteMany({ user: userId }),
            User.findByIdAndDelete(userId)
        ]);

        return res.status(200).json({ message: "Account and all associated data deleted successfully" });
    } catch (error) {
        console.error("Delete account error:", error);
        return res.status(500).json({ message: "Server error while deleting account" });
    }
};

module.exports = {
    clearUserData,
    deleteUserAccount
};
