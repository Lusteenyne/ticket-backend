const bcrypt = require('bcryptjs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const Admin = require('../model/admin.model');
const Corper = require('../model/corper.model');
const NonCorper = require('../model/noncorper.model');
const { uploadFilesToCloudinary } = require('../utilis/cloudinary');
const EventConfig = require('../model/eventArtwork.model');

const { sendApprovalStatusEmail,  sendEventUpdateNotification,  sendArtworkUpdateNotification } = require('../utilis/mailer');

const saltRounds = 10;

// Admin Signup
const adminSignup = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const adminCount = await Admin.countDocuments();

    if (adminCount > 0) {
      return res.status(403).json({ error: 'Admin registration is closed' });
    }

    const hashedPassword = await bcrypt.hash(password, saltRounds);
    const newAdmin = new Admin({ username, email, password: hashedPassword });
    await newAdmin.save();

    res.status(201).json({ message: 'Admin registered successfully' });
  } catch (err) {
    console.error('[ADMIN SIGNUP] Failed:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
};

// Admin Login
const adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const admin = await Admin.findOne({ email }).select('+password');

    if (!admin || !(await bcrypt.compare(password, admin.password))) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: admin._id, role: 'admin' },
      process.env.SECRETKEY || 'defaultSecret',
      { expiresIn: '7h' }
    );

    res.status(200).json({
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        username: admin.username,
      },
    });
  } catch (err) {
    console.error('[ADMIN LOGIN] Failed:', err);
    res.status(500).json({ error: 'Login failed' });
  }
};

// Get all corpers
const getAllCorpers = async (req, res) => {
  try {
    const corpers = await Corper.find().select('-password');
    res.status(200).json(corpers);
  } catch (err) {
    console.error('[GET CORPERS] Error:', err);
    res.status(500).json({ error: 'Failed to fetch corpers' });
  }
};

//  Get all non-corpers
const getAllNonCorpers = async (req, res) => {
  try {
    const noncorpers = await NonCorper.find().select('-password');
    res.status(200).json(noncorpers);
  } catch (err) {
    console.error('[GET NON-CORPERS] Error:', err);
    res.status(500).json({ error: 'Failed to fetch non-corpers' });
  }
};

// Update corper status with email
const updateCorperStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const corper = await Corper.findById(id);
    if (!corper) {
      return res.status(404).json({ error: 'Corper not found' });
    }

    corper.status = status;
    await corper.save();

    if (status === 'approved') {
      await sendApprovalStatusEmail(corper.email, corper.firstName,status, 'corper');
      console.log(`[ADMIN] Approval email sent to ${corper.email}`);
    }

    res.status(200).json({ message: `Corper ${status}`, updated: corper });
  } catch (err) {
    console.error('[UPDATE CORPER STATUS] Error:', err);
    res.status(500).json({ error: 'Failed to update corper status' });
  }
};

// Update non-corper status with email
const updateNonCorperStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const nonCorper = await NonCorper.findById(id);
    if (!nonCorper) {
      return res.status(404).json({ error: 'Non-Corper not found' });
    }

    nonCorper.status = status;
    await nonCorper.save();

    if (status === 'approved') {
      await sendApprovalStatusEmail(nonCorper.email, nonCorper.firstName,status, 'non-corper');
      console.log(`[ADMIN] Approval email sent to ${nonCorper.email}`);
    }

    res.status(200).json({ message: `Non-Corper ${status}`, updated: nonCorper });
  } catch (err) {
    console.error('[UPDATE NON-CORPER STATUS] Error:', err);
    res.status(500).json({ error: 'Failed to update non-corper status' });
  }
};



