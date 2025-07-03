const express = require('express');
const eventrouter = express.Router();
const authenticateToken = require('../middleware/authenticateToken');
const { upload } = require('../utilis/cloudinary');
const {
  corperSignup,
  nonCorperSignup,
  corperLogin,
  nonCorperLogin,
  getAllCorpers,
  getAllNonCorpers,
  getCurrentUser,
  getEventInfo,
  sendTicketToEmail,
  getEventArtwork,
} = require('../controllers/event.controllers');

// Signup routes
eventrouter.post('/corper-signup', upload.single('receipt'), corperSignup);
eventrouter.post('/non-corper-signup', upload.single('receipt'), nonCorperSignup);

// Login routes
eventrouter.post('/corper-login', corperLogin);
eventrouter.post('/non-corper-login', nonCorperLogin);

// Protected fetch routes
eventrouter.get('/corpers', authenticateToken, getAllCorpers);
eventrouter.get('/non-corpers', authenticateToken, getAllNonCorpers);


eventrouter.get('/me', authenticateToken, getCurrentUser);


eventrouter.get('/event-info/:type', authenticateToken, getEventInfo);

eventrouter.post('/send-ticket', authenticateToken, sendTicketToEmail);
eventrouter.get('/event-artwork', getEventArtwork);



module.exports = eventrouter;
