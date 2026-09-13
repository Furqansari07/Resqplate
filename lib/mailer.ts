import nodemailer from 'nodemailer';

function getTransporter() {
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (!user || !pass) {
    throw new Error('Email server credentials are not configured in .env.local');
  }

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendOtpEmail(to: string, code: string) {
  const transporter = getTransporter();
  const from = process.env.EMAIL_FROM || process.env.EMAIL_SERVER_USER;

  console.log(`[mailer] Attempting to send OTP to ${to} from ${from}`);

  const info = await transporter.sendMail({
    from: `ResQPlate <${from}>`,
    to,
    subject: 'Your ResQPlate verification code',
    text: `Your verification code is ${code}. It expires in 5 minutes.`,
    html: `
      <div style="font-family: sans-serif; padding: 24px;">
        <h2 style="margin-bottom: 4px;">Your ResQPlate verification code</h2>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 6px; margin: 12px 0;">
          ${code}
        </p>
        <p style="color: #666; font-size: 13px;">
          This code expires in 5 minutes. If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });

  console.log(`[mailer] Sent. Message ID: ${info.messageId}, response: ${info.response}`);
}