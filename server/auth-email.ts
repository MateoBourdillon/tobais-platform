import { MailService } from '@sendgrid/mail';
import { randomBytes } from 'crypto';
import { scrypt as scryptCallback } from 'crypto';
import { promisify } from 'util';

const scryptAsync = promisify(scryptCallback);

// Initialize SendGrid
const sgMail = new MailService();

// Environment variables with validation
const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY;
const MAIL_FROM = process.env.MAIL_FROM || 'no-reply@tobais.com';
const APP_URL = process.env.APP_URL || 'https://tobais.com';
const OTP_TTL_MINUTES = parseInt(process.env.OTP_TTL_MINUTES || '10');

// Initialize SendGrid service
export function initializeSendGrid() {
  if (!SENDGRID_API_KEY) {
    console.warn('⚠️  SendGrid API key not found. Auth emails will not work.');
    return false;
  }

  // Validate SendGrid API key format
  if (!SENDGRID_API_KEY.toLowerCase().startsWith('sg.')) {
    console.error('❌ Invalid SendGrid API key format. Must start with "SG."');
    return false;
  }

  // Check if it's the expected key (starts with sg.n912)
  if (!SENDGRID_API_KEY.toLowerCase().startsWith('sg.n912')) {
    console.warn('⚠️  SendGrid API key does not match expected format (sg.n912...)');
  }

  try {
    sgMail.setApiKey(SENDGRID_API_KEY);
    console.log('✅ SendGrid initialized successfully');
    console.log('📧 Auth email configuration:', {
      hasApiKey: !!SENDGRID_API_KEY,
      keyPrefix: SENDGRID_API_KEY.substring(0, 8) + '...',
      mailFrom: MAIL_FROM,
      appUrl: APP_URL,
      otpTtlMinutes: OTP_TTL_MINUTES
    });
    return true;
  } catch (error) {
    console.error('❌ Failed to initialize SendGrid:', error);
    return false;
  }
}

// Generate 6-digit OTP
export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

// Hash OTP using scrypt (same as password hashing)
export async function hashOTP(otp: string): Promise<string> {
  const salt = randomBytes(16).toString('hex');
  const buf = (await scryptAsync(otp, salt, 64)) as Buffer;
  return `${buf.toString('hex')}.${salt}`;
}

// Verify OTP against hash
export async function verifyOTP(otp: string, hash: string): Promise<boolean> {
  try {
    const [hashedOtp, salt] = hash.split('.');
    const hashedBuf = Buffer.from(hashedOtp, 'hex');
    const suppliedBuf = (await scryptAsync(otp, salt, 64)) as Buffer;
    return hashedBuf.equals(suppliedBuf);
  } catch (error) {
    console.error('Error verifying OTP:', error);
    return false;
  }
}

// Calculate OTP expiry time
export function getOTPExpiry(): Date {
  return new Date(Date.now() + OTP_TTL_MINUTES * 60 * 1000);
}

// Email templates
interface EmailTemplateData {
  email: string;
  code: string;
  expiresIn: string;
  appUrl: string;
  supportEmail: string;
}

// Send forgot password OTP email
export async function sendForgotPasswordOTP(data: EmailTemplateData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid not configured for forgot password email');
    return false;
  }

  try {
    const msg = {
      to: data.email,
      from: MAIL_FROM,
      subject: 'Your TOBAIS password reset code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">TOBAIS</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Digital Marketing Solutions</p>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Password Reset Code</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              You requested a password reset for your TOBAIS account. Use the code below to reset your password:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${data.code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              This code expires in ${data.expiresIn} minutes.
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you didn't request this code, please ignore this email.<br>
                Need help? Contact us at <a href="mailto:${data.supportEmail}" style="color: #7c3aed;">${data.supportEmail}</a>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        TOBAIS - Password Reset Code
        
        You requested a password reset for your TOBAIS account.
        
        Your code: ${data.code}
        
        This code expires in ${data.expiresIn} minutes.
        
        If you didn't request this code, please ignore this email.
        Need help? Contact us at ${data.supportEmail}
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Forgot password OTP sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send forgot password OTP:', error);
    return false;
  }
}

// Send email verification OTP
export async function sendEmailVerificationOTP(data: EmailTemplateData): Promise<boolean> {
  if (!SENDGRID_API_KEY) {
    console.error('SendGrid not configured for email verification');
    return false;
  }

  try {
    const msg = {
      to: data.email,
      from: MAIL_FROM,
      subject: 'Your TOBAIS verification code',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #7c3aed; font-size: 28px; margin: 0;">TOBAIS</h1>
              <p style="color: #666; margin: 5px 0 0 0;">Digital Marketing Solutions</p>
            </div>
            
            <h2 style="color: #333; text-align: center; margin-bottom: 20px;">Email Verification</h2>
            
            <p style="color: #666; font-size: 16px; line-height: 1.5;">
              Welcome to TOBAIS! Please verify your email address using the code below:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <div style="font-size: 32px; font-weight: bold; color: #7c3aed; letter-spacing: 4px; font-family: 'Courier New', monospace;">
                ${data.code}
              </div>
            </div>
            
            <p style="color: #666; font-size: 14px; text-align: center;">
              This code expires in ${data.expiresIn} minutes.
            </p>
            
            <div style="border-top: 1px solid #eee; margin-top: 30px; padding-top: 20px;">
              <p style="color: #999; font-size: 12px; text-align: center; margin: 0;">
                If you didn't create an account with TOBAIS, please ignore this email.<br>
                Need help? Contact us at <a href="mailto:${data.supportEmail}" style="color: #7c3aed;">${data.supportEmail}</a>
              </p>
            </div>
          </div>
        </div>
      `,
      text: `
        TOBAIS - Email Verification Code
        
        Welcome to TOBAIS! Please verify your email address.
        
        Your code: ${data.code}
        
        This code expires in ${data.expiresIn} minutes.
        
        If you didn't create an account with TOBAIS, please ignore this email.
        Need help? Contact us at ${data.supportEmail}
      `
    };

    await sgMail.send(msg);
    console.log(`✅ Email verification OTP sent to ${data.email}`);
    return true;
  } catch (error) {
    console.error('❌ Failed to send email verification OTP:', error);
    return false;
  }
}

// Simplified function to send verification email
export async function sendVerificationEmail(email: string, code: string, name: string): Promise<boolean> {
  const data: EmailTemplateData = {
    email,
    code,
    expiresIn: OTP_TTL_MINUTES.toString(),
    appUrl: APP_URL,
    supportEmail: 'support@tobais.com'
  };
  
  return await sendEmailVerificationOTP(data);
}

// Export configuration for use in other modules
export const authEmailConfig = {
  MAIL_FROM,
  APP_URL,
  OTP_TTL_MINUTES,
  supportEmail: 'sales@tobais.com'
};