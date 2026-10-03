import { deliverContactEmail } from './contact-delivery';
import nodemailer from "nodemailer";
import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";

const isDev = process.env.NODE_ENV !== 'production';

let isEmailConfigured = false;
let emailTransporter: nodemailer.Transporter | null = null;
let serviceType: "gmail" | "smtp" | "none" = "none";

export function getEmailServiceStatus() {
  return {
    isConfigured: isEmailConfigured,
    serviceType: serviceType,
  };
}

export async function setupEmailService() {
  if (
    process.env.GMAIL_CLIENT_ID &&
    process.env.GMAIL_CLIENT_SECRET &&
    process.env.GMAIL_REFRESH_TOKEN &&
    process.env.GMAIL_EMAIL
  ) {
    try {
      if (isDev) {
        console.log("[Email] Gmail credentials found, configuring...");
      }
      
      const oauth2Client = new google.auth.OAuth2(
        process.env.GMAIL_CLIENT_ID,
        process.env.GMAIL_CLIENT_SECRET,
        "https://developers.google.com/oauthplayground"
      );

      oauth2Client.setCredentials({
        refresh_token: process.env.GMAIL_REFRESH_TOKEN,
      });
      
      const accessToken = await new Promise<string>((resolve, reject) => {
        oauth2Client.getAccessToken((err, token) => {
          if (err) {
            reject(err);
          } else if (token) {
            resolve(token);
          } else {
            reject(new Error("No access token returned"));
          }
        });
      });
      
      emailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          type: "OAuth2",
          user: process.env.GMAIL_EMAIL,
          clientId: process.env.GMAIL_CLIENT_ID,
          clientSecret: process.env.GMAIL_CLIENT_SECRET,
          refreshToken: process.env.GMAIL_REFRESH_TOKEN,
          accessToken: accessToken,
        },
      });
      
      isEmailConfigured = true;
      serviceType = "gmail";
      
      if (isDev) {
        console.log("[Email] Gmail service configured successfully");
      }
      
      return true;
    } catch (error) {
      console.error("[Email] Gmail setup error:", error instanceof Error ? error.message : 'Unknown error');
      isEmailConfigured = false;
      serviceType = "none";
      return configureSmtpFallback();
    }
  } else {
    if (isDev) {
      console.log("[Email] Gmail credentials not found, checking SMTP...");
    }
    return configureSmtpFallback();
  }
}

function configureSmtpFallback() {
  if (process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
    try {
      emailTransporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASSWORD,
        },
      });
      isEmailConfigured = true;
      serviceType = "smtp";
      
      if (isDev) {
        console.log("[Email] SMTP service configured successfully");
      }
      
      return true;
    } catch (error) {
      console.error("[Email] SMTP setup error:", error instanceof Error ? error.message : 'Unknown error');
      isEmailConfigured = false;
      serviceType = "none";
      return false;
    }
  } else {
    if (isDev) {
      console.warn("[Email] No email configuration found");
    }
    isEmailConfigured = false;
    serviceType = "none";
    return false;
  }
}

