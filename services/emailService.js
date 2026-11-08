const nodemailer = require('nodemailer');
const { supabase } = require('../config');

/**
 * Outbound email for user-facing event notifications (roadmap S8).
 *
 * Uses the same SMTP environment as the contact form:
 *   SMTP_HOST, SMTP_PORT (default 587), SMTP_USER, SMTP_PASS,
 *   MAIL_FROM (optional, defaults to SMTP_USER)
 * When SMTP is not configured the service no-ops with a single warning per
 * process, so in-app notifications keep working and email activates as soon
 * as the variables are set.
 */

let warnedMissing = false;

function isConfigured() {
  return !!(process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS);
}

function createTransporter() {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT, 10) || 587,
    secure: parseInt(process.env.SMTP_PORT, 10) === 465,
    auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
  });
}

async function sendEmail(to, subject, text) {
  if (!isConfigured()) {
    if (!warnedMissing) {
      warnedMissing = true;
      console.warn('emailService: SMTP not configured - event emails are disabled until SMTP_HOST/SMTP_USER/SMTP_PASS are set');
    }
    return false;
  }
  if (!to) return false;
  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.MAIL_FROM || process.env.SMTP_USER,
      to,
      subject,
      text,
    });
    return true;
  } catch (e) {
    console.error('emailService: send failed:', e.message);
    return false;
  }
}

// Resolve a stable user id (wallet address or `user_<id>`) to an email address.
async function emailForUser(userSid) {
  if (!userSid) return null;
  try {
    let query = supabase.from('users').select('email');
    const m = /^user_(\d+)$/.exec(userSid);
    if (m) {
      query = query.eq('id', parseInt(m[1], 10));
    } else {
      query = query.eq('wallet_address', userSid.toLowerCase());
    }
    const { data, error } = (await query.limit(1)) || {};
    if (error || !data || !data.length) return null;
    return data[0].email || null;
  } catch (e) {
    console.error('emailService: user email lookup failed:', e.message);
    return null;
  }
}

async function sendUserEmail(userSid, subject, text) {
  const email = await emailForUser(userSid);
  if (!email) return false;
  return sendEmail(email, subject, text);
}

module.exports = { sendEmail, sendUserEmail, isConfigured };
