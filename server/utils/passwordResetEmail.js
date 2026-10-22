async function sendPasswordResetEmail({ to, resetUrl }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Password reset email provider is not configured.");
    }
    // Local development can use the returned development link without sending email.
    return { delivered: false };
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from,
      to: [to],
      subject: "Reset your SAELYN password",
      html: `<div style="font-family:Arial,sans-serif;line-height:1.6;color:#171717">
        <h2>Reset your SAELYN password</h2>
        <p>We received a request to reset the password for your account.</p>
        <p><a href="${resetUrl}" style="display:inline-block;padding:12px 18px;background:#171717;color:#fff;text-decoration:none">Reset password</a></p>
        <p>This link expires in 30 minutes and can only be used once. If you did not request this, you can ignore this email.</p>
      </div>`,
    }),
  });

  if (!response.ok) {
    // Do not include provider response content, which may contain private details, in logs.
    throw new Error(`Password reset email delivery failed (HTTP ${response.status}).`);
  }
  return { delivered: true };
}

module.exports = { sendPasswordResetEmail };
