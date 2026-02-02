import { storage } from './storage';

export interface EmailTrackingConfig {
  submissionId: string;
  baseUrl: string;
  utm: {
    source: string;
    medium: string;
    campaign?: string;
  };
}

export interface TrackingLink {
  url: string;
  type: 'primary' | 'secondary' | 'pixel';
  description: string;
}

/**
 * Scalable Email Tracking System
 * 
 * This system provides comprehensive email tracking that works around Gmail's
 * image blocking policies by using multiple tracking strategies:
 * 1. Link-based tracking (primary method)
 * 2. Pixel tracking (fallback for non-Gmail clients)
 * 3. UTM parameter tracking for analytics
 */
export class EmailTrackingService {
  private config: EmailTrackingConfig;

  constructor(config: EmailTrackingConfig) {
    this.config = config;
  }

  /**
   * Generate all tracking URLs for an email campaign
   */
  generateTrackingUrls(): {
    pixel: string;
    links: Record<string, TrackingLink>;
  } {
    const { submissionId, baseUrl, utm } = this.config;
    const utmParams = this.buildUtmParams(utm);

    return {
      pixel: `${baseUrl}/api/staff/track-open?submissionId=${submissionId}`,
      links: {
        contact: {
          url: `${baseUrl}/contact?briefId=${submissionId}`,
          type: 'primary',
          description: 'Schedule Free Consultation'
        },
        website: {
          url: this.createTrackingLink(`${baseUrl}${utmParams}`, 'website'),
          type: 'secondary',
          description: 'Visit Our Website'
        },
        services: {
          url: this.createTrackingLink(`${baseUrl}/services${utmParams}`, 'services'),
          type: 'secondary',
          description: 'View Our Services'
        },
        about: {
          url: this.createTrackingLink(`${baseUrl}/about${utmParams}`, 'about'),
          type: 'secondary',
          description: 'About TOBAIS'
        },
        // Gmail-specific tracking link (appears as text but triggers tracking)
        viewOnline: {
          url: this.createTrackingLink(`${baseUrl}/email-view?id=${submissionId}`, 'view-online'),
          type: 'pixel',
          description: 'View this email online'
        }
      }
    };
  }

  /**
   * Create a tracking link that logs interaction before redirecting
   */
  private createTrackingLink(destination: string, linkType: string): string {
    const { submissionId, baseUrl } = this.config;
    return `${baseUrl}/api/staff/track-click?submissionId=${submissionId}&type=${linkType}&redirectTo=${encodeURIComponent(destination)}`;
  }

  /**
   * Build UTM parameters for analytics tracking
   */
  private buildUtmParams(utm: EmailTrackingConfig['utm']): string {
    const params = new URLSearchParams({
      utm_source: utm.source,
      utm_medium: utm.medium,
      ref: this.config.submissionId
    });

    if (utm.campaign) {
      params.set('utm_campaign', utm.campaign);
    }

    return `?${params.toString()}`;
  }

  /**
   * Track email open event (called by pixel or link tracking)
   */
  static async trackOpen(submissionId: string, metadata: {
    userAgent?: string;
    ip?: string;
    method: 'pixel' | 'link' | 'view-online';
  }): Promise<void> {
    try {
      await storage.createStaffEmailTracking({
        submissionId,
        eventType: 'opened',
        eventData: {
          openedAt: new Date(),
          userAgent: metadata.userAgent,
          ip: metadata.ip,
          method: metadata.method
        }
      });
      console.log(`📧 Email opened via ${metadata.method} - submissionId: ${submissionId}`);
    } catch (error) {
      console.error('Failed to track email open:', error);
    }
  }

  /**
   * Track link click event
   */
  static async trackClick(submissionId: string, linkType: string, metadata: {
    userAgent?: string;
    ip?: string;
    destination: string;
  }): Promise<void> {
    try {
      // Track both open and click events when user clicks
      await Promise.all([
        this.trackOpen(submissionId, {
          userAgent: metadata.userAgent,
          ip: metadata.ip,
          method: 'link'
        }),
        storage.createStaffEmailTracking({
          submissionId,
          eventType: 'clicked',
          eventData: {
            clickedAt: new Date(),
            userAgent: metadata.userAgent,
            ip: metadata.ip,
            linkType,
            destination: metadata.destination
          }
        })
      ]);

      // If this is a contact/consultation click, update email effectiveness
      if (linkType === 'contact') {
        await this.markEmailEffective(submissionId);
      }
      
      console.log(`🔗 Link clicked (${linkType}) - submissionId: ${submissionId}`);
    } catch (error) {
      console.error('Failed to track link click:', error);
    }
  }

  /**
   * Mark email as effective when consultation button is clicked
   */
  static async markEmailEffective(submissionId: string): Promise<void> {
    try {
      await storage.updateEmailEffectiveness(submissionId, 1);
      console.log(`📧 Email marked as effective - submissionId: ${submissionId}`);
    } catch (error) {
      console.error('Failed to mark email as effective:', error);
    }
  }

