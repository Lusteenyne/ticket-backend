const mongoose = require('mongoose');

const NonCorperSchema = new mongoose.Schema({
  firstName: {
    type: String,
    required: true,
    trim: true,
  },

  lastName: {
    type: String,
    required: true,
    trim: true,
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },

  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },

  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },

  ticketId: {
    type: String,
    required: true,
    unique: true,
  },

  receipt: {
    type: String,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },
eventArtwork: { type: String, default: '' },


  date: { type: Date },
  venue: { type: String },
  time: { type: String },
  ticketNote: { type: String },

  localGov: {
    type: String,
    default: 'External',
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Automatically set localGov to 'external' if not provided
NonCorperSchema.pre('save', function (next) {
  if (!this.localGov) {
    this.localGov = 'external';
  }
  next();
});

module.exports = mongoose.model('NonCorper', NonCorperSchema);
