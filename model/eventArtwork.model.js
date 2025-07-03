// model/eventConfig.model.js
const mongoose = require('mongoose');

const eventConfigSchema = new mongoose.Schema({
  artworkUrl: { type: String },  
  uploadedAt: { type: Date },

 
  date: { type: Date },
  venue: { type: String },
  time: { type: String },
  ticketNote: { type: String },

  updatedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('EventConfig', eventConfigSchema);