// Enviar email de notificación de contacto
export async function sendContactNotification(data: any) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: "sales@tobais.com",
      subject: `New Contact Form Submission: ${data.name}`,
      html: `
        <h1>New Contact Form Submission</h1>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        ${data.serviceType ? `<p><strong>Service Type:</strong> ${data.serviceType}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${data.message}</p>
      `,
    };

    return await deliverContactEmail(mailOptions);
  } catch (error) {
    console.error("Error sending contact notification email:", error);
    return false;
  }
}

// Enviar respuesta automática al remitente
export async function sendContactAutoReply(data: any) {
  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: data.email,
      subject: `Thank you for contacting TOBAIS`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Thank you for contacting TOBAIS</title>
        </head>
        <body style="margin: 0; padding: 0; background-color: #f5f5f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
          <!-- Apollo-style outer frame -->
          <div style="max-width: 600px; margin: 40px auto; background-color: #e5e7eb; border-radius: 16px; padding: 8px; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);">
            <!-- Inner white content frame -->
            <div style="background-color: #ffffff; border-radius: 12px; overflow: hidden;">
            
            <!-- Header with TOBAIS branding -->
            <div style="background-color: #f8f9fa; padding: 24px 32px; text-align: center; border-bottom: 1px solid #e9ecef;">
              <div style="margin-bottom: 4px;">
                <span style="font-size: 20px; font-weight: 600; color: #1a1a1a;">TOBAIS</span>
              </div>
              <p style="margin: 0; font-size: 14px; color: #6b7280;">AI-Powered Digital Marketing Solutions</p>
            </div>

            <!-- Hero section with TOBAIS gradient -->
            <div style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); padding: 48px 32px; text-align: center; position: relative;">
              <h1 style="margin: 0 0 16px 0; font-size: 32px; font-weight: 700; color: white; text-shadow: none;">Thank You!</h1>
              <p style="margin: 0; font-size: 18px; color: rgba(255, 255, 255, 0.9); font-weight: 400;">Your message has been received and our AI-powered team is on it</p>
            </div>

            <!-- Main content -->
            <div style="padding: 32px;">
              <!-- Greeting -->
              <div style="background-color: #f8fafc; border-radius: 12px; padding: 24px; margin-bottom: 24px; border-left: 4px solid #2563EB;">
                <h2 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: #1f2937;">Hello ${data.name}!</h2>
                <p style="margin: 0; color: #4b5563; line-height: 1.6;">We've received your message and our team will get back to you within <strong>24-48 hours</strong>. We're excited to help you transform your business with AI-powered solutions.</p>
              </div>

              <!-- Summary card -->
              <div style="background: linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #e5e7eb;">
                <h3 style="margin: 0 0 16px 0; font-size: 16px; font-weight: 600; color: #374151;">Message Summary</h3>
                <div style="space-y: 8px;">
                  <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 80px;">Name:</span>
                    <span style="color: #1f2937; font-weight: 600;">${data.name}</span>
                  </div>
                  <div style="display: flex; padding: 8px 0; border-bottom: 1px solid #e5e7eb;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 80px;">Email:</span>
                    <span style="color: #1f2937; font-weight: 600;">${data.email}</span>
                  </div>
                  ${data.serviceType ? `
                  <div style="display: flex; padding: 8px 0;">
                    <span style="color: #6b7280; font-weight: 500; min-width: 80px;">Service:</span>
                    <span style="color: #2563EB; font-weight: 600;">${data.serviceType}</span>
                  </div>
                  ` : ''}
                </div>
              </div>

              <!-- What's next section -->
              <div style="background: linear-gradient(135deg, #2563EB 0%, #7C3AED 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; text-align: center;">
                <h3 style="margin: 0 0 12px 0; font-size: 18px; font-weight: 600; color: white;">What's Next?</h3>
                <p style="margin: 0 0 20px 0; color: #e0e7ff; line-height: 1.6;">Our AI specialists will review your request and prepare a personalized strategy for your business transformation.</p>
                <a href="https://www.tobais.com/services" style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: 600; border: 2px solid rgba(255, 255, 255, 0.3); transition: background-color 0.3s;">Explore Our Services</a>
              </div>

              <!-- Contact info -->
              <div style="text-align: center; padding: 16px 0;">
                <p style="margin: 0 0 12px 0; color: #6b7280; font-size: 14px;">
                  Tu consulta es importante para nosotros, nos contactaremos contigo tan pronto como nos sea posible, usualmente dentro de las próximas <strong>24-48 horas</strong>
                </p>
                <p style="margin: 0 0 8px 0; color: #6b7280; font-size: 14px;">Need immediate assistance?</p>
                <p style="margin: 0 0 8px 0; color: #1f2937; font-weight: 600;">📞 +1 (704) 207-1760</p>
                <div style="display: flex; justify-content: center; gap: 8px;">
                  <a href="https://www.tobais.com" style="color: #2563EB; text-decoration: none; font-size: 12px; font-weight: 500;">Website</a>
                  <span style="color: #6b7280;">|</span>
                  <a href="mailto:sales@tobais.com" style="color: #2563EB; text-decoration: none; font-size: 12px; font-weight: 500;">Contact</a>
                  <span style="color: #6b7280;">|</span>
                  <a href="https://www.tobais.com/services" style="color: #2563EB; text-decoration: none; font-size: 12px; font-weight: 500;">Services</a>
                </div>
              </div>
            </div>

            <!-- Footer -->
            <div style="background-color: #f9fafb; padding: 24px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
              <div style="margin-bottom: 16px;">
                <p style="margin: 0 0 8px 0; font-weight: 600; color: #1f2937;">TOBAIS - Technology on Business Artificial Intelligence Solutions</p>
                <p style="margin: 0; color: #6b7280; font-size: 12px; line-height: 1.5;">
                  Charlotte, NC (U.S.) & Montevideo (Uruguay)
                </p>
              </div>
              <div style="margin-bottom: 16px;">
                <p style="margin: 0; color: #6b7280; font-size: 12px;">
                  Website: <a href="https://www.tobais.com" style="color: #2563EB; text-decoration: underline;">www.tobais.com</a> | Email: <a href="mailto:sales@tobais.com" style="color: #2563EB; text-decoration: underline;">sales@tobais.com</a>
                </p>
              </div>
              <p style="margin: 0; color: #9ca3af; font-size: 11px;">
                ¡Gracias por contar con el equipo de TOBAIS!
              </p>
            </div>
            <!-- End inner frame -->
          </div>
          <!-- End outer frame -->
        </body>
        </html>
      `,
    };

    return await deliverContactEmail(mailOptions);
  } catch (error) {
    console.error("Error sending auto-reply email:", error);
    return false;
  }
}

