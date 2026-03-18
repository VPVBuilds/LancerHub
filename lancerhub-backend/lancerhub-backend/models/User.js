const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      maxlength: [80, 'Name cannot exceed 80 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email format'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false, // never return password in queries
    },
    role: {
      type: String,
      enum: ['freelancer', 'client', 'admin'],
      default: 'freelancer',
    },
    avatar: { type: String, default: '' },

    // ── Profile ──────────────────────────────
    title:    { type: String, maxlength: 120, default: '' },
    bio:      { type: String, maxlength: 1000, default: '' },
    location: { type: String, default: '' },
    website:  { type: String, default: '' },
    skills:   [{ type: String }],
    languages:[{ type: String }],

    // Freelancer-specific
    hourlyRate: { type: Number, default: 0 },
    availability: {
      type: String,
      enum: ['available', 'busy', 'not_available'],
      default: 'available',
    },
    portfolio: [
      {
        title:       { type: String },
        description: { type: String },
        imageUrl:    { type: String },
        projectUrl:  { type: String },
      },
    ],

    // ── Stats ─────────────────────────────────
    totalEarned:     { type: Number, default: 0 },
    totalSpent:      { type: Number, default: 0 },
    jobsCompleted:   { type: Number, default: 0 },
    successRate:     { type: Number, default: 100 },
    avgRating:       { type: Number, default: 0 },
    totalReviews:    { type: Number, default: 0 },

    // ── Verification ──────────────────────────
    isVerified:       { type: Boolean, default: false },
    isEmailVerified:  { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    resetPasswordToken:   { type: String, select: false },
    resetPasswordExpire:  { type: Date,   select: false },

    // ── Stripe ────────────────────────────────
    stripeCustomerId: { type: String, select: false },
    stripeAccountId:  { type: String, select: false },

    lastSeen: { type: Date, default: Date.now },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

// ── Hash password before save ─────────────────
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// ── Instance methods ──────────────────────────
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

UserSchema.methods.getSignedJWT = function () {
  return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '30d',
  });
};

// ── Indexes ───────────────────────────────────
UserSchema.index({ email: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ skills: 1 });
UserSchema.index({ location: 1 });
UserSchema.index({ avgRating: -1 });

module.exports = mongoose.model('User', UserSchema);
