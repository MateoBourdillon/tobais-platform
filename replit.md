# TOBAIS Technology Platform

## Overview

TOBAIS is a digital agency web application specializing in web design, automation, branding, and social media marketing services powered by Artificial Intelligence. The platform serves as both a client-facing website showcasing services and portfolio, and an administrative system for managing projects, invoices, and client relationships. The application supports bilingual functionality (English/Spanish) and includes comprehensive project management, payment processing, and content management capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

### Recent Design Preferences (August 2025)
- Prefers card-based designs over floating elements for better mobile experience
- Loves neon brain branding with purple glow effects for futuristic AI aesthetics
- Values hierarchical three-level layout design for visual organization
- Appreciates elegant navigation with smooth animations and hover effects
- Favors Apollo-inspired email templates with modern gradients and professional card layouts

### Email Validation Hardening (August 12, 2025)
- Successfully implemented comprehensive email validation security system
- Email normalization (sanitizeEmail function) applied across all authentication endpoints
- 409 status codes for duplicate detection with generic security messages
- Rate limiting on check-email endpoint (10 attempts/minute) for registration protection
- Frontend Zod schemas with async duplicate checking and real-time validation
- Complete isolation maintained - existing contact form and authentication remain untouched

### Authentication System Recovery (August 12, 2025)
- **CRITICAL FIX**: Resolved routing regression that caused 404 errors on registration page
- Root cause: Async validation functions in Zod schemas were incompatible and breaking component rendering
- Solution: Removed problematic async validations from use-auth.tsx registerSchema
- Maintained separate email validation system in /features/auth/validation/email.ts
- Confirmed functionality: Both /auth (login) and /auth?mode=register (registration) working perfectly
- User registration and dashboard access fully operational
- Translation system cleaned and organized for auth components

### Email Verification Flow - FULLY OPERATIONAL (August 14, 2025)
- **STATUS**: ✅ Email verification system 100% functional and production-ready
- **COMPLETED IMPLEMENTATION**: 
  - EmailVerification component fully integrated into AuthPage with direct fetch calls
  - Registration flow with success toast and automatic redirect (1.5 seconds)
  - SendGrid OTP system operational with 6-digit verification codes
  - Fixed all frontend API calling issues by replacing apiRequest with direct fetch
  - Mandatory email verification gate - users cannot access dashboard without verification
  - User role detection working correctly (normal users vs admin dashboards)
- **TESTING RESULTS**: ✅ Complete end-to-end testing successful
  - User registration: marlorytora@gmail.com ✅
  - Email OTP delivery via SendGrid ✅  
  - Email verification with code ✅
  - Dashboard access for verified users ✅
  - User role-based dashboard display ✅
- **PRODUCTION STATUS**: Ready for live deployment with full email verification enforcement

### Dual Brief Editing System Implementation (August 24, 2025)
- **FEATURE**: ✅ Dual editing modes for AI-generated briefs implemented
- **COMPLETED IMPLEMENTATION**: 
  - **BriefContentEditor**: Direct editing of AI-generated content (analysis, recommendations, email text, lead score)
  - **ProspectDataEditor**: Editing prospect information and full AI brief regeneration
  - Two distinct editing buttons in BriefsList: blue Edit button (content) and purple Regenerate button (prospect data)
  - Backend endpoints: PUT /api/staff/briefs/:id for updates, POST /api/staff/send-email for email sending
  - Email sender configuration: All staff emails sent from "Staff Name at TOBAIS <sales@tobais.com>"
- **USER WORKFLOW**: 
  1. Staff can edit saved brief content directly without regeneration
  2. Staff can modify prospect data and trigger complete AI brief regeneration
  3. Both editing modes support email sending with updated content
  4. Navigation system with back buttons for seamless workflow
- **TECHNICAL DETAILS**: 
  - State management in StaffDashboard with editingBrief and editMode states
  - Integration with existing OpenAI API endpoints for regeneration
  - Proper error handling and validation in both editing modes

