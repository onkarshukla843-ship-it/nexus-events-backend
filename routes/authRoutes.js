const express = require('express');
// 👇 Cleaned up: Imported all 3 controller functions on one single line
const { register, login, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth'); 

const router = express.Router();

// Map the routes to the controller functions
router.post('/register', register);
router.post('/login', login);
router.put('/updatedetails', protect, updateProfile);

module.exports = router;