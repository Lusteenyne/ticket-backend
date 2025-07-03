const nodemailer = require('nodemailer');

// Load environment variables
const adminEmail = process.env.ADMIN_EMAIL;
const emailUser = process.env.USER_EMAIL;
const emailPass = process.env.USER_PASS;

// Reusable transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: emailUser,
    pass: emailPass,
  },
});

// Welcome email
const sendWelcomeEmail = async (email, firstName, password) => {
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
            <a href="https://ibnw.party/login" class="cta-button">Login & Download Ticket</a>
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

// Unapproved login attempt
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
const sendApprovalStatusEmail = async (email, firstName, status) => {
  const isApproved = (status || '').toLowerCase() === 'approved';
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
            ? `<a href="https://ibnw.party/login" style="display:inline-block; padding:12px 24px; background-color:#2e7d32; color:#fff; border-radius:5px; text-decoration:none; font-weight:600; margin-top:20px;">Login Now</a>`
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

// Event update notifier
const sendEventUpdateNotification = async (emailList, updateDetails) => {
  for (const { email, firstName } of emailList) {
    const html = `
      <html>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #e3f2fd; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #0d47a1;">IBNW Event Update</h2>
            <p>Hey Aqua Mob ${firstName},</p>
            <p>There’s been an update to the event details. Please review the latest changes below:</p>
            <div style="background: #e3f2fd; padding: 15px; border-left: 4px solid #0d47a1; border-radius: 5px; margin: 15px 0;">
              ${updateDetails}
            </div>
            <a href="https://ibnw.party/login" style="
              display:inline-block; 
              background:#0d47a1; 
              color:#fff; 
              padding:12px 24px; 
              border-radius:5px; 
              text-decoration:none; 
              font-weight:500;
              margin-top: 20px;
            ">Login to Check & Stay Updated</a>
            <p style="margin-top: 30px; font-size: 12px; color: #888888;">– IBNW Events Team</p>
            <p style="color: #bbb; font-size: 12px; text-align: center;"><em>Powered by BadMan</em></p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Updated: IBNW Pool Party Event Details',
      html,
    });
  }
};

// Artwork update notifier

const sendArtworkUpdateNotification = async (emailList, updateDetails) => {
  for (const { email, firstName } of emailList) {
    const html = `
      <html>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f3e5f5; padding: 30px;">
          <div style="max-width: 600px; margin: auto; background-color: #fff; border-radius: 8px; padding: 25px; box-shadow: 0 4px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #6a1b9a;">IBNW Artwork Update</h2>
            <p>Hey Aqua Mob ${firstName},</p>
            <p>There’s a fresh update regarding the artwork. Check out the latest details below:</p>
            <div style="background: #f3e5f5; padding: 15px; border-left: 4px solid #6a1b9a; border-radius: 5px; margin: 15px 0;">
              ${updateDetails}
            </div>
            <a href="https://ibnw.party/login" style="
              display:inline-block; 
              background:#6a1b9a; 
              color:#fff; 
              padding:12px 24px; 
              border-radius:5px; 
              text-decoration:none; 
              font-weight:500;
              margin-top: 20px;
            ">Login to View the Artwork Updates</a>
            <p style="margin-top: 30px; font-size: 12px; color: #888888;">– IBNW Art Team</p>
            <p style="color: #bbb; font-size: 12px; text-align: center;"><em>Powered by BadMan</em></p>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: emailUser,
      to: email,
      subject: 'Updated: IBNW Pool Party Artwork Details',
      html,
    });
  }
};


// Ticket email
const sendTicketEmail = async (user) => {
 const formattedDate = user.date
  ? new Date(user.date).toLocaleDateString('en-NG', {
      weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
    })
  : 'To Be Announced';

const html = `
  <div style="font-family: 'Poppins', sans-serif; background: linear-gradient(135deg, #9c27b0, #ff4081); padding: 30px 20px; border-radius: 16px; color: white; text-align: center;">
    <h2 style="margin-top: 0;">POP PARTY 2025 TICKET</h2>

    <p style="margin-bottom: 15px; font-size: 1rem;">You're officially in, Aqua Mob ${user.firstName}.. Show this ticket at the entrance to get access to the wildest poolside celebration of the year.</p>

    <div style="display: flex; flex-wrap: wrap; justify-content: space-between; background: white; color: #222; padding: 20px; border-radius: 12px; box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2); font-weight: 600; margin-top: 10px;">
      <div style="flex: 1; padding-right: 15px; border-right: 2px dashed #ccc; text-align: center; min-width: 150px;">
        <div style="width: 80%; height: 40px; margin: 10px auto; background: repeating-linear-gradient(to right, #333, #333 2px, #fff 2px, #fff 4px);"></div>
        <p style="margin: 8px 0;">ADMIT ONE</p>
        <p style="margin: 0;">Ticket No.<br /><strong>${user.ticketId || 'TBD'}</strong></p>
      </div>
      <div style="flex: 2; padding-left: 25px; min-width: 220px;">
        <h2 style="color: #6e00ff; margin: 0 0 10px;">POP PARTY 2025</h2>
        <p style="color: #777; font-size: 0.9rem; margin: 0 0 10px;">No. ${user.ticketId || 'TBD'}</p>
        <p style="margin: 8px 0;">Name: <span style="color: #a000ff;">Aqua Mob ${user.lastName} ${user.firstName}</span></p>
        <p style="margin: 8px 0;">Date: <span style="color: #a000ff;">${formattedDate}</span></p>
           <p style="margin: 8px 0;">LGA: <span style="color: #a000ff;">${user.localGov}</span></p>

        <p style="margin-top: 15px; font-style: italic; color: #6e00ff;">Congratulations</p>
      </div>
    </div>

    <p style="margin-top: 20px; font-size: 1rem;">See you by the poolside soon!</p>

    <div style="margin-top: 30px; font-size: 0.85rem; color: #ddd;">
      Powered by <strong style="color: #fff;">BadMan</strong>
    </div>
  </div>
`;


  return await transporter.sendMail({
    from: `"POP PARTY 2025" <${emailUser}>`,
    to: user.email,
    subject: 'Your POP PARTY 2025 Ticket',
    html,
  });
};

module.exports = {
  sendWelcomeEmail,
  sendUnapprovedLoginAlert,
  sendApprovalStatusEmail,
  sendEventUpdateNotification,
  sendTicketEmail,
  sendArtworkUpdateNotification,
};