// Enviar email de factura
export async function sendInvoiceEmail(data: any) {
  if (!isEmailConfigured || !emailTransporter) {
    console.warn("Email service not configured. Cannot send invoice email.");
    return false;
  }

  try {
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: data.to,
      subject: `Invoice #${data.invoiceNumber} from TOBAIS`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2C3E50;">TOBAIS Invoice #${data.invoiceNumber}</h2>
          <p>Hello ${data.clientName},</p>
          <p>We hope this email finds you well. Please find attached your invoice #${data.invoiceNumber} with a total amount of $${data.amount.toFixed(2)}.</p>
          <p><strong>Due Date:</strong> ${data.dueDate.toLocaleDateString()}</p>
          <p><strong>Description:</strong> ${data.description}</p>
          <p>To view and pay your invoice, please click the button below:</p>
          <p style="text-align: center; margin: 25px 0;">
            <a href="${data.paymentLink}" style="background-color: #2C3E50; color: white; padding: 12px 20px; text-decoration: none; border-radius: 4px; font-weight: bold;">View & Pay Invoice</a>
          </p>
          <p>If you have any questions regarding this invoice, please don't hesitate to contact us at sales@tobais.com or call us at +1 (704) 207-1760.</p>
          <p>Thank you for your business!</p>
          <p>Best Regards,<br>The TOBAIS Team</p>
          <div style="margin-top: 20px; border-top: 1px solid #eee; padding-top: 20px; font-size: 12px; color: #777;">
            <p>TOBAIS - Technology on Business Artificial Intelligence Solutions<br>
            Charlotte, NC (U.S.) & Montevideo (Uruguay)<br>
            Website: <a href="https://www.tobais.com">www.tobais.com</a><br>
            Email: <a href="mailto:sales@tobais.com">sales@tobais.com</a></p>
          </div>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Invoice email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending invoice email:", error);
    return false;
  }
}