  /**
   * Generate responsive email template with tracking
   */
  generateEmailTemplate(content: {
    subject: string;
    body: string;
    companyName: string;
    staffName: string;
  }): string {
    const tracking = this.generateTrackingUrls();

    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${content.subject}</title>
        <style>
          /* Responsive email styles */
          .email-container { font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 700px; margin: 0 auto; background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); }
          .content-wrapper { background: rgba(255,255,255,0.98); margin: 20px; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 40px rgba(139, 92, 246, 0.3); }
          .header { background: linear-gradient(135deg, #8b5cf6 0%, #3b82f6 100%); padding: 30px 20px; text-align: center; color: white; }
          .brain-icon { font-size: 48px; margin-bottom: 10px; display: block; }
          .company-name { font-size: 28px; font-weight: 700; margin: 0; letter-spacing: -0.5px; }
          .tagline { font-size: 14px; opacity: 0.9; margin: 5px 0 0 0; }
          .main-content { padding: 40px 30px; line-height: 1.7; color: #374151; }
          .email-body { white-space: pre-wrap; font-size: 16px; }
          .cta-section { background: #f8fafc; padding: 30px; text-align: center; border-radius: 12px; margin: 30px 0; }
          .cta-button { display: inline-block; background: #10b981; color: #000000; padding: 14px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; box-shadow: 0 4px 12px rgba(16, 185, 129, 0.4); }
          .secondary-links { margin-top: 20px; display: flex; justify-content: center; gap: 20px; flex-wrap: wrap; }
          .secondary-link { color: #8b5cf6; text-decoration: none; font-weight: 500; }
          .footer { background: #1f2937; color: #9ca3af; padding: 30px; text-align: center; }
          .footer-logo { color: #8b5cf6; font-size: 18px; font-weight: 700; margin-bottom: 15px; }
          .contact-info { font-size: 14px; line-height: 1.6; }
          .view-online { font-size: 12px; color: #6b7280; text-align: center; margin: 10px 0; }
          
          /* Mobile responsiveness */
          @media (max-width: 600px) {
            .email-container { margin: 0; }
            .content-wrapper { margin: 10px; }
            .main-content { padding: 20px 15px; }
            .secondary-links { flex-direction: column; gap: 10px; }
          }
        </style>
      </head>
      <body style="margin: 0; padding: 20px; background: #f3f4f6;">
        <!-- View online tracking link -->
        <div class="view-online">
          <a href="${tracking.links.viewOnline.url}" style="color: #6b7280; text-decoration: none;">
            Can't see this email? View it online
          </a>
        </div>
        
        <div class="email-container">
          <div class="content-wrapper">
            <div class="header">
              <div class="logo-section">
                <span class="brain-icon">🧠</span>
                <h1 class="company-name">TOBAIS</h1>
                <p class="tagline">AI-Powered Marketing Intelligence</p>
              </div>
            </div>
            
            <div class="main-content">
              <div class="email-body">${content.body}</div>
              
              <div class="cta-section">
                <h3 style="color: #1f2937; margin-top: 0; font-size: 20px;">Ready to transform your digital presence?</h3>
                <p style="margin-bottom: 25px; color: #6b7280;">Let's discuss how we can help ${content.companyName} achieve remarkable growth.</p>
                <a href="https://tobais.com/contact?briefId=${this.config.submissionId}" class="cta-button">Schedule Free Consultation</a>
                
                <div class="secondary-links">
                  <a href="${tracking.links.website.url}" class="secondary-link">${tracking.links.website.description} →</a>
                  <a href="${tracking.links.services.url}" class="secondary-link">${tracking.links.services.description} →</a>
                  <a href="${tracking.links.about.url}" class="secondary-link">${tracking.links.about.description} →</a>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-logo">TOBAIS</div>
              <div class="contact-info">
                AI-Powered Marketing Intelligence<br>
                Charlotte, NC (U.S.) & Montevideo (Uruguay)<br>
                <a href="mailto:sales@tobais.com" style="color: #8b5cf6;">sales@tobais.com</a> | 
                <a href="tel:+17042071760" style="color: #8b5cf6;">+1 (704) 207-1760</a><br>
                <br>
                <a href="${tracking.links.website.url}" style="color: #8b5cf6;">www.tobais.com</a><br>
                <br>
                <div style="font-size: 12px; margin-top: 15px;">
                  This email was sent to you because you requested information from TOBAIS.<br>
                  If you no longer wish to receive these insights, please reply with "UNSUBSCRIBE".
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Multiple tracking methods for maximum compatibility -->
        <!-- Pixel tracking (fallback for non-Gmail clients) -->
        <img src="${tracking.pixel}" alt="" style="width:1px;height:1px;display:none;" />
        <div style="background-image: url('${tracking.pixel}'); width:1px; height:1px; position:absolute; top:-9999px;"></div>
      </body>
      </html>
    `;
  }
}

/**
 * Create a new email tracking service instance
 */
export function createEmailTracking(submissionId: string, companyName: string, baseUrl?: string): EmailTrackingService {
  return new EmailTrackingService({
    submissionId,
    baseUrl: baseUrl || process.env.APP_URL || 'https://tobais.com',
    utm: {
      source: 'staff_outreach',
      medium: 'email',
      campaign: companyName.toLowerCase().replace(/\s+/g, '_')
    }
  });
}