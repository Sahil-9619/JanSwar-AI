import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const brevoApiKey = process.env.BREVO_API_KEY || "";
const brevoFromEmail = process.env.BREVO_FROM_EMAIL || "info@janswar.com";

// Read and compile the Handlebars template
const templatePath = path.join(__dirname, "../templates/otp-email.hbs");
const templateSource = fs.readFileSync(templatePath, "utf8");
const compiledTemplate = handlebars.compile(templateSource);

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
    // Generate the HTML using Handlebars
    const htmlContent = compiledTemplate({
      otp,
      actionText,
      year: new Date().getFullYear()
    });

    // We use native fetch to call the Brevo v3 API directly, bypassing the broken v6.0.2 SDK typings.
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
