const bcrypt = require('bcryptjs');
require('dotenv').config();
const jwt = require('jsonwebtoken');
const { sendWelcomeEmail, sendUnapprovedLoginAlert, sendTicketEmail } = require('../utilis/mailer');
const { uploadFilesToCloudinary } = require('../utilis/cloudinary');
const EventConfig = require('../model/eventArtwork.model');
const Corper = require('../model/corper.model');
const NonCorper = require('../model/noncorper.model');

const saltRounds = 10;

//  CORPER SIGNUP 
const corperSignup = async (req, res) => {
  try {
    console.log('[DEBUG] Corper Signup Request Body:', req.body);

    const { firstName, lastName, email, phoneNumber, stateCode, gender, localGov } = req.body;

    const existing = await Corper.findOne({ email });
    if (existing) {
      console.log('[DEBUG] Corper already exists:', email);
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const uploads = await uploadFilesToCloudinary([req.file]);
    console.log('[DEBUG] Cloudinary Upload:', uploads);

    const imageUrl = uploads.receipt?.url || null; 

    const count = await Corper.countDocuments();
    const padded = String(count + 1).padStart(3, '0');
    const password = `CORP${padded}`;
    const hashed = await bcrypt.hash(password, saltRounds);

    const newCorper = new Corper({
      firstName,
      lastName,
      email,
      phoneNumber,
      stateCode,
    localGov,
      gender,
      receipt: imageUrl,
      password: hashed,
      ticketId: password,
      status: 'pending',
    });

    await newCorper.save();
    console.log('[DEBUG] New Corper Saved:', newCorper);

    await sendWelcomeEmail(email, firstName, password, 'corper');

    res.status(201).json({ message: 'Registered', password,  user: {
    firstName,
    email,
    ticketId: password,
    status: 'pending',
    role: 'non-corper',
  },});
  } catch (err) {
    console.error('[CORPER SIGNUP] Error:', err);
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
};

//NON-CORPER SIGNUP 
const nonCorperSignup = async (req, res) => {
  try {
    console.log('[DEBUG] Non-Corper Signup Request Body:', req.body);

    const { firstName, lastName, email, phoneNumber, gender } = req.body;

    const existing = await NonCorper.findOne({ email });
    if (existing) {
      console.log('[DEBUG] Non-Corper already exists:', email);
      return res.status(400).json({ error: 'Email is already registered' });
    }

    const uploads = await uploadFilesToCloudinary([req.file]);
    console.log('[DEBUG] Cloudinary Upload:', uploads);

    const imageUrl = uploads.receipt?.url || null;

    const count = await NonCorper.countDocuments();
    const padded = String(count + 1).padStart(3, '0');
    const password = `AQUA${padded}`;
    const hashed = await bcrypt.hash(password, saltRounds);

    const newNonCorper = new NonCorper({
      firstName,
      lastName,
      email,
      phoneNumber,
      gender,
      receipt: imageUrl,
      password: hashed,
      ticketId: password,
      status: 'pending',
    });

    await newNonCorper.save();

    console.log('[DEBUG] New Non-Corper Saved:', newNonCorper, 'non-corper');
    console.log('[DEBUG] LocalGov Value:', newNonCorper.localGov); 

    await sendWelcomeEmail(email, firstName, password);

    res.status(201).json({ message: 'Registered', password, user: {
    firstName,
    email,
    ticketId: password,
    status: 'pending',
    role: 'non-corper',
  }, });
  } catch (err) {
    console.error('[NON-CORPER SIGNUP] Error:', err);
    res.status(500).json({ error: 'Signup failed', details: err.message });
  }
};

//  CORPER LOGIN 
const corperLogin = async (req, res) => {
  try {
    console.log('[LOGIN ATTEMPT]', req.body.email);

    if (!process.env.SECRETKEY) {
      throw new Error('SECRETKEY environment variable is not defined');
    }

    const { email, password } = req.body;

    const user = await Corper.findOne({ email }).select('+password');
    if (!user) {
      console.log('[LOGIN FAILED] User not found:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    console.log('[USER FOUND]', user);

    const match = await bcrypt.compare(password, user.password);
    console.log('[PASSWORD MATCH]', match);

    if (!match) {
      console.log('[LOGIN FAILED] Wrong password:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'approved') {
      try {
        await sendUnapprovedLoginAlert(user.firstName, user.email);
        console.log('[UNAPPROVED LOGIN ALERT SENT]');
      } catch (alertErr) {
        console.error('[UNAPPROVED LOGIN ALERT ERROR]', alertErr);
      }
    }

    console.log('[GENERATING TOKEN]');
    const token = jwt.sign(
      { id: user._id, role: 'corper' },
      process.env.SECRETKEY,
      { expiresIn: '1h' }
    );
    console.log('[TOKEN GENERATED]', token);

    res.status(200).json({
      message: user.status === 'approved' ? 'Login successful' : 'Login successful but pending approval',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        ticketId: user.ticketId,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[CORPER LOGIN ERROR]', err.message);
    console.error(err.stack);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

// NON-CORPER LOGIN 
const nonCorperLogin = async (req, res) => {
  try {
    console.log('[DEBUG] Non-Corper Login Attempt:', req.body);

    const { email, password } = req.body;

    const user = await NonCorper.findOne({ email }).select('+password');
    if (!user || !(await bcrypt.compare(password, user.password))) {
      console.log('[DEBUG] Invalid credentials for:', email);
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.status !== 'approved') {
      await sendUnapprovedLoginAlert(user.firstName, user.email);
      console.log('[DEBUG] Unapproved login alert sent');
    }

    const token = jwt.sign(
      { id: user._id, role: 'noncorper' },
      process.env.SECRETKEY,
      { expiresIn: '1h' }
    );

    console.log('[DEBUG] Token Generated:', token);

    res.status(200).json({
      message: user.status === 'approved' ? 'Login successful' : 'Login successful but pending approval',
      token,
      user: {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        ticketId: user.ticketId,
        status: user.status,
      },
    });
  } catch (err) {
    console.error('[NON-CORPER LOGIN] Error:', err);
    res.status(500).json({ error: 'Login failed', details: err.message });
  }
};

// GET CURRENT USER 
const getCurrentUser = async (req, res) => {
  try {
    console.log('[DEBUG] Get Current User ID:', req.user.id, 'Role:', req.user.role);

    const Model = req.user.role === 'corper' ? Corper : NonCorper;
    const user = await Model.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.status(200).json({ user });
  } catch (err) {
    console.error('[GET CURRENT USER] Error:', err);
    res.status(500).json({ error: 'Failed to fetch user', details: err.message });
  }
};

// GET ALL USERS 
const getAllCorpers = async (req, res) => {
  try {
    const corpers = await Corper.find().select('-password');
    console.log('[DEBUG] Fetched Corpers Count:', corpers.length);
    res.status(200).json({ message: 'Corpers fetched', data: corpers });
  } catch (err) {
    console.error('[GET ALL CORPERS] Error:', err);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
};

const getAllNonCorpers = async (req, res) => {
  try {
    const nonCorpers = await NonCorper.find().select('-password');
    console.log('[DEBUG] Fetched Non-Corpers Count:', nonCorpers.length);
    res.status(200).json({ message: 'Non-Corpers fetched', data: nonCorpers });
  } catch (err) {
    console.error('[GET ALL NON-CORPERS] Error:', err);
    res.status(500).json({ error: 'Fetch failed', details: err.message });
  }
};

const getEventInfo = async (req, res) => {
  try {
    const { type } = req.params;

    const Model = type === 'corper' ? Corper
                : type === 'noncorper' ? NonCorper
                : null;

    if (!Model) {
      return res.status(400).json({ error: 'Invalid user type' });
    }

    // Fetch user personal info
    const user = await Model.findById(req.user.id)
      .select('firstName lastName ticketId localGov');

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Fetch global event info
    const eventConfig = await EventConfig.findOne();

    // Compose response
    res.status(200).json({
      message: 'Event info retrieved',
      eventInfo: {
        firstName: user.firstName,
        lastName: user.lastName,
        ticketId: user.ticketId,
        localGov: user.localGov,
        date: eventConfig?.date || null,
        venue: eventConfig?.venue || null,
        time: eventConfig?.time || null,
        ticketNote: eventConfig?.ticketNote || null,
      },
    });
  } catch (err) {
    console.error('[GET EVENT INFO] Error:', err);
    res.status(500).json({ error: 'Failed to retrieve event info', details: err.message });
  }
};

// SEND TICKET EMAIL 
const sendTicketToEmail = async (req, res) => {
  try {
    const { type } = req.body;
    const userId = req.user.id;

    const model = type === 'corper' ? Corper : NonCorper;
    const user = await model.findById(userId);

    if (!user) return res.status(404).json({ error: 'User not found' });

    await sendTicketEmail(user);

    res.status(200).json({ message: 'Ticket email sent' });
  } catch (err) {
    console.error('[SEND TICKET EMAIL ERROR]', err);
    res.status(500).json({ error: 'Failed to send ticket email', details: err.message });
  }
};

const getEventArtwork = async (req, res) => {
  try {
    console.log('[INFO] Fetching latest event artwork');

    const latest = await EventConfig.findOne().sort({ uploadedAt: -1 });
    console.log('[INFO] Query result:', latest);

    if (!latest) {
      console.warn('[WARN] No event artwork found in DB');
      return res.status(404).json({ error: 'No event artwork found' });
    }

    console.log('[SUCCESS] Found artwork URL:', latest.artworkUrl);
    res.status(200).json({ artworkUrl: latest.artworkUrl });
    
  } catch (err) {
    console.error('[GET EVENT ARTWORK] Error:', err);
    res.status(500).json({ error: 'Failed to fetch artwork' });
  }
};

module.exports = {
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
};
