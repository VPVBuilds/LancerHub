const express = require('express');
const router  = express.Router();
const { uploadAvatar, uploadPortfolioImage, uploadAttachment } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');
const upload   = require('../middleware/upload');

router.post('/avatar',     protect, upload.single('avatar'),     uploadAvatar);
router.post('/portfolio',  protect, upload.single('image'),      uploadPortfolioImage);
router.post('/attachment', protect, upload.single('attachment'), uploadAttachment);

module.exports = router;
