const cloudinary = require('cloudinary').v2;
const streamifier = require('streamifier');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Helper — stream buffer to Cloudinary
const uploadToCloudinary = (buffer, options = {}) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err);
      else resolve(result);
    });
    streamifier.createReadStream(buffer).pipe(stream);
  });
};

// @route   POST /api/uploads/avatar
// @access  Private
exports.uploadAvatar = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'lancerhub/avatars',
      public_id:      `user_${req.user.id}`,
      overwrite:      true,
      transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }],
    });

    const User = require('../models/User');
    await User.findByIdAndUpdate(req.user.id, { avatar: result.secure_url });

    res.json({ success: true, url: result.secure_url });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/uploads/portfolio
// @access  Private (freelancer)
exports.uploadPortfolioImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:         'lancerhub/portfolio',
      transformation: [{ width: 800, height: 600, crop: 'fill' }],
    });

    res.json({ success: true, url: result.secure_url, publicId: result.public_id });
  } catch (err) {
    next(err);
  }
};

// @route   POST /api/uploads/attachment
// @access  Private
exports.uploadAttachment = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: 'No file provided' });

    const result = await uploadToCloudinary(req.file.buffer, {
      folder:        'lancerhub/attachments',
      resource_type: 'auto',
    });

    res.json({
      success:  true,
      url:      result.secure_url,
      filename: req.file.originalname,
      size:     req.file.size,
      mimeType: req.file.mimetype,
    });
  } catch (err) {
    next(err);
  }
};