// Enviar notificación a sales cuando alguien solicita AI Brief
export async function sendOriginalAIBriefNotification(data: any, briefData: any, insights: string[] = [], opportunities: string[] = []) {
  if (!isEmailConfigured || !emailTransporter) {
    console.warn("Email service not configured. Cannot send AI brief notification.");
    return false;
  }

  try {
    const priorityLevel = opportunities.length > 0 ? "🚨 ALTA PRIORIDAD" : "📋 NUEVO LEAD";
    
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: "sales@tobais.com",
      subject: `${priorityLevel}: AI Brief Request - ${data.company} (${data.industry})`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 2px solid ${opportunities.length > 0 ? '#e74c3c' : '#3498db'}; border-radius: 10px;">
          <div style="background: ${opportunities.length > 0 ? '#e74c3c' : '#3498db'}; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">${opportunities.length > 0 ? '🚨 OPORTUNIDAD DE ALTO VALOR' : '📋 NUEVA SOLICITUD AI BRIEF'}</h1>
          </div>
          
          <div style="padding: 25px;">
            <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h2 style="color: #2c3e50; margin-top: 0;">Información del Cliente</h2>
              <p><strong>👤 Nombre:</strong> ${data.name}</p>
              <p><strong>✉️ Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
              <p><strong>🏢 Empresa:</strong> ${data.company}</p>
              <p><strong>🏭 Industria:</strong> ${data.industry}</p>
            </div>
            
            <div style="background: #e8f5e8; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
              <h3 style="color: #27ae60; margin-top: 0;">🎯 Proyecto Solicitado</h3>
              <p><strong>Objetivo:</strong> ${data.goal}</p>
              <p><strong>Estilo preferido:</strong> ${data.style}</p>
              <p><strong>💰 Presupuesto:</strong> $${data.budget}</p>
              ${data.notes ? `<p><strong>Notas adicionales:</strong> ${data.notes}</p>` : ''}
            </div>
            
            ${opportunities.length > 0 ? `
            <div style="background: #fee; border: 2px solid #e74c3c; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
              <h3 style="color: #e74c3c; margin-top: 0;">💎 OPORTUNIDADES DE ALTO VALOR DETECTADAS</h3>
              <ul style="color: #c0392b; font-weight: bold;">
                ${opportunities.map(opp => `<li>${opp}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            ${insights.length > 0 ? `
            <div style="background: #fff8dc; border: 1px solid #f39c12; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
              <h4 style="color: #e67e22; margin-top: 0;">🔍 Análisis de Oportunidades</h4>
              <ul style="color: #d68910;">
                ${insights.map(insight => `<li>${insight}</li>`).join('')}
              </ul>
            </div>
            ` : ''}
            
            <div style="background: #f0f8ff; padding: 20px; border-radius: 8px;">
              <h3 style="color: #3498db; margin-top: 0;">🤖 AI Brief Generado</h3>
              <p><strong>Título:</strong> ${briefData.title}</p>
              <div style="background: white; padding: 15px; border-radius: 5px; border-left: 4px solid #3498db;">
                <p><strong>El cliente recibió un AI Brief personalizado en su email.</strong></p>
                <p style="font-size: 14px; color: #666;">Este lead ya tiene engagement - responde rápidamente.</p>
              </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee;">
              <p style="margin: 0; font-size: 14px; color: #666;">
                📞 <strong>Acción recomendada:</strong> ${opportunities.length > 0 ? 'Contactar dentro de 2 horas (alto valor)' : 'Seguimiento en 24-48 horas'}
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("AI Brief notification email sent to sales@tobais.com:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending AI Brief notification email:", error);
    return false;
  }
}

// Enviar brief de IA al cliente
export async function sendOriginalAIBriefEmail(data: any, briefData: any) {
  console.log("Iniciando sendAIBriefEmail:", {
    isEmailConfigured,
    hasTransporter: !!emailTransporter,
    serviceType,
    dataEmail: data?.email
  });
  
  if (!isEmailConfigured || !emailTransporter) {
    console.warn("Email service not configured. Cannot send AI brief.", {
      isEmailConfigured,
      hasTransporter: !!emailTransporter,
      serviceType
    });
    return false;
  }

  try {
    console.log("Preparando email AI Brief:", {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: data.email,
      hasEmail: !!data.email,
      emailValue: data.email
    });
    
    if (!data.email) {
      console.error("Email del destinatario no está definido");
      return false;
    }
    
    const mailOptions = {
      from: process.env.GMAIL_EMAIL || process.env.EMAIL_USER,
      to: data.email,
      subject: `Your AI-Generated Marketing Brief - ${briefData.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px;">
          <div style="background: rgba(255,255,255,0.95); color: #333; padding: 30px; border-radius: 15px; margin: 20px;">
            <div style="text-align: center; margin-bottom: 30px;">
              <h1 style="color: #764ba2; margin: 0; font-size: 28px;">🚀 Your AI-Generated Marketing Brief</h1>
              <p style="color: #666; margin: 10px 0;">Powered by TOBAIS AI Technology</p>
            </div>
            
            <div style="background: #f8f9fa; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <h2 style="color: #764ba2; margin-top: 0;">${briefData.title}</h2>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #555;">📋 Project Summary</h3>
              <p style="line-height: 1.6; color: #666;">${briefData.summary}</p>
            </div>
            
            <div style="margin-bottom: 25px;">
              <h3 style="color: #555;">🎯 Strategic Recommendations</h3>
              <ul style="line-height: 1.8; color: #666;">
                ${briefData.bullets.map((bullet: string) => `<li style="margin-bottom: 8px;">${bullet}</li>`).join('')}
              </ul>
            </div>
            
            <div style="background: #e3f2fd; padding: 20px; border-radius: 10px; margin-bottom: 25px;">
              <h3 style="color: #1976d2; margin-top: 0;">📊 Your Project Details</h3>
              <p><strong>Company:</strong> ${data.company}</p>
              <p><strong>Industry:</strong> ${data.industry}</p>
              <p><strong>Goal:</strong> ${data.goal}</p>
              <p><strong>Style:</strong> ${data.style}</p>
              <p><strong>Budget:</strong> $${data.budget}</p>
              ${data.notes ? `<p><strong>Additional Notes:</strong> ${data.notes}</p>` : ''}
            </div>
            
            <div style="text-align: center; margin-top: 30px;">
              <a href="https://www.tobais.com/contact" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">
                💬 Let's Discuss Your Project
              </a>
            </div>
            
            <div style="margin-top: 30px; border-top: 1px solid #eee; padding-top: 20px; font-size: 14px; color: #777; text-align: center;">
              <p><strong>TOBAIS</strong> - Technology on Business Artificial Intelligence Solutions<br>
              Charlotte, NC (U.S.) & Montevideo (Uruguay)<br>
              Website: <a href="https://www.tobais.com" style="color: #764ba2;">www.tobais.com</a><br>
              Email: <a href="mailto:sales@tobais.com" style="color: #764ba2;">sales@tobais.com</a><br>
              Phone: +1 (704) 207-1760</p>
              
              <p style="margin-top: 15px; font-size: 12px; color: #999;">
                This AI brief was generated specifically for ${data.name} at ${data.company} using advanced artificial intelligence technology.
              </p>
            </div>
          </div>
        </div>
      `,
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("AI Brief email sent:", info.messageId);
    return true;
  } catch (error) {
    console.error("Error sending AI brief email:", error);
    return false;
  }
}

// =============================================
// STAFF EMAIL FUNCTIONS
// =============================================

interface StaffAIBriefEmailData {
  to: string;
  recipientName: string;
  companyName: string;
  emailContent: string;
  trackingId: string;
  staffMemberName: string;
  baseUrl?: string;
}

export async function sendAIBriefEmail(data: StaffAIBriefEmailData): Promise<boolean> {
  console.log("Iniciando envío de email AI Brief para staff:", {
    isEmailConfigured,
    hasTransporter: !!emailTransporter,
    serviceType,
    recipient: data.to,
    company: data.companyName
  });
  
  if (!isEmailConfigured || !emailTransporter) {
    console.warn("Email service not configured. Cannot send staff AI brief email.", {
      isEmailConfigured,
      hasTransporter: !!emailTransporter,
      serviceType
    });
    return false;
  }

  try {
    const subject = `Strategic Marketing Insights for ${data.companyName} | TOBAIS`;
    
    // Use scalable email tracking service
    const { createEmailTracking } = await import('./email-tracking');
    const emailTracking = createEmailTracking(data.trackingId, data.companyName, data.baseUrl);
    
    // Generate the complete email template with tracking
    const htmlContent = emailTracking.generateEmailTemplate({
      subject,
      body: data.emailContent,
      companyName: data.companyName,
      staffName: data.staffMemberName
    });


    const mailOptions = {
      from: `${data.staffMemberName} at TOBAIS <sales@tobais.com>`,
      to: data.to,
      subject: subject,
      html: htmlContent,
      text: data.emailContent // Fallback plain text
    };

    console.log("Enviando email de staff AI brief:", {
      from: mailOptions.from,
      to: data.to,
      subject: subject
    });

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("Staff AI brief email sent successfully:", info.messageId);
    return true;
    
  } catch (error) {
    console.error("Error sending staff AI brief email:", error);
    return false;
  }
}

// Notificación interna de nuevo AI Brief creado (para administradores)
export async function sendAIBriefNotification(staffMemberName: string, companyName: string, leadScore: number): Promise<boolean> {
  if (!isEmailConfigured || !emailTransporter) {
    console.warn("Email service not configured. Cannot send AI brief notification.");
    return false;
  }

  try {
    const subject = `🚀 New AI Brief Generated: ${companyName} (Score: ${leadScore}%)`;
    
    const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f8fafc; padding: 20px;">
        <div style="background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
          
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #8b5cf6; margin: 0;">🧠 TOBAIS Staff Alert</h1>
            <p style="color: #6b7280; margin: 10px 0;">New AI Marketing Brief Generated</p>
          </div>
          
          <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #1e40af;">Brief Details</h3>
            <p><strong>Company:</strong> ${companyName}</p>
            <p><strong>Generated by:</strong> ${staffMemberName}</p>
            <p><strong>Lead Score:</strong> <span style="color: ${leadScore >= 75 ? '#22c55e' : leadScore >= 50 ? '#f59e0b' : '#ef4444'}; font-weight: bold;">${leadScore}%</span></p>
            <p><strong>Timestamp:</strong> ${new Date().toLocaleString()}</p>
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="https://tobais.com/admin" style="background: #8b5cf6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View in Admin Dashboard
            </a>
          </div>
          
        </div>
      </div>
    `;

    const mailOptions = {
      from: `TOBAIS System <${process.env.GMAIL_EMAIL || process.env.EMAIL_USER}>`,
      to: process.env.GMAIL_EMAIL || process.env.EMAIL_USER, // Send to admin
      subject: subject,
      html: htmlContent
    };

    const info = await emailTransporter.sendMail(mailOptions);
    console.log("AI brief notification sent:", info.messageId);
    return true;
    
  } catch (error) {
    console.error("Error sending AI brief notification:", error);
    return false;
  }
}