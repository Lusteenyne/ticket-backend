const nodemailer = require('nodemailer');

// Load environment variables
const adminEmail = process.env.ADMIN_EMAIL;
const emailUser = process.env.USER_EMAIL;
const emailPass = process.env.USER_PASS;


const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});


const getLoginUrl = (userType) => {
  return userType === 'corper'
    ? 'https://ibnw-pop-party-ticket-fr.onrender.com/event/corper-login'
    : 'https://ibnw-pop-party-ticket-fr.onrender.com/event/non-corper-login'; 
};

// Welcome email
const sendWelcomeEmail = async (email, firstName, password, userType) => {
  const loginUrl = getLoginUrl(userType);

  const html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 15px rgba(0, 0, 0, 0.1); }
          .banner { width: 100%; height: auto; display: block; }
          .header { background-color: #0d47a1; color: #ffffff; text-align: center; padding: 30px 20px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header p { margin-top: 8px; font-size: 15px; color: #bbdefb; }
          .content { padding: 30px 20px; text-align: center; color: #333333; }
          .content p { font-size: 16px; margin: 12px 0; }
          .password-box { background-color: #e3f2fd; color: #0d47a1; padding: 10px 20px; font-weight: bold; font-size: 18px; border-radius: 8px; display: inline-block; margin: 20px 0; }
          .cta-button { display: inline-block; background-color: #1565c0; color: #ffffff; padding: 12px 28px; border-radius: 6px; text-decoration: none; font-weight: 500; margin-top: 15px; }
          .footer { font-size: 12px; color: #888888; text-align: center; padding: 20px; background-color: #f1f1f1; }
          .footer span { display: block; margin-top: 10px; color: #999999; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container">
         
          <div class="header">
            <h1>Welcome to IBNW</h1>
            <p>Batch B Stream 2 — Pool Party Access</p>
          </div>
          <div class="content">
            <p>Hey Aqua Mob ${firstName},</p>
            <p>You’re officially on the list.</p>
            <p>Here’s your login password:</p>
            <div class="password-box">${password}</div>
            <p>Use it to sign in and download your pool pass.</p>
            <a href="${loginUrl}" class="cta-button">Login & Download Ticket</a>
          </div>
          <div class="footer">
            © ${new Date().getFullYear()} IBNW Events. All rights reserved.
            <span>Powered by BadMan</span>
          </div>
        </div>
      </body>
    </html>
  `;

  return await transporter.sendMail({
    from: emailUser,
    to: email,
    subject: 'Welcome to IBNW – Your Pool Party Login Info',
    html,
  });
};

// Unapproved login attempt (no login link needed)
const sendUnapprovedLoginAlert = async (firstName, email) => {
  const html = `
    <html>
      <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fff3e0;">
        <h2 style="color: #e65100;">Unapproved Login Attempt</h2>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>This user tried to log in without approval. Please review their status in the admin panel.</p>
      </body>
    </html>
  `;

  return await transporter.sendMail({
    from: emailUser,
    to: adminEmail,
    subject: 'Alert: Unapproved User Login Attempt',
    html,
  });
};

// Approval status email
const sendApprovalStatusEmail = async (email, firstName, status, userType) => {
  const isApproved = (status || '').toLowerCase() === 'approved';
  const loginUrl = getLoginUrl(userType);

  const html = `
    <html>
      <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; padding: 30px; margin:0;">
        <div style="background-color: #ffffff; border-radius: 10px; padding: 30px; max-width: 600px; margin: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: ${isApproved ? '#2e7d32' : '#c62828'}; margin-top:0;">
            ${isApproved ? 'You’ve Been Approved!' : 'Application Rejected'}
          </h2>
          <p>Hey Aqua Mob ${firstName},</p>
          <p>
            ${isApproved 
              ? `You’ve been approved to attend the IBNW Pool Party! Please log in and download your ticket below.<br><br>
                 For help, reach out via 
                 <a href="https://wa.me/2349054694470" target="_blank" style="color: #0b5ed7;">WhatsApp</a>.`
              : `We regret to inform you that your request was not approved.<br><br>
                 For details, contact the IBNW Team via 
                 <a href="https://wa.me/2349054694470" target="_blank" style="color: #0b5ed7;">WhatsApp</a>.`
            }
          </p>
          ${isApproved 
            ? `<a href="${loginUrl}" style="display:inline-block; padding:12px 24px; background-color:#2e7d32; color:#fff; border-radius:5px; text-decoration:none; font-weight:600; margin-top:20px;">Login Now</a>`
            : ''
          }
          <p style="margin-top: 40px; color: #888888; font-size: 13px;">– IBNW Events Team</p>
          <p style="color: #bbb; font-size: 12px; text-align: center;"><em>Powered by BadMan</em></p>
        </div>
      </body>
    </html>
  `;

  return await transporter.sendMail({
    from: emailUser,
    to: email,
    subject: isApproved ? 'Approved: Welcome to IBNW' : 'IBNW Application Status',
    html,
  });
};

const sendEventUpdateNotification = async (emailList, updateDetails) => {
  const mailPromises = emailList.map(({ email, firstName, userType }) => {
    const loginUrl = getLoginUrl(userType);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #d97706;">IBNW Event Update</h2>
        <p>Dear ${firstName},</p>
        <p>The IBNW pool party event details have been updated. Please see the changes below:</p>
        ${updateDetails}
        <p>Click below to log in and view more:</p>
        <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #d97706; color: white; text-decoration: none; border-radius: 5px;">Login to IBNW</a>
        <p style="margin-top: 20px;">Warm regards,<br/>IBNW Team</p>
      </div>
    `;

    return transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Updated: IBNW Pool Party Event Details',
      html,
    });
  });

  await Promise.all(mailPromises);
};

const sendArtworkUpdateNotification = async (emailList, updateDetails) => {
  const mailPromises = emailList.map(({ email, firstName, userType }) => {
    const loginUrl = getLoginUrl(userType);

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #ddd; border-radius: 8px;">
        <h2 style="color: #2563eb;">IBNW Event Artwork Updated</h2>
        <p>Dear ${firstName},</p>
        <p>The event artwork has been updated. Please click the link below to view the new artwork:</p>
        ${updateDetails}
        <p>Click below to log in and view more:</p>
        <a href="${loginUrl}" style="display: inline-block; padding: 10px 20px; background-color: #2563eb; color: white; text-decoration: none; border-radius: 5px;">Login to IBNW</a>
        <p style="margin-top: 20px;">Warm regards,<br/>IBNW Team</p>
      </div>
    `;

    return transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Updated: IBNW Event Artwork',
      html,
    });
  });

  await Promise.all(mailPromises);
};


module.exports = {
  sendWelcomeEmail,
  sendUnapprovedLoginAlert,
  sendApprovalStatusEmail,
  sendEventUpdateNotification,
  sendArtworkUpdateNotification,
};
