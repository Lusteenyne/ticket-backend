const mongoose = require('mongoose');

const CorperSchema = new mongoose.Schema({
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

  phoneNumber: {
    type: String,
    required: true,
    trim: true,
  },

  stateCode: {
    type: String,
    trim: true,
  },

  receipt: {
    type: String,
  },

  password: {
    type: String,
    required: true,
    select: false,
  },

  gender: {
    type: String,
    enum: ['male', 'female'],
    required: true,
  },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending',
  },

  eventArtwork: { type: String, default: '' },



  ticketId: {
    type: String,
    required: true,
    unique: true,
  },
date: { type: Date },
venue: { type: String },
time: { type: String },
ticketNote: { type: String },
localGov: { type: String },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Corper', CorperSchema);
