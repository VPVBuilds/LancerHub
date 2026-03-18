const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host:   process.env.EMAIL_HOST,
  port:   Number(process.env.EMAIL_PORT) || 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// ── Generic send ──────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'LancerHub <noreply@lancerhub.com>',
    to,
    subject,
    html,
  });
};

// ── Templated emails ──────────────────────────

exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    to: user.email,
    subject: 'Welcome to LancerHub! 🎉',
    html: `
      <h2>Hi ${user.name},</h2>
      <p>Welcome to LancerHub — the marketplace for exceptional freelance talent.</p>
      <p>Your account has been created. Start browsing jobs or post your first project today!</p>
      <a href="${process.env.CLIENT_URL}" style="background:#6b9e62;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Go to LancerHub
      </a>
    `,
  });
};

exports.sendProposalNotification = async ({ clientEmail, clientName, jobTitle, freelancerName }) => {
  await sendEmail({
    to: clientEmail,
    subject: `New proposal on "${jobTitle}"`,
    html: `
      <h2>Hi ${clientName},</h2>
      <p><strong>${freelancerName}</strong> just submitted a proposal for your job <strong>"${jobTitle}"</strong>.</p>
      <a href="${process.env.CLIENT_URL}/jobs" style="background:#6b9e62;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View Proposal
      </a>
    `,
  });
};

exports.sendProposalAccepted = async ({ freelancerEmail, freelancerName, jobTitle }) => {
  await sendEmail({
    to: freelancerEmail,
    subject: `Your proposal was accepted! 🎉`,
    html: `
      <h2>Congratulations ${freelancerName}!</h2>
      <p>Your proposal for <strong>"${jobTitle}"</strong> has been accepted.</p>
      <p>Head to your dashboard to get started.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="background:#6b9e62;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View Dashboard
      </a>
    `,
  });
};

exports.sendInvoiceEmail = async ({ clientEmail, clientName, invoiceNumber, amount, dueDate, freelancerName }) => {
  await sendEmail({
    to: clientEmail,
    subject: `Invoice ${invoiceNumber} from ${freelancerName}`,
    html: `
      <h2>Hi ${clientName},</h2>
      <p>You have received a new invoice from <strong>${freelancerName}</strong>.</p>
      <table style="border-collapse:collapse;width:100%;max-width:400px">
        <tr><td style="padding:8px;border:1px solid #e0d0b8"><strong>Invoice</strong></td><td style="padding:8px;border:1px solid #e0d0b8">${invoiceNumber}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e0d0b8"><strong>Amount</strong></td><td style="padding:8px;border:1px solid #e0d0b8">$${amount}</td></tr>
        <tr><td style="padding:8px;border:1px solid #e0d0b8"><strong>Due Date</strong></td><td style="padding:8px;border:1px solid #e0d0b8">${dueDate}</td></tr>
      </table>
      <br/>
      <a href="${process.env.CLIENT_URL}/invoices" style="background:#3a9bbf;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        Pay Invoice
      </a>
    `,
  });
};

exports.sendPaymentConfirmation = async ({ freelancerEmail, freelancerName, invoiceNumber, amount }) => {
  await sendEmail({
    to: freelancerEmail,
    subject: `Payment received — ${invoiceNumber} 💰`,
    html: `
      <h2>Hi ${freelancerName},</h2>
      <p>Great news! Payment of <strong>$${amount}</strong> for invoice <strong>${invoiceNumber}</strong> has been received.</p>
      <a href="${process.env.CLIENT_URL}/dashboard" style="background:#6b9e62;color:#fff;padding:12px 24px;border-radius:8px;text-decoration:none;">
        View Dashboard
      </a>
    `,
  });
};

module.exports = { sendEmail, ...module.exports };
