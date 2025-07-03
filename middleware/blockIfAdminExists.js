const Admin = require('../model/admin.model');

const blockIfAdminExists = async (req, res, next) => {
  const count = await Admin.countDocuments();
  if (count > 0) {
    return res.status(403).json({ error: 'Admin already exists' });
  }
  next();
};

module.exports = blockIfAdminExists;
