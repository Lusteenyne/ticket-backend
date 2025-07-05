const express = require('express');
const adminrouter = express.Router();
const { upload } = require('../utilis/cloudinary');

const {
  adminSignup,
  adminLogin,
  getAllCorpers,
  getAllNonCorpers,
  updateCorperStatus,
  updateNonCorperStatus,
  updateEventInfo,
  resetEventInfo,
  
  uploadArtwork
} = require('../controllers/admin.controllers');

const blockIfAdminExists = require('../middleware/blockIfAdminExists');
const authenticateToken = require('../middleware/authenticateToken');

//  Signup (only if admin not already exists)
adminrouter.post('/signup', blockIfAdminExists, adminSignup);

//  Login
adminrouter.post('/login', adminLogin);

// Protected routes
adminrouter.get('/corpers', authenticateToken, getAllCorpers);
adminrouter.get('/noncorpers', authenticateToken, getAllNonCorpers);
adminrouter.patch('/corpers/:id/status', authenticateToken, updateCorperStatus);
adminrouter.patch('/noncorpers/:id/status', authenticateToken, updateNonCorperStatus);
adminrouter.patch('/event', authenticateToken, updateEventInfo);



adminrouter.post(
  '/upload-artwork',
  authenticateToken,
  upload.single('artwork'),
  uploadArtwork
);

//resteventinfo
adminrouter.patch('/reset-event-info', authenticateToken, resetEventInfo);





module.exports = adminrouter;
