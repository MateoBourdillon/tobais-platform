import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';
import { ContactSubmission } from '@shared/schema';

const isDev = process.env.NODE_ENV !== 'production';

const requiredEnvVars = ['GMAIL_CLIENT_ID', 'GMAIL_CLIENT_SECRET', 'GMAIL_REFRESH_TOKEN', 'GMAIL_EMAIL'];
const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  throw new Error(`Missing required Gmail environment variables: ${missingEnvVars.join(', ')}. Please configure these in your Replit Secrets.`);
}

if (isDev) {
  console.log('Gmail module loaded. Environment variables status:', {
    hasClientId: !!process.env.GMAIL_CLIENT_ID,
    hasClientSecret: !!process.env.GMAIL_CLIENT_SECRET,
    hasRefreshToken: !!process.env.GMAIL_REFRESH_TOKEN,
    hasEmail: !!process.env.GMAIL_EMAIL
  });
}

const EMAIL_RECIPIENTS = ['sales@tobais.com'];

function createOAuth2Client(): OAuth2Client {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GMAIL_CLIENT_ID,
    process.env.GMAIL_CLIENT_SECRET
  );
  
  return oauth2Client;
}

function createMessage(options: {
  to: string | string[],
  subject: string,
  message: string,
  from?: string
}) {
  const from = options.from || process.env.GMAIL_EMAIL;
  const to = Array.isArray(options.to) ? options.to.join(', ') : options.to;
  
  const email = [
    `From: ${from}`,
    `To: ${to}`,
    'Content-Type: text/html; charset=utf-8',
    `Subject: ${options.subject}`,
    '',
    options.message
  ].join('\r\n');
  
  const encodedEmail = Buffer.from(email)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
  
  return encodedEmail;
}

export async function sendGmailEmail(options: {
  to: string | string[],
  subject: string,
  message: string,
  from?: string
}): Promise<boolean> {
  try {
    const oauth2Client = createOAuth2Client();
    
    oauth2Client.setCredentials({ 
      refresh_token: process.env.GMAIL_REFRESH_TOKEN 
    });
    
    try {
      const tokenResponse = await oauth2Client.refreshAccessToken();
      
      if (tokenResponse.credentials.refresh_token) {
        oauth2Client.setCredentials(tokenResponse.credentials);
      }
      
      const gmail = google.gmail({ 
        version: 'v1', 
        auth: oauth2Client 
      });
      
      const encodedMessage = createMessage(options);
      
      if (isDev) {
        console.log(`[Gmail] Sending email to: ${Array.isArray(options.to) ? options.to.join(',') : options.to}`);
        console.log(`[Gmail] Subject: ${options.subject}`);
      }
      
      const result = await gmail.users.messages.send({
        userId: 'me',
        requestBody: {
          raw: encodedMessage
        }
      });
      
      if (isDev) {
        console.log(`[Gmail] Email sent successfully, ID: ${result.data.id || 'Unknown'}`);
      }
      
      return true;
    } catch (tokenError: any) {
      console.error('[Gmail] Token error:', tokenError.message);
      return false;
    }
  } catch (error: any) {
    console.error('[Gmail] Send error:', error.message);
    return false;
  }
}

export async function sendContactNotificationWithGmail(submission: ContactSubmission & {
  customHtmlContent?: string;
  customSubject?: string;
}): Promise<boolean> {
  if (submission.customHtmlContent) {
    return sendGmailEmail({
      to: submission.email ? submission.email : EMAIL_RECIPIENTS,
      subject: submission.customSubject || 'Message from TOBAIS Digital Agency',
      message: submission.customHtmlContent
    });
  }
  
  let serviceInfo = '';
  
  if (submission.serviceId) {
    serviceInfo = `<p><strong>Service ID:</strong> ${submission.serviceId}</p>`;
  } else if (submission.serviceType === "other") {
    serviceInfo = `<p><strong>Service:</strong> Other</p>`;
  }
  
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">New Contact Form Submission</h2>
      <p>You have received a new message from your website contact form:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p><strong>Name:</strong> ${submission.name}</p>
        <p><strong>Email:</strong> ${submission.email}</p>
        ${serviceInfo}
        <p><strong>Message:</strong></p>
        <p style="white-space: pre-line;">${submission.message}</p>
        <p><strong>Date:</strong> ${new Date().toLocaleString()}</p>
      </div>
      
      <p style="color: #666; font-size: 12px;">This is an automated notification from your website.</p>
    </div>
  `;
  
  return sendGmailEmail({
    to: EMAIL_RECIPIENTS,
    subject: 'New Contact Form Submission - TOBAIS',
    message: emailContent
  });
}

export async function sendContactAutoReplyWithGmail(submission: ContactSubmission): Promise<boolean> {
  const emailContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333;">Thank You for Contacting TOBAIS</h2>
      
      <p>Dear ${submission.name},</p>
      
      <p>Thank you for reaching out to us. We have received your message and a member of our team will get back to you shortly.</p>
      
      <p>For your records, here is a copy of your message:</p>
      
      <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="white-space: pre-line;">${submission.message}</p>
      </div>
      
      <p>If you have any urgent matters, please contact us directly at +1 (704) 207-1760.</p>
      
      <p>Best regards,</p>
      <p><strong>The TOBAIS Team</strong></p>
      
      <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 15px;">
        <p style="color: #666; font-size: 12px;">This is an automated response. Please do not reply to this email.</p>
      </div>
    </div>
  `;
  
  return sendGmailEmail({
    to: submission.email,
    subject: 'Thank You for Contacting TOBAIS',
    message: emailContent
  });
}

export async function testGmailConnection(): Promise<boolean> {
  try {
    const oauth2Client = createOAuth2Client();
    
    oauth2Client.setCredentials({ 
      refresh_token: process.env.GMAIL_REFRESH_TOKEN 
    });
    
    try {
      const tokenResponse = await oauth2Client.refreshAccessToken();
      
      if (tokenResponse.credentials.refresh_token) {
        oauth2Client.setCredentials(tokenResponse.credentials);
      }
      
      const gmail = google.gmail({ version: 'v1', auth: oauth2Client });
      const profile = await gmail.users.getProfile({ userId: 'me' });
      
      if (profile.data && profile.data.emailAddress) {
        if (isDev) {
          console.log('[Gmail] Connection test successful');
        }
        return true;
      } else {
        return false;
      }
    } catch (tokenError: any) {
      console.error('[Gmail] Connection test failed:', tokenError.message);
      return false;
    }
  } catch (error: any) {
    console.error('[Gmail] Connection test error:', error.message);
    return false;
  }
}