### Brief Regeneration System Fix (August 28, 2025)
- **CRITICAL FIX**: ✅ Resolved "Failed to execute 'fetch'" error in brief regeneration functionality
- **ROOT CAUSE**: Incorrect apiRequest parameter order in ProspectDataEditor.tsx causing invalid HTTP method error
- **SOLUTION IMPLEMENTED**: 
  - Fixed apiRequest calls from `apiRequest(url, {method, body})` to `apiRequest("POST", url, data)` format
  - Updated regeneration mutation to use correct API response properties (analysis, recommendations, personalizedEmail)
  - Verified server endpoint `/api/staff/generate-ai-brief` returns expected response structure
- **SYSTEM STATUS**: 
  - Brief regeneration: ✅ Fixed and operational with correct API call syntax
  - Prospect data editing: ✅ Both content editing and regeneration workflows functional
  - Staff authentication: ✅ Session-based authentication working correctly
  - Database updates: ✅ Brief updates saving properly to ai_brief_submissions table
- **FUNCTIONALITY CONFIRMED**: 
  - Edit existing brief content: ✅ Working
  - Regenerate with new prospect data: ✅ Fixed and functional
  - Email sending: ✅ Operational with tracking integration

### Scalable Email Tracking System Implementation (August 28, 2025)
- **COMPLETE REDESIGN**: ✅ Implemented enterprise-grade email tracking system to replace problematic pixel-only approach
- **ROOT CAUSE**: Gmail blocking policies made simple pixel tracking unreliable for real-world use
- **SCALABLE SOLUTION IMPLEMENTED**: 
  - **EmailTrackingService Class**: Centralized tracking service with multiple detection methods
  - **Multi-Modal Tracking**: Pixel fallback + link-based tracking + "view online" trigger
  - **Gmail-Compatible Design**: Multiple tracking vectors that work around image blocking
  - **UTM Parameter Integration**: Comprehensive analytics tracking with campaign attribution
  - **Responsive Email Templates**: Professional templates with mobile optimization
  - **Priority Endpoint Registration**: Tracking endpoints registered before Vite middleware to prevent interference
- **SYSTEM ARCHITECTURE**: 
  - `server/email-tracking.ts`: Scalable service class with comprehensive tracking methods
  - `server/index.ts`: Priority endpoint registration for `/api/staff/track-open`, `/api/staff/track-click`, `/email-view`
  - `server/email.ts`: Updated to use new tracking service for all staff emails
- **TRACKING METHODS**: 
  - **Primary**: Link-based tracking (most reliable with Gmail)
  - **Secondary**: Traditional pixel tracking (fallback for non-Gmail clients)
  - **Tertiary**: "View online" link tracking (user-initiated but highly reliable)
- **FEATURES**: 
  - Email tracking pixel: ✅ Serving correct PNG responses (70 bytes)
  - Database tracking: ✅ Multiple event types ('opened', 'clicked', 'sent')
  - Gmail compatibility: ✅ Multiple detection methods bypass restrictions
  - Individual client tracking: ✅ Comprehensive interaction logging
  - CSV export functionality: ✅ Full analytics and reporting ready
  - Campaign attribution: ✅ UTM parameters and referral tracking
- **PRODUCTION READY**: System designed for scalability and enterprise email marketing compliance

## System Architecture

### Full-Stack Architecture

The application follows a modern monorepo structure with clear separation between client and server code:

- **Frontend**: React SPA built with Vite, using TypeScript and Tailwind CSS for styling
- **Backend**: Node.js Express server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for type-safe database operations
- **Build System**: Vite for frontend bundling, esbuild for server-side compilation

### Database Design

The system uses PostgreSQL with a comprehensive schema including:

- **User Management**: Users table with role-based access control (user, admin, superadmin) and admin levels (0-5)
- **Project Management**: Projects, project milestones, updates, and comments for client work tracking
- **Financial Management**: Invoices, payment records, and orders with line items
- **Content Management**: Blog posts, social media content, testimonials, and service types
- **Communication**: Contact submissions with service categorization

The database schema is managed through Drizzle migrations with proper foreign key relationships and indexing.

### Authentication & Authorization

- **Session-based Authentication**: Using Express sessions with memory store
- **Password Security**: Scrypt-based password hashing with salt
- **Role-based Access Control**: Multi-level admin system with granular permissions
- **Protected Routes**: Client-side route protection with authentication checks

