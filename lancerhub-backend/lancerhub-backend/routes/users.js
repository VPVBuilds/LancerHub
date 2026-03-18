const express = require('express');
const router  = express.Router();
const {
  getFreelancers, getUser, updateProfile,
  updateAvatar, getPortfolio, getDashboard,
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const upload = require('../middleware/upload');

// Public
router.get('/',           getFreelancers);        // GET /api/users?skills=React&minRate=50
router.get('/dashboard',  protect, getDashboard); // GET /api/users/dashboard
router.get('/:id',        getUser);               // GET /api/users/:id
router.get('/:id/portfolio', getPortfolio);       // GET /api/users/:id/portfolio

// Private
router.put('/profile', protect, updateProfile);   // PUT /api/users/profile
router.put('/avatar',  protect, upload.single('avatar'), updateAvatar);

module.exports = router;