const updateEventInfo = async (req, res) => {
  try {
    const { date, venue, time, ticketNote } = req.body;

    console.log('[Incoming Request Body]', { date, venue, time, ticketNote });

    if (!date && !venue && !time && !ticketNote) {
      return res.status(400).json({ error: 'At least one field (date, venue, time, ticketNote) must be provided' });
    }

    let eventConfig = await EventConfig.findOne();
    if (!eventConfig) {
      eventConfig = new EventConfig({});
      console.log('[New EventConfig] Created fresh config');
    }

    if (date) {
      eventConfig.date = date;
      console.log('[EventConfig] Updated date to:', date);
    }
    if (venue) {
      eventConfig.venue = venue;
      console.log('[EventConfig] Updated venue to:', venue);
    }
    if (time) {
      eventConfig.time = time;
      console.log('[EventConfig] Updated time to:', time);
    }
    if (ticketNote) {
      eventConfig.ticketNote = ticketNote;
      console.log('[EventConfig] Updated ticketNote to:', ticketNote);
    }

    eventConfig.updatedAt = new Date();

    await eventConfig.save();
    console.log('[EventConfig] Saved successfully:', eventConfig);

    // Fetch approved users
    const corpers = await Corper.find({ status: 'approved' }, 'email firstName');
    const noncorpers = await NonCorper.find({ status: 'approved' }, 'email firstName');
    const approvedUsers = [...corpers, ...noncorpers];

    console.log(`[Notify] Found ${approvedUsers.length} approved users`);

    const emailList = approvedUsers.map(u => ({
      email: u.email,
      firstName: u.firstName || 'Guest',
      userType: u instanceof Corper ? 'corper' : 'non-corper',
    }));

    const formatDate = (d) => {
      const parsed = new Date(d);
      return isNaN(parsed)
        ? 'To be announced'
        : parsed.toLocaleDateString("en-US", {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          });
    };

    const formattedDate = formatDate(date);

    const updateDetails = `
      <p><strong>Date:</strong> ${date ? formattedDate : 'To be announced'}</p>
      <p><strong>Venue:</strong> ${venue || 'To be announced soon'}</p>
      <p><strong>Time:</strong> ${time || 'TBA'}</p>
      <p><strong>Note:</strong> ${ticketNote || 'Details coming soon'}</p>
    `;

    console.log('[Email Content Preview]', updateDetails);

    await sendEventUpdateNotification(emailList, updateDetails);
    console.log('[Notification] Emails sent');

    return res.status(200).json({
      message: 'Global event info updated and approved users notified',
      updated: eventConfig,
    });

  } catch (err) {
    console.error('[ERROR] updateEventInfo failed:', err);
    return res.status(500).json({ error: 'Failed to update event info' });
  }
};

const resetEventInfo = async (req, res) => {
  try {
    // Fetch or create the event config
    let eventConfig = await EventConfig.findOne();
    if (!eventConfig) {
      eventConfig = new EventConfig({});
    }

    // Reset fields to default values
    eventConfig.date = "To be announced soon";
    eventConfig.venue = "To be announced soon";
    eventConfig.time = "To be announced soon";
    eventConfig.ticketNote = "To be announced soon";
    eventConfig.updatedAt = new Date();

    await eventConfig.save();

    return res.status(200).json({
      message: 'Event info reset to default (no notifications sent)',
      reset: eventConfig,
    });

  } catch (err) {
    console.error('[ERROR] resetEventInfo failed:', err);
    return res.status(500).json({ error: 'Failed to reset event info' });
  }
};



const uploadArtwork = async (req, res) => {
  try {
    console.log('[INFO] Incoming file:', req.file);

   
    const result = await uploadFilesToCloudinary([req.file]);
    console.log('[INFO] Cloudinary upload result:', result);

    const artwork = result.artwork || Object.values(result)[0];
    if (!artwork) {
      console.error('[ERROR] No artwork returned from Cloudinary upload');
      return res.status(500).json({ error: 'Upload failed: No artwork object' });
    }

    const artworkUrl = artwork.url || artwork.secure_url;
    if (!artworkUrl) {
      console.error('[ERROR] No valid URL in artwork object:', artwork);
      return res.status(500).json({ error: 'Upload failed: No valid artwork URL' });
    }

    console.log('[INFO] Resolved artwork URL:', artworkUrl);

    
    const existing = await EventConfig.findOne();
    if (existing) {
      console.log('[INFO] Updating existing EventConfig');
      existing.artworkUrl = artworkUrl;
      existing.uploadedAt = new Date();
      await existing.save();
    } else {
      console.log('[INFO] Creating new EventConfig');
      await EventConfig.create({ artworkUrl });
    }

    console.log('[SUCCESS] Artwork URL saved:', artworkUrl);

   
    const corpers = await Corper.find({ status: 'approved' }, 'email firstName');
    const noncorpers = await NonCorper.find({ status: 'approved' }, 'email firstName');
    const approvedUsers = [...corpers, ...noncorpers];

   
    const emailList = approvedUsers.map(u => ({
  email: u.email,
  firstName: u.firstName || 'Guest',
  userType: u instanceof Corper ? 'corper' : 'non-corper',
}));


    const updateDetails = `
      <p>The event artwork has been updated.</p>
      <p><a href="${artworkUrl}" target="_blank">View the new artwork here</a></p>
    `;


    await sendArtworkUpdateNotification(emailList, updateDetails);

    res.status(200).json({
      message: 'Event artwork uploaded successfully and notifications sent',
      artworkUrl,
    });

  } catch (err) {
    console.error('[UPLOAD ARTWORK ERROR]', err);
    res.status(500).json({ error: 'Failed to upload artwork' });
  }
};


module.exports = {
  adminSignup,
  adminLogin,
  getAllCorpers,
  getAllNonCorpers,
  updateCorperStatus,
  updateNonCorperStatus,
  updateEventInfo,
  // uploadUserImage,
  uploadArtwork ,
  resetEventInfo,
};
