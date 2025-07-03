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

// Normalize userType to lowercase and default to 'non-corper' if missing or invalid
const getLoginUrl = (userType) => {
  const normalizedType = (userType || '').toLowerCase();
  if (normalizedType === 'corper') {
    return 'https://ibnw-pop-party-ticket-fr.onrender.com/corper-login';
  }
  return 'https://ibnw-pop-party-ticket-fr.onrender.com/non-corper-login';
};

// Powered By Footer HTML snippet (for consistency)
const poweredByFooter = `
  <p style="
    font-size: 12px; 
    color: #888888; 
    text-align: center; 
    margin-top: 40px; 
    font-style: italic;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  ">
    Powered by BadMan
  </p>
`;

// Welcome email
const sendWelcomeEmail = async (email, firstName, password, userType) => {
  const normalizedUserType = (userType || '').toLowerCase();
  const loginUrl = getLoginUrl(normalizedUserType);

  console.log('sendWelcomeEmail called with:', { email, firstName, password, userType: normalizedUserType, loginUrl });

  const html = `
    <html>
      <head>
        <style>
          body { margin: 0; padding: 0; font-family: 'Segoe UI', sans-serif; background-color: #f4f6f8; }
          .container { max-width: 600px; margin: 20px auto; background: #fff; border-radius: 10px; box-shadow: 0 4px 15px rgba(0,0,0,0.1); overflow: hidden; }
          .header { background-color: #0d47a1; color: #fff; text-align: center; padding: 30px 20px; }
          .header h1 { font-size: 24px; margin: 0; }
          .header p { margin-top: 8px; font-size: 15px; color: #bbdefb; }
          .content { padding: 30px 20px; text-align: center; color: #333; }
          .content p { font-size: 16px; margin: 12px 0; }
          .password-box { background-color: #e3f2fd; color: #0d47a1; padding: 10px 20px; font-weight: bold; font-size: 18px; border-radius: 8px; display: inline-block; margin: 20px 0; user-select: all; }
          .cta-button {
            display: inline-block;
            background-color: #1565c0;
            color: #fff;
            padding: 12px 28px;
            border-radius: 6px;
            text-decoration: none;
            font-weight: 600;
            margin-top: 15px;
            transition: background-color 0.3s ease;
          }
          .cta-button:hover {
            background-color: #0d3f94;
          }
          .footer { font-size: 12px; color: #888; text-align: center; padding: 20px; background-color: #f1f1f1; }
          .footer span { display: block; margin-top: 10px; color: #999; font-style: italic; }
        </style>
      </head>
      <body>
        <div class="container" role="main" aria-label="Welcome Email">
          <div class="header" role="banner">
            <h1>Welcome to IBNW</h1>
            <p>Batch B Stream 2 — Pool Party Access</p>
          </div>
          <div class="content">
            <p>Hey Aqua Mob ${firstName},</p>
            <p>You’re officially on the list.</p>
            <p>Here’s your login password:</p>
            <div class="password-box" aria-label="Your login password">${password}</div>
            <p>Use it to sign in and download your pool pass.</p>
            <a href="${loginUrl}" class="cta-button" role="button" target="_blank" rel="noopener">Login & Download Ticket</a>
          </div>
          <div class="footer" role="contentinfo">
            © ${new Date().getFullYear()} IBNW Events. All rights reserved.
            <span>Powered by BadMan</span>
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: emailUser,
    to: email,
    subject: 'Welcome to IBNW – Your Pool Party Login Info',
    html,
  });
};

// Unapproved login attempt alert (to admin)
const sendUnapprovedLoginAlert = async (firstName, email) => {
  const html = `
    <html>
      <body style="font-family: 'Segoe UI', sans-serif; padding: 20px; background-color: #fff3e0; color: #e65100;">
        <h2>Unapproved Login Attempt</h2>
        <p><strong>Name:</strong> ${firstName}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p>This user tried to log in without approval. Please review their status in the admin panel.</p>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: emailUser,
    to: adminEmail,
    subject: 'Alert: Unapproved User Login Attempt',
    html,
  });
};

