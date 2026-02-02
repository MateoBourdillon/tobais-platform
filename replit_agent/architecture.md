# TOBAIS - Architecture Documentation

## Overview

TOBAIS is a web application that provides digital agency services including web design, branding, and automation services for small businesses. The application has both client-facing and administrative components, supporting features such as user authentication, project management, invoice generation, payment processing, and email notifications.

The system follows a modern web application architecture with a clear separation between frontend and backend components. It uses a RESTful API approach for communication between client and server, with a relational database for persistent storage.

## System Architecture

### High-Level Architecture

TOBAIS follows a client-server architecture with the following components:

1. **Frontend**: React-based single-page application
2. **Backend**: Node.js with Express.js framework
3. **Database**: PostgreSQL with Drizzle ORM
4. **Email Service**: Gmail API integration for sending notifications
5. **Payment Processing**: Stripe and PayPal integration

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│             │     │             │     │             │
│  React SPA  │────▶│  Express.js │────▶│ PostgreSQL  │
│  (Client)   │     │  (Server)   │     │  Database   │
│             │     │             │     │             │
└─────────────┘     └─────────────┘     └─────────────┘
                          │
                          │
                    ┌─────┴─────┐
                    │           │
           ┌────────┤  External │─────────┐
           │        │  Services │         │
           │        │           │         │
           ▼        └───────────┘         ▼
    ┌────────────┐                 ┌────────────┐
    │  Payment   │                 │   Email    │
    │  Services  │                 │  Services  │
    │(Stripe/PP) │                 │(Gmail API) │
    └────────────┘                 └────────────┘
```

## Key Components

### Frontend

The frontend is a React-based single-page application using the following key technologies:

- **Build Tool**: Vite
- **CSS Framework**: Tailwind CSS
- **UI Components**: Radix UI with Shadcn theme
- **Form Handling**: React Hook Form with Zod validation
- **State Management**: React Hooks and Context API
- **Client-side Routing**: React Router

The frontend is structured to provide user-facing services and an admin dashboard for managing clients, projects, and invoices.

### Backend

The backend is built with Node.js and Express.js, following a modular architecture:

- **API Server**: Express.js for handling HTTP requests
- **Authentication**: Passport.js with local strategy for session-based authentication
- **Database ORM**: Drizzle for type-safe database operations
- **API Routes**: RESTful endpoints organized by resource type
- **Payment Integration**: Stripe and PayPal for payment processing
- **Email Service**: Gmail API for sending transactional emails
- **OpenAI Integration**: For generating social media content

### Database Schema

The database uses PostgreSQL with the following key tables:

1. **users**: Stores user information with authentication data
2. **projects**: Manages client projects with details and status
3. **invoices**: Tracks billing and payment information
4. **contactSubmissions**: Stores inquiries from potential clients
5. **blogPosts**: Content management for the blog section
6. **socialMediaContent**: Generated content for social media platforms
7. **serviceTypes**: Different service offerings and their details
8. **orders**: Customer orders and associated metadata
9. **paymentRecords**: Tracks payment history and status

Schema relationships:
- Users have many projects and invoices
- Projects have many milestones, updates, and comments
- Orders have many order items
- Invoices reference users and optionally projects

### Authentication System

The application uses session-based authentication with Passport.js:

- **Session Management**: Express-session with memory store
- **Password Security**: Scrypt for password hashing with salt
- **Authorization Levels**: Role-based access control with user, admin, and superadmin roles
- **Admin Capabilities**: Granular admin permissions with different levels (0-5)

## Data Flow

### Authentication Flow

1. User submits credentials (username/password)
2. Server validates credentials against database records
3. If valid, a session is created and session ID stored in a cookie
4. Subsequent requests include the session cookie for authentication
5. Protected routes check for valid session before processing requests

### Payment Processing Flow

1. Client initiates a payment for an invoice
2. Server creates a payment intent/order with Stripe or PayPal
3. Client completes payment using the payment provider's UI
4. Provider sends webhook or client sends capture request to confirm payment
5. Server updates invoice status and sends confirmation email

### Email Notification Flow

1. Trigger event occurs (new contact, invoice generation, payment)
2. Server prepares email content
3. Gmail API is called to send the email
4. Email delivery status is logged

## External Dependencies

The application integrates with several external services:

### Payment Processors
- **Stripe**: Primary payment processor with API integration
- **PayPal**: Alternative payment option with checkout SDK

### Communication
- **Gmail API**: For sending transactional emails

### Content Generation
- **OpenAI API**: For generating social media content and recommendations

## Deployment Strategy

The application is deployed using Replit, which provides both development and production environments:

1. **Development**: Local environment with hot module replacement using Vite
2. **Production**: Built application served by the Express backend
3. **Database**: PostgreSQL instance managed by Replit
4. **Environment Variables**: Managed through Replit Secrets and .env files

The deployment workflow involves:
1. Building the frontend with Vite
2. Bundling the server with esbuild
3. Serving the static frontend files from the Express backend
4. Running database migrations with Drizzle

## Security Considerations

The application implements several security measures:

1. **HTTPS Enforcement**: Redirects HTTP to HTTPS in production
2. **Content Security Policy**: Restricts resource loading to trusted sources
3. **Session Security**: Secure cookies with HttpOnly flag
4. **Password Handling**: Secure password hashing with scrypt and salt
5. **Input Validation**: Zod schemas for validating user inputs
6. **API Key Protection**: Environment variables for sensitive credentials
7. **Permissions**: Role-based access control for protected operations

## Maintenance and Monitoring

The application includes:

1. **Admin Dashboard**: For managing users, projects, and monitoring system status
2. **Database Cleanup**: Scripts for maintaining database health
3. **Service Status Checking**: Endpoints to verify external service connections
4. **Logging**: Structured logs for debugging and monitoring