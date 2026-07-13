import handlebars from "handlebars";

const brevoApiKey = process.env.BREVO_API_KEY || "";
const brevoFromEmail = process.env.BREVO_FROM_EMAIL || "info@janswar.com";

const otpTemplateSource = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>JanSwar AI - Verification</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100%; overflow-x: hidden; }
    .email-wrapper { width: 100%; max-width: 100%; background-color: #f8fafc; padding: 30px 15px; }
    .email-container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 35px 20px; text-align: center; }
    .logo-img { width: 54px; height: 54px; margin-bottom: 12px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
    .header-title { color: #ffffff; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header-subtitle { color: #93c5fd; font-size: 13px; margin: 6px 0 0 0; font-weight: 500; letter-spacing: 0.5px; text-transform: uppercase; }
    .email-body { padding: 35px 25px; color: #334155; }
    .greeting { font-size: 18px; font-weight: 700; margin-top: 0; color: #0f172a; margin-bottom: 15px; }
    .message { font-size: 15px; line-height: 1.6; color: #475569; margin-bottom: 25px; }
    .otp-container { margin: 30px 0; text-align: center; background-color: #f1f5f9; padding: 25px 15px; border-radius: 16px; border: 1px dashed #cbd5e1; }
    .otp-box { display: inline-block; font-size: 42px; font-weight: 800; letter-spacing: 12px; color: #1e40af; margin-left: 12px; }
    .otp-warning { font-size: 13px; color: #64748b; margin-top: 15px; margin-bottom: 0; font-weight: 500; }
    .email-footer { background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #f1f5f9; }
    .footer-text { font-size: 12px; color: #94a3b8; margin: 0 0 5px 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="https://jan-swar-ai.vercel.app/JS_logo.png" alt="JanSwar AI Logo" class="logo-img">
        <h1 class="header-title">JanSwar <span style="color: #60a5fa;">AI</span></h1>
        <p class="header-subtitle">Identity Verification</p>
      </div>
      <div class="email-body">
        <p class="greeting">Hello,</p>
        <p class="message">
          You requested a secure verification code to <strong>{{actionText}}</strong> your JanSwar AI account.
          Please use the code below to complete your request.
        </p>
        <div class="otp-container">
          <div class="otp-box">{{otp}}</div>
          <p class="otp-warning">⏳ This code will expire in exactly 5 minutes.</p>
        </div>
        <p class="message" style="font-size: 13px; color: #64748b; margin-bottom: 0;">
          If you did not make this request or you believe an unauthorized person is attempting to access your account, you can safely ignore and delete this email.
        </p>
      </div>
      <div class="email-footer">
        <p class="footer-text">&copy; {{year}} <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: none; font-weight: 600;">JanSwar AI</a>. All rights reserved.</p>
        <p class="footer-text">Visit us at <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: underline;">https://jan-swar-ai.vercel.app/</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

const welcomeTemplateSource = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to JanSwar AI</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100%; overflow-x: hidden; }
    .email-wrapper { width: 100%; max-width: 100%; background-color: #f8fafc; padding: 30px 15px; }
    .email-container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 20px; text-align: center; }
    .logo-img { width: 64px; height: 64px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
    .header-title { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header-subtitle { color: #93c5fd; font-size: 14px; margin: 8px 0 0 0; font-weight: 500; }
    .email-body { padding: 40px 30px; color: #334155; }
    .greeting { font-size: 22px; font-weight: 700; margin-top: 0; color: #0f172a; margin-bottom: 20px; text-align: center; }
    .message { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px; text-align: center; }
    .feature-list { background-color: #f1f5f9; border-radius: 12px; padding: 20px; margin: 30px 0; text-align: left; }
    .feature-item { margin-bottom: 12px; font-size: 15px; color: #334155; font-weight: 500; }
    .feature-item:last-child { margin-bottom: 0; }
    .btn-container { text-align: center; margin: 35px 0 10px 0; }
    .btn { display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.3); border: 1px solid #1e3a8a; }
    .email-footer { background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #f1f5f9; }
    .footer-text { font-size: 12px; color: #94a3b8; margin: 0 0 5px 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="https://jan-swar-ai.vercel.app/JS_logo.png" alt="JanSwar AI Logo" class="logo-img">
        <h1 class="header-title">Account Created!</h1>
        <p class="header-subtitle">Welcome to the Future of Governance</p>
      </div>
      <div class="email-body">
        <p class="greeting">Welcome, {{fullName}}! 🎉</p>
        <p class="message">
          Your JanSwar AI account has been successfully created. We are thrilled to have you join our platform to bridge the gap between citizens and policymakers.
        </p>
        
        <div class="feature-list">
          <div class="feature-item">✅ Report constituency issues instantly</div>
          <div class="feature-item">✅ AI-powered complaint analysis</div>
          <div class="feature-item">✅ Real-time tracking & transparency</div>
          <div class="feature-item">✅ Direct communication with leaders</div>
        </div>

        <div class="btn-container">
          <a href="{{loginUrl}}" class="btn">Go to Dashboard</a>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">&copy; {{year}} <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: none; font-weight: 600;">JanSwar AI</a>. All rights reserved.</p>
        <p class="footer-text">Bridging the gap between Citizens and Government at <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: underline;">https://jan-swar-ai.vercel.app/</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

const passwordChangedTemplateSource = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Password Changed Successfully</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; }
    body { margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; width: 100%; overflow-x: hidden; }
    .email-wrapper { width: 100%; max-width: 100%; background-color: #f8fafc; padding: 30px 15px; }
    .email-container { max-width: 500px; margin: 0 auto; background-color: #ffffff; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05); border: 1px solid #e2e8f0; }
    .email-header { background: linear-gradient(135deg, #0f172a 0%, #1e3a8a 100%); padding: 40px 20px; text-align: center; }
    .logo-img { width: 64px; height: 64px; margin-bottom: 15px; filter: drop-shadow(0 4px 6px rgba(0,0,0,0.2)); }
    .header-title { color: #ffffff; font-size: 28px; font-weight: 800; margin: 0; letter-spacing: -0.5px; }
    .header-subtitle { color: #93c5fd; font-size: 14px; margin: 8px 0 0 0; font-weight: 500; }
    .email-body { padding: 40px 30px; color: #334155; }
    .greeting { font-size: 22px; font-weight: 700; margin-top: 0; color: #0f172a; margin-bottom: 20px; text-align: center; }
    .message { font-size: 16px; line-height: 1.6; color: #475569; margin-bottom: 20px; text-align: center; }
    .btn-container { text-align: center; margin: 35px 0 10px 0; }
    .btn { display: inline-block; background-color: #1e40af; color: #ffffff; text-decoration: none; font-weight: 600; padding: 14px 32px; border-radius: 8px; font-size: 16px; box-shadow: 0 4px 6px -1px rgba(30, 64, 175, 0.3); border: 1px solid #1e3a8a; }
    .email-footer { background-color: #f8fafc; padding: 25px 20px; text-align: center; border-top: 1px solid #f1f5f9; }
    .footer-text { font-size: 12px; color: #94a3b8; margin: 0 0 5px 0; line-height: 1.5; }
  </style>
</head>
<body>
  <div class="email-wrapper">
    <div class="email-container">
      <div class="email-header">
        <img src="https://jan-swar-ai.vercel.app/JS_logo.png" alt="JanSwar AI Logo" class="logo-img">
        <h1 class="header-title">Password Changed</h1>
        <p class="header-subtitle">Security Alert</p>
      </div>
      <div class="email-body">
        <p class="greeting">Hello, {{fullName}}!</p>
        <p class="message">
          Your password for JanSwar AI has been successfully changed.
        </p>
        <p class="message">
          If you did not make this change, please contact our support immediately to secure your account.
        </p>
        
        <div class="btn-container">
          <a href="https://jan-swar-ai.vercel.app/login" class="btn">Log In to Your Account</a>
        </div>
      </div>
      <div class="email-footer">
        <p class="footer-text">&copy; {{year}} <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: none; font-weight: 600;">JanSwar AI</a>. All rights reserved.</p>
        <p class="footer-text">Bridging the gap between Citizens and Government at <a href="https://jan-swar-ai.vercel.app/" style="color: #64748b; text-decoration: underline;">https://jan-swar-ai.vercel.app/</a></p>
      </div>
    </div>
  </div>
</body>
</html>`;

const compiledOtpTemplate = handlebars.compile(otpTemplateSource);
const compiledWelcomeTemplate = handlebars.compile(welcomeTemplateSource);
const compiledPasswordChangedTemplate = handlebars.compile(passwordChangedTemplateSource);

/**
 * Sends a passwordless OTP verification email to the user.
 * @param email Recipient email address
 * @param otp The generated 6-digit OTP
 * @param purpose 'login' or 'signup'
 */
export async function sendOtpEmail(email: string, otp: string, purpose: "login" | "signup"): Promise<void> {
  if (!brevoApiKey) {
    console.warn("[EmailService] No BREVO_API_KEY provided. Skipping actual email dispatch.");
    return;
  }

  const actionText = purpose === "login" ? "log in to" : "complete your registration on";
  
  try {
    const htmlContent = compiledOtpTemplate({
      otp,
      actionText,
      year: new Date().getFullYear()
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "JanSwar AI", email: brevoFromEmail },
        to: [{ email: email }],
        subject: `JanSwar AI - Verification Code: ${otp}`,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    
    const data = await response.json() as { messageId: string };
    console.log(`[EmailService] OTP email sent successfully to ${email} via Brevo. Message ID: ${data.messageId}`);
  } catch (error: any) {
    console.error("[EmailService] Failed to send OTP email via Brevo REST API:", error.message || error);
    throw new Error("Email sending failed");
  }
}

/**
 * Sends a welcome email upon successful account creation.
 * @param email Recipient email address
 * @param fullName The user's full name
 */
export async function sendWelcomeEmail(email: string, fullName: string): Promise<void> {
  if (!brevoApiKey) {
    console.warn("[EmailService] No BREVO_API_KEY provided. Skipping actual email dispatch.");
    return;
  }

  try {
    const htmlContent = compiledWelcomeTemplate({
      fullName,
      loginUrl: "https://jan-swar-ai.vercel.app/login",
      year: new Date().getFullYear()
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "JanSwar AI", email: brevoFromEmail },
        to: [{ email: email, name: fullName }],
        subject: "🎉 Welcome to JanSwar AI!",
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    
    const data = await response.json() as { messageId: string };
    console.log(`[EmailService] Welcome email sent successfully to ${email} via Brevo. Message ID: ${data.messageId}`);
  } catch (error: any) {
    console.error("[EmailService] Failed to send welcome email via Brevo REST API:", error.message || error);
    // Don't throw here so it doesn't break the signup flow if the welcome email fails
  }
}

/**
 * Sends a password reset OTP email to the user.
 * @param email Recipient email address
 * @param otp The generated 6-digit OTP
 */
export async function sendPasswordResetEmail(email: string, otp: string): Promise<void> {
  if (!brevoApiKey) {
    console.warn("[EmailService] No BREVO_API_KEY provided. Skipping actual email dispatch.");
    return;
  }

  try {
    const htmlContent = compiledOtpTemplate({
      otp,
      actionText: "reset the password for",
      year: new Date().getFullYear()
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "JanSwar AI Support", email: brevoFromEmail },
        to: [{ email: email }],
        subject: `JanSwar AI - Password Reset Code: ${otp}`,
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    
    const data = await response.json() as { messageId: string };
    console.log(`[EmailService] Password reset OTP email sent successfully to ${email} via Brevo. Message ID: ${data.messageId}`);
  } catch (error: any) {
    console.error("[EmailService] Failed to send password reset OTP email via Brevo REST API:", error.message || error);
    throw new Error("Email sending failed");
  }
}

/**
 * Sends a notification email that the password has been successfully changed.
 * @param email Recipient email address
 * @param fullName The user's full name
 */
export async function sendPasswordChangedEmail(email: string, fullName: string): Promise<void> {
  if (!brevoApiKey) {
    console.warn("[EmailService] No BREVO_API_KEY provided. Skipping actual email dispatch.");
    return;
  }

  try {
    const htmlContent = compiledPasswordChangedTemplate({
      fullName,
      loginUrl: "https://jan-swar-ai.vercel.app/login",
      year: new Date().getFullYear()
    });

    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "content-type": "application/json",
        "api-key": brevoApiKey
      },
      body: JSON.stringify({
        sender: { name: "JanSwar AI Security", email: brevoFromEmail },
        to: [{ email: email, name: fullName }],
        subject: "🔒 Password Changed Successfully",
        htmlContent: htmlContent
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(JSON.stringify(errorData));
    }
    
    const data = await response.json() as { messageId: string };
    console.log(`[EmailService] Password Reset OTP sent successfully to ${email} via Brevo. Message ID: ${data.messageId}`);
  } catch (error: any) {
    console.error("[EmailService] Failed to send password reset email via Brevo REST API:", error.message || error);
    throw new Error("Password reset email sending failed");
  }
}
