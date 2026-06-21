const User = require('../models/UserModel.js');

// @desc    Register user
// @route   POST /api/v1/auth/register
// @access  Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role } = req.body;

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'Email already registered' });
        }

        // Create user
        const user = await User.create({
            name,
            email,
            password,
            role
        });

        sendTokenResponse(user, 201, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// @desc    Login user
// @route   POST /api/v1/auth/login
// @access  Public
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        // Validate email & password inputs
        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Please provide an email and password' });
        }

        // Check for user (must explicitly select password since we hid it in the Model)
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        // Check if password matches
        const isMatch = await user.matchPassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        sendTokenResponse(user, 200, res);
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
};

// Helper Function to get token from model, create cookie/response
const sendTokenResponse = (user, statusCode, res) => {
    // Create token
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
            avatar: user.avatar
        }
    });
};
// ==========================================
// Update User Profile (Name & Avatar)
// ==========================================
exports.updateProfile = async (req, res) => {
    try {
        const userId = req.user?._id || req.user?.id || req.userId;

        // 🚨 ADDED THE NEW FIELDS TO THE SAVE FUNCTION
        const updatedUser = await User.findByIdAndUpdate(
            userId,
            { 
                name: req.body.name, 
                avatar: req.body.avatar,
                bio: req.body.bio,
                phone: req.body.phone,
                location: req.body.location,
                website: req.body.website
            },
            { new: true, runValidators: true } 
        );

        res.status(200).json({ success: true, data: updatedUser });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
};
// module.exports = { register, login, getMe, updateProfile };