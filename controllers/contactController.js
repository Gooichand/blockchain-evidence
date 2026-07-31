const nodemailer = require('nodemailer');

// In-memory throttle store: ip -> { count, windowStart }
const throttleStore = new Map();

const MAX_MESSAGES_PER_IP = 3;
const THROTTLE_WINDOW_MS = 60 * 60 * 1000;

// Normalize raw input values to trimmed strings
const asString = (value) => (typeof value === 'string' ? value.trim() : '');

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);

// Validation rules (server-side mirror of the client rules)
function validateContactPayload(body) {
  const errors = [];

  const name = asString(body.name);
  const email = asString(body.email).toLowerCase();
  const subject = asString(body.subject);
  const message = asString(body.message);

  if (!name) {
    errors.push('Name is required.');
  } else if (name.length < 2 || name.length > 60) {
    errors.push('Name must be between 2 and 60 characters.');
  }

  if (!email) {
    errors.push('Email is required.');
  } else if (!isValidEmail(email)) {
    errors.push('Please provide a valid email address.');
  } else if (email.length > 120) {
    errors.push('Email must not exceed 120 characters.');
  }

  if (!subject) {
    errors.push('Subject is required.');
  } else if (subject.length < 3 || subject.length > 100) {
    errors.push('Subject must be between 3 and 100 characters.');
  }

  if (!message) {
    errors.push('Message is required.');
  } else if (message.length < 10 || message.length > 2000) {
    errors.push('Message must be between 10 and 2000 characters.');
  }

  // Reject obviously scripted spam patterns
  if (/<[a-z][\s\S]*>/i.test(message) || /(https?:\/\/|www\.)[^\s]{2,}/i.test(message)) {
    errors.push('Message contains disallowed content.');
  }

  return { errors, values: { name, email, subject, message } };
}

// Honeypot + throttling check (silent rejection for bots)
function isThrottled(ip) {
  const now = Date.now();
  const record = throttleStore.get(ip);

  if (!record || now - record.windowStart >= THROTTLE_WINDOW_MS) {
    throttleStore.set(ip, { count: 1, windowStart: now });
    return false;
  }

  if (record.count >= MAX_MESSAGES_PER_IP) {
    return true;
  }

  record.count += 1;
  return false;
}

// Periodic cleanup of the throttle store
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, record] of throttleStore.entries()) {
      if (now - record.windowStart >= THROTTLE_WINDOW_MS) {
        throttleStore.delete(ip);
      }
    }
  },
  30 * 60 * 1000,
).unref();

function createTransporter() {
  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT, 10) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 15000,
  });
}

function buildEmailBody(values, meta) {
  return [
    'A new contact form submission has been received on the EVID-DGC website.',
    '',
    '----------------------------------------',
    `Name:       ${values.name}`,
    `Email:      ${values.email}`,
    `Subject:    ${values.subject}`,
    '----------------------------------------',
    '',
    'Message:',
    values.message,
    '',
    '----------------------------------------',
    `Submitted:  ${meta.timestamp}`,
    `IP Address: ${meta.ip}`,
    `Browser:    ${meta.userAgent}`,
    '',
  ].join('\n');
}

const sendContact = async (req, res) => {
  try {
    // Honeypot: if a bot filled the hidden field, pretend success and drop it.
    if (asString(req.body.website)) {
      return res.status(200).json({ success: true, message: 'Message sent successfully.' });
    }

    // Basic throttling per IP to prevent mailbox flooding.
    if (isThrottled(req.ip)) {
      return res.status(429).json({
        success: false,
        error: 'Too many messages sent. Please try again later.',
      });
    }

    const { errors, values } = validateContactPayload(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ success: false, error: errors.join(' ') });
    }

    const transporter = createTransporter();
    if (!transporter) {
      console.error('Contact endpoint: SMTP not configured');
      return res.status(503).json({
        success: false,
        error: 'Mail service is not configured. Please try again later.',
      });
    }

    const recipient = process.env.CONTACT_RECIPIENT_EMAIL || process.env.SMTP_USER;
    const from = process.env.SMTP_FROM || `"EVID-DGC Website" <${process.env.SMTP_USER}>`;

    const meta = {
      timestamp: new Date().toLocaleString('en-IN', {
        timeZone: 'Asia/Kolkata',
        dateStyle: 'full',
        timeStyle: 'short',
      }),
      ip: req.ip || 'Unknown',
      userAgent: req.get('user-agent') || 'Unknown',
    };

    const info = await transporter.sendMail({
      from,
      to: recipient,
      replyTo: `"${values.name}" <${values.email}>`,
      subject: `New Contact Form Submission - EVID-DGC`,
      text: buildEmailBody(values, meta),
    });

    console.log(`Contact email sent (${info.messageId}) from ${values.email}`);

    // Never echo the recipient or message id to the browser.
    return res.status(200).json({
      success: true,
      message: 'Message sent successfully.',
    });
  } catch (error) {
    console.error('Contact endpoint error:', error.message);
    return res.status(500).json({
      success: false,
      error: 'Unable to send message. Please try again later.',
    });
  }
};

module.exports = { sendContact };
