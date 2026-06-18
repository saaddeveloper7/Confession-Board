const resend = require('../config/resend');

const FROM_ADDRESS = 'Confession Board <onboarding@resend.dev>';

async function sendPasswordResetEmail(toEmail, resetUrl) {
  const subject = 'Reset your password';

  const text = [
    'Hi,',
    '',
    'We received a request to reset the password for your Confession Board account.',
    'Click the link below to choose a new password. The link expires in 1 hour.',
    '',
    resetUrl,
    '',
    'If you did not request this, you can safely ignore this email.',
  ].join('\n');

  const html = `
  <!DOCTYPE html>
  <html>
    <body style="font-family: Arial, sans-serif; background:#f1f5f9; padding:24px; color:#0f172a;">
      <table align="center" style="max-width:520px; width:100%; background:#ffffff; border:1px solid #e2e8f0; border-radius:8px; padding:32px;">
        <tr><td>
          <h1 style="margin:0 0 16px; font-size:20px; color:#0f172a;">Reset your password</h1>
          <p style="margin:0 0 16px; font-size:14px; line-height:1.5; color:#334155;">
            We received a request to reset the password for your Confession Board account.
            Click the button below to choose a new one. This link expires in 1 hour.
          </p>
          <p style="margin:24px 0;">
            <a href="${resetUrl}"
               style="background:#1e293b; color:#ffffff; padding:10px 18px; border-radius:6px; text-decoration:none; font-size:14px; display:inline-block;">
              Reset password
            </a>
          </p>
          <p style="margin:0 0 8px; font-size:12px; color:#64748b;">
            Or paste this link into your browser:
          </p>
          <p style="margin:0 0 24px; font-size:12px; color:#475569; word-break:break-all;">
            ${resetUrl}
          </p>
          <p style="margin:0; font-size:12px; color:#94a3b8;">
            If you didn't request this, you can safely ignore this email.
          </p>
        </td></tr>
      </table>
    </body>
  </html>`;

  try {
    const { data, error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: toEmail,
      subject,
      html,
      text,
    });

    if (error) {
      console.error('Resend email send failed:', error);
      return { success: false };
    }

    return { success: true, id: data?.id };
  } catch (err) {
    console.error('Resend email send threw:', err.message);
    return { success: false };
  }
}

module.exports = { sendPasswordResetEmail };
