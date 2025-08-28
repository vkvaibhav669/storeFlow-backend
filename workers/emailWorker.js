// Email worker using Bull + nodemailer.
// Run this as a separate process in production: `node workers/emailWorker.js`
//
// Required env variables:
// - REDIS_URL (e.g. redis://127.0.0.1:6379)
// - EMAIL_SMTP_HOST, EMAIL_SMTP_PORT, EMAIL_SMTP_SECURE (true/false), EMAIL_SMTP_USER, EMAIL_SMTP_PASS
// - EMAIL_FROM (sender address)
//
// This worker processes jobs of type 'send-assignment-email' used by the route side-effects.
const Queue = require('bull');
const nodemailer = require('nodemailer');

const redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
const emailQueue = new Queue('emailQueue', redisUrl);

// Configure transporter from env
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST || 'smtp.example.com',
  port: process.env.EMAIL_SMTP_PORT ? parseInt(process.env.EMAIL_SMTP_PORT) : 587,
  secure: process.env.EMAIL_SMTP_SECURE === 'true',
  auth: {
    user: process.env.EMAIL_SMTP_USER || '',
    pass: process.env.EMAIL_SMTP_PASS || ''
  }
});

emailQueue.process('send-assignment-email', async (job) => {
  const payload = job.data;
  const to = payload.toEmail;
  const subject = payload.subject || 'New notification';
  const text = payload.text || '';
  const html = payload.html || `<p>${text}</p> <p><a href="${payload.link}">Open task</a></p>`;

  if (!to) {
    throw new Error('Missing toEmail in job data');
  }

  // send mail
  const info = await transporter.sendMail({
    from: process.env.EMAIL_FROM || 'no-reply@storeflow.app',
    to,
    subject,
    text,
    html
  });

  console.log('Email sent:', info.messageId);
  return info;
});

emailQueue.on('failed', (job, err) => {
  console.error('Email job failed', job.id, err);
});

console.log('Email worker running, connected to', redisUrl);

// Export the queue to allow reuse if you want to run inline processors.
// In production we recommend running this worker as its own process.
module.exports = emailQueue;
