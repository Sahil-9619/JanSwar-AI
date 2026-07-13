import * as brevo from "@getbrevo/brevo";
import fs from "fs";
import path from "path";
import handlebars from "handlebars";

const brevoApiKey = process.env.BREVO_API_KEY || "";
const brevoFromEmail = process.env.BREVO_FROM_EMAIL || "info@janswar.com";

let apiInstance: brevo.TransactionalEmailsApi | null = null;
if (brevoApiKey) {
  apiInstance = new brevo.TransactionalEmailsApi();
  apiInstance.setApiKey(brevo.TransactionalEmailsApiApiKeys.apiKey, brevoApiKey);
}

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
  if (!apiInstance) {
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

    const sendSmtpEmail = new brevo.SendSmtpEmail();
    sendSmtpEmail.subject = `JanSwar AI - Verification Code: ${otp}`;
    sendSmtpEmail.htmlContent = htmlContent;
    sendSmtpEmail.sender = { name: "JanSwar AI", email: brevoFromEmail };
    sendSmtpEmail.to = [{ email: email }];

    const data = await apiInstance.sendTransacEmail(sendSmtpEmail);
    
    console.log(`[EmailService] OTP email sent successfully to ${email} via Brevo. ID: ${data.body.messageId}`);
  } catch (error: any) {
    console.error("[EmailService] Failed to send OTP email via Brevo:", error.response?.body || error);
    throw new Error("Email sending failed");
  }
}
