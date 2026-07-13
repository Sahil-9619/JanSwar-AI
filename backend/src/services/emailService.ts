import nodemailer from "nodemailer";

const smtpHost = process.env.SMTP_HOST || "smtp.gmail.com";
const smtpPort = parseInt(process.env.SMTP_PORT || "587", 10);
const smtpUser = process.env.SMTP_USER || "janswarai@gmail.com";
const smtpPass = process.env.SMTP_PASS || "ppha oyfa cykk nntx";

const transporter = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpPort === 465, // true for 465, false for other ports
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
});

/**
 * Sends a passwordless OTP verification email to the user.
 * @param email Recipient email address
 * @param otp The generated 6-digit OTP
 * @param purpose 'login' or 'signup'
 */
export async function sendOtpEmail(email: string, otp: string, purpose: "login" | "signup"): Promise<void> {
  const actionText = purpose === "login" ? "log in to" : "complete your registration on";
  
  const mailOptions = {
    from: `"JanSwar AI" <${smtpUser}>`,
    to: email,
    subject: `JanSwar AI - Verification Code: ${otp}`,
    text: `Your verification code to ${actionText} JanSwar AI is: ${otp}. It will expire in 5 minutes.`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e1e8ed; border-radius: 8px; background-color: #ffffff;">
        <div style="text-align: center; border-bottom: 2px solid #3b82f6; padding-bottom: 20px; margin-bottom: 20px;">
          <h2 style="color: #1e3a8a; margin: 0; font-size: 24px; font-weight: 800;">JanSwar <span style="color: #3b82f6;">AI</span></h2>
          <p style="color: #6b7280; font-size: 14px; margin: 5px 0 0 0;">Constituency Intelligence Platform</p>
        </div>
        
        <div style="padding: 10px 0;">
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">Hello,</p>
          <p style="font-size: 16px; color: #374151; line-height: 1.6;">
            You requested a verification code to <strong>${actionText}</strong> your JanSwar AI account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <div style="display: inline-block; padding: 12px 30px; background-color: #eff6ff; border: 1px dashed #3b82f6; border-radius: 8px;">
              <span style="font-size: 32px; font-weight: 800; letter-spacing: 5px; color: #1d4ed8;">${otp}</span>
            </div>
            <p style="font-size: 12px; color: #9ca3af; margin-top: 10px;">This code is valid for 5 minutes.</p>
          </div>
          
          <p style="font-size: 14px; color: #6b7280; line-height: 1.6;">
            If you did not make this request, you can safely ignore this email.
          </p>
        </div>
        
        <div style="text-align: center; border-top: 1px solid #f3f4f6; padding-top: 20px; margin-top: 30px; font-size: 12px; color: #9ca3af;">
          <p style="margin: 0;">&copy; 2026 JanSwar AI. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`[EmailService] OTP email sent successfully to ${email}. Message ID: ${info.messageId}`);
  } catch (error) {
    console.error("[EmailService] Failed to send OTP email:", error);
    throw new Error("Email sending failed");
  }
}