// Approval status email (approved or rejected)
const sendApprovalStatusEmail = async (email, firstName, status, userType) => {
  const isApproved = (status || '').toLowerCase() === 'approved';
  const loginUrl = getLoginUrl(userType);

  const html = `
    <html>
      <body style="font-family: 'Segoe UI', sans-serif; background-color: #f4f4f4; padding: 30px; margin:0;">
        <div style="background:#fff; border-radius:10px; padding:30px; max-width:600px; margin:auto; box-shadow:0 4px 12px rgba(0,0,0,0.1);">
          <h2 style="color: ${isApproved ? '#2e7d32' : '#c62828'}; margin-top:0; font-weight: 700;">
            ${isApproved ? 'You’ve Been Approved!' : 'Application Rejected'}
          </h2>
          <p>Hey Aqua Mob ${firstName},</p>
          <p style="line-height:1.5; font-size: 16px;">
            ${isApproved 
              ? `You’ve been approved to attend the IBNW Pool Party! Please log in and download your ticket below.<br><br>
                 For help, reach out via 
                 <a href="https://wa.me/2349054694470" target="_blank" rel="noopener" style="color: #0b5ed7; text-decoration: none;">WhatsApp</a>.`
              : `We regret to inform you that your request was not approved.<br><br>
                 For details, contact the IBNW Team via 
                 <a href="https://wa.me/2349054694470" target="_blank" rel="noopener" style="color: #0b5ed7; text-decoration: none;">WhatsApp</a>.`
            }
          </p>
          ${isApproved ? `
            <a href="${loginUrl}" style="
              display:inline-block; 
              padding:12px 24px; 
              background-color:#2e7d32; 
              color:#fff; 
              border-radius:5px; 
              text-decoration:none; 
              font-weight:600; 
              margin-top:20px;
              transition: background-color 0.3s ease;
            "
            onmouseover="this.style.backgroundColor='#27632a';" 
            onmouseout="this.style.backgroundColor='#2e7d32';"
            target="_blank" rel="noopener"
            >Login Now</a>
          ` : ''}
          <p style="margin-top: 40px; color: #888888; font-size: 13px;">– IBNW Events Team</p>
          ${poweredByFooter}
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
    from: emailUser,
    to: email,
    subject: isApproved ? 'Approved: Welcome to IBNW' : 'IBNW Application Status',
    html,
  });
};

// Event update notification email (batch send)
const sendEventUpdateNotification = async (emailList, updateDetails) => {
  const mailPromises = emailList.map(({ email, firstName, userType }) => {
    const loginUrl = getLoginUrl(userType);

    const html = `
      <html>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 30px; margin: 0;">
          <div style="max-width: 600px; background: #fff; border-radius: 10px; padding: 30px; margin: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #d97706; margin-top: 0; font-weight: 700;">IBNW Event Update</h2>
            <p>Dear ${firstName},</p>
            <p>The IBNW pool party event details have been updated. Please see the changes below:</p>
            ${updateDetails}
            <p>Click below to log in and view more:</p>
            <a href="${loginUrl}" style="
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #d97706; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              font-weight: 600;
              transition: background-color 0.3s ease;
            "
            onmouseover="this.style.backgroundColor='#b26e04';" 
            onmouseout="this.style.backgroundColor='#d97706';"
            target="_blank" rel="noopener"
            >Login to IBNW</a>
            <p style="margin-top: 20px;">Warm regards,<br/>IBNW Team</p>
            ${poweredByFooter}
          </div>
        </body>
      </html>
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

// Artwork update notification email (batch send)
const sendArtworkUpdateNotification = async (emailList, updateDetails) => {
  const mailPromises = emailList.map(({ email, firstName, userType }) => {
    const loginUrl = getLoginUrl(userType);

    const html = `
      <html>
        <body style="font-family: 'Segoe UI', sans-serif; background-color: #f9fafb; padding: 30px; margin: 0;">
          <div style="max-width: 600px; background: #fff; border-radius: 10px; padding: 30px; margin: auto; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
            <h2 style="color: #2563eb; margin-top: 0; font-weight: 700;">IBNW Event Artwork Updated</h2>
            <p>Dear ${firstName},</p>
            <p>The event artwork has been updated. Please click the link below to view the new artwork:</p>
            ${updateDetails}
            <p>Click below to log in and view more:</p>
            <a href="${loginUrl}" style="
              display: inline-block; 
              padding: 10px 20px; 
              background-color: #2563eb; 
              color: white; 
              text-decoration: none; 
              border-radius: 5px;
              font-weight: 600;
              transition: background-color 0.3s ease;
            "
            onmouseover="this.style.backgroundColor='#1d4ed8';" 
            onmouseout="this.style.backgroundColor='#2563eb';"
            target="_blank" rel="noopener"
            >Login to IBNW</a>
            <p style="margin-top: 20px;">Warm regards,<br/>IBNW Team</p>
            ${poweredByFooter}
          </div>
        </body>
      </html>
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
// Ticket email
const sendTicketEmail = async (user) => {
  const formattedDate = user.date
    ? new Date(user.date).toLocaleDateString('en-NG', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : 'To Be Announced';

  const html = `
    <html>
      <head>
        <style>
          body {
            margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #f4f6f8;
            color: #333;
          }
          .container {
            max-width: 600px;
            margin: 30px auto;
            background: #fff;
            border-radius: 12px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            overflow: hidden;
          }
          .header {
            background: linear-gradient(135deg, #9c27b0, #ff4081);
            color: white;
            text-align: center;
            padding: 30px 20px;
            font-weight: 700;
            font-size: 24px;
          }
          .content {
            padding: 25px 30px;
            font-size: 16px;
            line-height: 1.5;
            color: #222;
            text-align: center;
          }
          .ticket-box {
            margin-top: 20px;
            background: #fafafa;
            border-radius: 10px;
            box-shadow: 0 8px 20px rgba(156, 39, 176, 0.15);
            display: flex;
            flex-wrap: wrap;
            padding: 25px;
            color: #222;
          }
          .ticket-left, .ticket-right {
            flex: 1;
            min-width: 160px;
          }
          .ticket-left {
            border-right: 2px dashed #ccc;
            padding-right: 20px;
            text-align: center;
          }
          .ticket-left .stripe {
            width: 80%;
            height: 40px;
            margin: 15px auto;
            background: repeating-linear-gradient(to right, #333, #333 2px, #fff 2px, #fff 4px);
          }
          .ticket-left p {
            margin: 6px 0;
            font-weight: 600;
            color: #555;
          }
          .ticket-left strong {
            font-size: 18px;
            color: #9c27b0;
          }
          .ticket-right {
            padding-left: 25px;
            text-align: left;
          }
          .ticket-right h2 {
            color: #9c27b0;
            margin: 0 0 10px;
            font-weight: 700;
          }
          .ticket-right p {
            margin: 6px 0;
            color: #555;
          }
          .highlight {
            color: #a000ff;
            font-weight: 600;
          }
          .footer {
            margin: 30px 0 20px;
            font-size: 14px;
            color: #888;
            font-style: italic;
            text-align: center;
          }
        </style>
      </head>
      <body>
        <div class="container" role="main" aria-label="POP PARTY 2025 Ticket">
          <div class="header">POP PARTY 2025 TICKET</div>
          <div class="content">
            <p>You're officially in, Aqua Mob <strong>${user.firstName}</strong>. Show this ticket at the entrance to get access to the wildest poolside celebration of the year.</p>
            <div class="ticket-box" role="region" aria-label="Ticket details">
              <div class="ticket-left">
                <div class="stripe" aria-hidden="true"></div>
                <p>ADMIT ONE</p>
                <p>Ticket No.<br /><strong>${user.ticketId || 'TBD'}</strong></p>
              </div>
              <div class="ticket-right">
                <h2>POP PARTY 2025</h2>
                <p>No. <span class="highlight">${user.ticketId || 'TBD'}</span></p>
                <p>Name: <span class="highlight">Aqua Mob ${user.lastName} ${user.firstName}</span></p>
                <p>Date: <span class="highlight">${formattedDate}</span></p>
                <p>LGA: <span class="highlight">${user.localGov}</span></p>
                <p style="margin-top: 15px; font-style: italic; color: #9c27b0;">Congratulations</p>
              </div>
            </div>
            <p style="margin-top: 25px;">See you by the poolside soon!</p>
          </div>
          <div class="footer">
            Powered by <strong>BadMan</strong>
          </div>
        </div>
      </body>
    </html>
  `;

  return transporter.sendMail({
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
  sendArtworkUpdateNotification,
  sendTicketEmail,
};