### API Architecture

RESTful API design with the following patterns:

- **CRUD Operations**: Standard HTTP methods for resource management
- **Authentication Middleware**: Session-based user verification
- **Role-based Endpoints**: Admin-only routes for management functions
- **Error Handling**: Consistent error responses and logging

### Frontend Architecture

Modern React application with:

- **Component Library**: Radix UI components with shadcn/ui styling system
- **State Management**: React Query for server state, Context API for global state
- **Routing**: Wouter for lightweight client-side routing
- **Internationalization**: Custom translation system supporting English and Spanish
- **Theme System**: Dark/light mode with CSS custom properties
- **Showcase Design**: Three-level hierarchical layout with neon brain branding and purple glow effects
- **Navigation System**: Elegant back-to-home buttons with smooth animations on showcase and demo pages

### Security Implementation

Comprehensive security measures including:

- **Helmet.js Integration**: Security headers and CSP policies
- **HTTPS Enforcement**: Strict transport security with domain redirection
- **Input Validation**: Zod schemas for type-safe input validation
- **Session Security**: Secure cookie configuration with proper domain handling
- **Permission Policies**: Feature and permissions policy headers

### SMS Compliance Implementation

Complete Twilio Toll-Free SMS compliance system including:

- **SMS Consent Checkbox**: Required opt-in checkbox in contact form with Twilio-compliant messaging
- **Database Storage**: `sms_consent` boolean field in contact_submissions table
- **Bilingual Support**: Full English/Spanish SMS consent text and confirmations
- **Privacy Policy Integration**: New section "3A. SMS Communications & Consent" added
- **SMS Opt-In Policy Page**: Dedicated page at `/opt-in-policy` with comprehensive consent information
- **Confirmation Messages**: Dynamic SMS opt-in confirmation in form success messages

## External Dependencies

### Payment Processing

- **Stripe Integration**: Complete payment processing with webhooks, payment links, and subscription support
- **PayPal Integration**: Alternative payment method with order creation and capture functionality
- **Payment Link Generation**: Automated invoice-to-payment-link creation

### Email Services

- **Gmail API Integration**: Automated email notifications and invoice delivery using OAuth2
- **SendGrid Integration**: Alternative email service provider with OTP authentication support
- **Email Templates**: Modern Apollo-inspired HTML email templates with TOBAIS purple gradients, professional card layouts, and responsive design for contact auto-replies, invoices, and notifications

### AI and Content Generation

- **OpenAI GPT-4o Integration**: AI-powered social media content generation and recommendations
- **Multi-platform Content**: Automated content creation for various social media platforms
- **Content Recommendations**: AI-driven suggestions for marketing content
- **n8n Webhook Integration**: AI brief generation system with HMAC-SHA256 signature verification for secure communication
- **Automated Brief Generation**: End-to-end AI-powered marketing brief creation from client input data
- **Enhanced Prospect Qualification**: AI Brief form includes strategic assessment questions to capture website status, social media presence, and desired service levels
- **Intelligent Lead Scoring**: Automatic detection of high-value opportunities (AI-powered sites, complete platforms, viral growth strategies)

### Development and Deployment

- **Replit Environment**: Development platform with custom plugins and configurations
- **Neon Database**: Serverless PostgreSQL hosting with connection pooling
- **Google Analytics**: Traffic tracking and user behavior analysis
- **Font Integration**: Google Fonts for typography (Inter, Poppins)

### File and Document Management

- **PDF Generation**: Invoice PDF creation using PDFKit
- **File Storage**: Attachment handling and document management
- **Google Workspace Integration**: Document storage and sharing capabilities

### Security and Monitoring

- **MTA-STS Configuration**: Email security policy implementation
- **CSP Policies**: Content Security Policy for XSS prevention
- **Error Tracking**: Runtime error monitoring and reporting
- **Database Cleanup**: Automated cleanup scripts for data maintenance
- **Webhook Security**: HMAC-SHA256 signature verification for n8n webhook endpoints with rate limiting and IP validation