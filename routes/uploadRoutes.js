const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload');

// Route: POST /api/v1/upload
// Uses multer's .single() method to look for a file attached to the name 'image'
router.post('/', upload.single('image'), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ success: false, error: 'Please upload a file' });
        }
        
        // Return the path so the frontend can save it to the database
        res.status(200).json({
            success: true,
            // We return /uploads/filename.jpg
            url: `/${req.file.path.replace(/\\/g, "/")}` // Regex fixes Windows path slashes
        });
    } catch (error) {
        res.status(500).json({ success: false, error: error.message });
    }
});

module.exports = router;