import express, { type Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import fs from "fs";
// Importaremos las funciones necesarias dinámicamente
import { generateInvoicePDF } from './invoice-pdf.js';
import { storage } from "./storage";
import { setupAuth, hashPassword } from "./auth";
import { requireEmailVerification, requireAuth, requireAdmin, requireStaff } from "./auth-middleware";
import { sendContactNotification, sendContactAutoReply, getEmailServiceStatus, sendAIBriefEmail, sendAIBriefNotification } from "./email";
import { 
  initializeSendGrid, 
  generateOTP, 
  hashOTP, 
  verifyOTP, 
  getOTPExpiry,
  sendForgotPasswordOTP,
  sendEmailVerificationOTP,
  authEmailConfig
} from "./auth-email";
import { 
  checkRateLimit, 
  resetRateLimit, 
  incrementOTPAttempts, 
  resetOTPAttempts,
  createRateLimitMiddleware 
} from "./auth-rate-limiter";
import { insertContactSchema, insertProjectSchema, insertTestimonialSchema, insertSocialMediaSchema, insertBlogPostSchema } from "@shared/schema";
import { generateSocialMediaContent, generateMultiPlatformContent, generateContentRecommendations } from "./openai";
import Stripe from "stripe";
import { createPayPalOrder, capturePayPalOrder, isPayPalInitialized } from "./paypal";
import { registerGmailDebugRoute } from "./debug-gmail";
import { createHmac } from "crypto";
import fetch from "node-fetch";

// Importar rutas de administración y función de seguridad
import adminRoutes from './admin/routes';
import { logUnauthorizedAccess } from './db-cleanup.mjs';
import { registerRetellConfigRoute } from './routes/retell-config';

if (!process.env.STRIPE_SECRET_KEY) {
  console.warn('Warning: Missing STRIPE_SECRET_KEY. Stripe payments will not work properly.');
}

if (!process.env.PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
  console.warn('Warning: Missing PayPal credentials. PayPal payments will not work properly.');
}

const stripe = process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize SendGrid for auth emails
  const sendGridInitialized = initializeSendGrid();
  if (sendGridInitialized) {
    console.log('📧 SendGrid auth email service ready');
  } else {
    console.warn('⚠️  SendGrid not initialized - auth emails will fail');
  }

  // MTA-STS file route - serve directly from filesystem
  app.get('/.well-known/mta-sts.txt', (req, res) => {
    const mtaStsPath = path.join(process.cwd(), 'client', 'public', '.well-known', 'mta-sts.txt');
    
    try {
      res.setHeader('Content-Type', 'text/plain');
      res.sendFile(mtaStsPath);
    } catch (error) {
      console.error(`Error serving MTA-STS file: ${error}`);
      res.status(404).send('MTA-STS file not found');
    }
  });
  
  // Admin route to reset services (temporary)
  app.post("/api/admin/reset-services", requireAdmin, async (req, res) => {
    try {
      // Get all services
      const existingServices = await storage.getServiceTypes();
      
      // Delete all services
      for (const service of existingServices) {
        await storage.deleteServiceType(service.id);
      }
      
      // Re-initialize services with the updated prices
      await (storage as any).initializeServices();
      
      // Get the updated services
      const updatedServices = await storage.getServiceTypes();
      
      res.status(200).json({ 
        message: "Services reset successfully", 
        services: updatedServices 
      });
    } catch (error) {
      console.error("Error resetting services:", error);
      res.status(500).json({ message: "Error resetting services" });
    }
  });

  // Set up authentication routes
  setupAuth(app);

  // Verificación de email y username para evitar duplicados
  app.get("/api/check-email", createRateLimitMiddleware('REGISTER'), async (req, res) => {
    try {
      const { email } = req.query;
      if (!email || typeof email !== "string") {
        return res.status(400).json({ message: "Email requerido" });
      }
      
      // Import sanitizeEmail from auth module
      const { sanitizeEmail } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      const user = await storage.getUserByEmail(sanitizedEmail);
      return res.json({ available: !user });
    } catch (error) {
      console.error("Error al verificar email:", error);
      return res.status(500).json({ message: "Error al verificar email" });
    }
  });

  app.get("/api/check-username", async (req, res) => {
    try {
      const { username } = req.query;
      if (!username || typeof username !== "string") {
        return res.status(400).json({ message: "Nombre de usuario requerido" });
      }
      
      const user = await storage.getUserByUsername(username);
      return res.json({ exists: !!user });
    } catch (error) {
      console.error("Error al verificar nombre de usuario:", error);
      return res.status(500).json({ message: "Error al verificar nombre de usuario" });
    }
  });

  // POST /api/register - User registration with duplicate handling
  app.post("/api/register", async (req, res) => {
    try {
      const { username, email, password, firstName, lastName } = req.body;
      
      // Validate required fields
      if (!username || !email || !password || !firstName || !lastName) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      // Validate password length
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }
      
      // Import sanitizeEmail from auth module and normalize email
      const { sanitizeEmail, hashPassword } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      // Check for existing users
      const [existingUserByEmail, existingUserByUsername] = await Promise.all([
        storage.getUserByEmail(sanitizedEmail),
        storage.getUserByUsername(username)
      ]);
      
      // Return 409 for duplicate email (prevent user enumeration with generic message)
      if (existingUserByEmail) {
        return res.status(409).json({ 
          message: "Registration unsuccessful. Please try again." 
        });
      }
      
      // Return 409 for duplicate username
      if (existingUserByUsername) {
        return res.status(409).json({ 
          message: "Registration unsuccessful. Please try again." 
        });
      }
      
      // Hash password and create user
      const hashedPassword = await hashPassword(password);
      
      const newUser = await storage.createUser({
        username,
        email: sanitizedEmail,
        password: hashedPassword,
        firstName,
        lastName
      });
      
      // Return success without sensitive information
      return res.status(201).json({
        success: true,
        message: "Registration successful",
        user: {
          id: newUser.id,
          username: newUser.username,
          email: newUser.email,
          firstName: newUser.firstName,
          lastName: newUser.lastName
        }
      });
    } catch (error) {
      console.error('Registration error:', error);
      return res.status(500).json({ message: "Internal server error" });
    }
  });

  // Registrar rutas de administración con el prefijo /api/admin
  // Todas las rutas en admin-routes.js ya tienen verificación de permisos de administrador
  
  app.use('/api/admin', requireAdmin, adminRoutes);

  // Contact form submission
  app.post("/api/contact", async (req, res, next) => {
    try {
      console.log("Received contact form data:", req.body);
      
      // Process the form data
      let processedData = { ...req.body };
      
      // If serviceId is present, ensure it's the correct type
      if (processedData.serviceId && typeof processedData.serviceId === 'string') {
        processedData.serviceId = parseInt(processedData.serviceId);
      }
      
      // Handle "other" case with serviceType
      if (processedData.serviceType === "other") {
        // If using the serviceType field, we should unset serviceId
        processedData.serviceId = undefined;
      }
      
      const validatedData = insertContactSchema.parse(processedData);
      const submission = await storage.createContactSubmission(validatedData);
      
      // Send email notifications
      let emailStatus = {
        notificationSent: false,
        autoReplySent: false,
        errors: []
      };
      
      try {
        // Attempt to send notification to company emails
        emailStatus.notificationSent = await sendContactNotification(submission);
        console.log(`Contact notification ${emailStatus.notificationSent ? 'sent' : 'failed'} for submission ID: ${submission.id}`);
      } catch (err: any) {
        console.error(`Error sending contact notification: ${err.message}`);
        emailStatus.errors = emailStatus.errors || [];
        if (Array.isArray(emailStatus.errors)) {
          emailStatus.errors.push(`Notification error: ${err.message}`);
        }
      }
      
      try {
        // Attempt to send auto-reply to the user
        emailStatus.autoReplySent = await sendContactAutoReply(submission);
        console.log(`Auto-reply ${emailStatus.autoReplySent ? 'sent' : 'failed'} to ${submission.email} for submission ID: ${submission.id}`);
      } catch (err: any) {
        console.error(`Error sending auto-reply: ${err.message}`);
        emailStatus.errors = emailStatus.errors || [];
        if (Array.isArray(emailStatus.errors)) {
          emailStatus.errors.push(`Auto-reply error: ${err.message}`);
        }
      }
      
      // Return submission with email status
      res.status(201).json({
        submission,
        emailStatus
      });
    } catch (error) {
      next(error);
    }
  });

  // Get service types
  app.get("/api/services", async (_req, res, next) => {
    try {
      const services = await storage.getServiceTypes();
      res.json(services);
    } catch (error) {
      next(error);
    }
  });

  // Get approved testimonials
  app.get("/api/testimonials", async (_req, res, next) => {
    try {
      const testimonials = await storage.getTestimonials(true);
      res.json(testimonials);
    } catch (error) {
      next(error);
    }
  });

  // Submit testimonial
  app.post("/api/testimonials", requireEmailVerification, async (req, res, next) => {
    try {
      
      const validatedData = insertTestimonialSchema.parse(req.body);
      const testimonial = await storage.createTestimonial(validatedData);
      res.status(201).json(testimonial);
    } catch (error) {
      next(error);
    }
  });

  // Projects
  app.get("/api/projects", async (req, res, next) => {
    try {
      let featured: boolean | undefined = undefined;
      
      if (req.query.featured === "true") {
        featured = true;
      } else if (req.query.featured === "false") {
        featured = false;
      }
      // Si no se envía el parámetro featured, será undefined y mostrará todos
      
      const projects = await storage.getProjects(featured);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });
  
  // Get project by ID
  app.get("/api/projects/:id", async (req, res, next) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      res.json(project);
    } catch (error) {
      next(error);
    }
  });

  // Client projects (authenticated)
  app.get("/api/user/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const projects = await storage.getClientProjects(req.user.id);
      res.json(projects);
    } catch (error) {
      next(error);
    }
  });

  // Create project (admin only)
  app.post("/api/projects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const validatedData = insertProjectSchema.parse(req.body);
      const project = await storage.createProject(validatedData);
      res.status(201).json(project);
    } catch (error) {
      next(error);
    }
  });

  // Social Media Content Generation
  app.post("/api/social-media/generate", requireEmailVerification, async (req, res, next) => {
    try {
      console.log("Recibiendo solicitud de generación de contenido:", req.body);
      
      const { prompt, platform, language = "en" } = req.body;
      console.log("Datos de generación:", { prompt, platform, language });
      
      if (!prompt || !platform) {
        console.log("Faltan datos requeridos");
        return res.status(400).json({ message: "Prompt and platform are required" });
      }

      // Verificar si tenemos API Key
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY no está configurada");
        return res.status(503).json({ message: "OpenAI API key is not configured" });
      }
      
      console.log("Generando contenido para:", platform);
      const generatedContent = await generateSocialMediaContent(prompt, platform, language);
      console.log("Contenido generado exitosamente:", generatedContent);
      res.json(generatedContent);
    } catch (error: any) {
      console.error("Error al generar contenido:", error);
      next(error);
    }
  });

  // Multi-platform content generation
  app.post("/api/social-media/multi-platform", requireEmailVerification, async (req, res, next) => {
    try {
      console.log("Recibiendo solicitud de generación multi-plataforma:", req.body);
      
      const { prompt, platforms, language = "en" } = req.body;
      console.log("Datos de generación multi-plataforma:", { prompt, platforms, language });
      
      if (!prompt || !platforms || !Array.isArray(platforms) || platforms.length === 0) {
        console.log("Faltan datos requeridos en multi-plataforma");
        return res.status(400).json({ message: "Prompt and platforms array are required" });
      }
      
      // Verificar si tenemos API Key
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY no está configurada para multi-plataforma");
        return res.status(503).json({ message: "OpenAI API key is not configured" });
      }
      
      console.log("Generando contenido para plataformas:", platforms);
      const generatedContent = await generateMultiPlatformContent(prompt, platforms, language);
      console.log("Contenido multi-plataforma generado exitosamente");
      res.json(generatedContent);
    } catch (error: any) {
      console.error("Error al generar contenido multi-plataforma:", error);
      next(error);
    }
  });

  // Save social media content
  app.post("/api/social-media/save", requireEmailVerification, async (req, res, next) => {
    try {
      
      const contentData = {
        ...req.body,
        userId: req.user.id
      };
      
      const validatedData = insertSocialMediaSchema.parse(contentData);
      const savedContent = await storage.createSocialMediaContent(validatedData);
      res.status(201).json(savedContent);
    } catch (error) {
      next(error);
    }
  });

  // Get user's social media content
  app.get("/api/social-media", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const content = await storage.getUserSocialMediaContent(req.user.id);
      res.json(content);
    } catch (error) {
      next(error);
    }
  });
  
  // Get social media content by ID
  app.get("/api/social-media/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        console.log("GET /api/social-media/:id - Authentication required");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const contentId = parseInt(req.params.id);
      
      if (isNaN(contentId)) {
        console.log("GET /api/social-media/:id - Invalid content ID:", req.params.id);
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      console.log(`GET /api/social-media/${contentId} - Buscando contenido para el usuario ${req.user.id}`);
      
      // Verificar si el contenido pertenece al usuario actual
      const content = await storage.getSocialMediaContentById(contentId);
      
      if (!content) {
        console.log(`GET /api/social-media/${contentId} - Content not found`);
        return res.status(404).json({ message: "Content not found" });
      }
      
      console.log(`GET /api/social-media/${contentId} - Content found, userId: ${content.userId}, user.id: ${req.user.id}`);
      
      if (content.userId !== req.user.id) {
        console.log(`GET /api/social-media/${contentId} - Not authorized, content.userId: ${content.userId}, user.id: ${req.user.id}`);
        return res.status(403).json({ message: "Not authorized to access this content" });
      }
      
      // Crear una copia limpia del objeto para normalizar los datos
      let metadata = {};
      
      // Intentar procesar metadata de forma segura
      try {
        if (typeof content.metadata === 'string') {
          // Si es un string, intentar parsearlo como JSON
          try {
            if (content.metadata && content.metadata.trim()) {
              metadata = JSON.parse(content.metadata);
            }
          } catch (parseErr) {
            console.log(`GET /api/social-media/${contentId} - Error al parsear metadata:`, parseErr);
          }
        } else if (content.metadata) {
          // Si ya es un objeto, usarlo directamente
          metadata = content.metadata;
        }
      } catch (err) {
        console.log(`GET /api/social-media/${contentId} - Error general procesando metadata:`, err);
      }
      
      // Crear objeto normalizado para la respuesta
      const cleanContent = {
        id: content.id,
        userId: content.userId,
        platform: content.platform,
        content: content.content,
        createdAt: content.createdAt,
        // Asegurarnos de que metadata sea string
        metadata: JSON.stringify(metadata)
      };
      
      console.log(`GET /api/social-media/${contentId} - Datos normalizados:`, {
        contentId: cleanContent.id,
        contentLength: cleanContent.content.length,
        metadataType: typeof cleanContent.metadata,
        metadataLength: cleanContent.metadata.length
      });
      
      res.json(cleanContent);
    } catch (error) {
      console.error("GET /api/social-media/:id - Error:", error);
      next(error);
    }
  });

  // Update social media content
  app.patch("/api/social-media/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        console.log("PATCH /api/social-media/:id - Authentication required");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const contentId = parseInt(req.params.id);
      
      if (isNaN(contentId)) {
        console.log("PATCH /api/social-media/:id - Invalid content ID:", req.params.id);
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      console.log(`PATCH /api/social-media/${contentId} - Datos recibidos:`, req.body);
      
      // Verificar si el contenido pertenece al usuario actual
      const existingContent = await storage.getSocialMediaContentById(contentId);
      
      if (!existingContent) {
        console.log(`PATCH /api/social-media/${contentId} - Content not found`);
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (existingContent.userId !== req.user.id) {
        console.log(`PATCH /api/social-media/${contentId} - Not authorized, existingContent.userId: ${existingContent.userId}, user.id: ${req.user.id}`);
        return res.status(403).json({ message: "Not authorized to update this content" });
      }
      
      // Crear objeto de actualización
      const updateData = { ...req.body };
      
      // Asegurarnos de que metadata sea un string si viene
      if (updateData.metadata && typeof updateData.metadata !== 'string') {
        updateData.metadata = JSON.stringify(updateData.metadata);
      }
      
      console.log(`PATCH /api/social-media/${contentId} - Datos procesados para actualizar:`, updateData);
      
      // Actualizar el contenido
      const updatedContent = await storage.updateSocialMediaContent(contentId, updateData);
      
      if (updatedContent) {
        console.log(`PATCH /api/social-media/${contentId} - Contenido actualizado exitosamente`);
        
        // Asegurarnos de que metadata sea un string para la respuesta
        if (updatedContent.metadata && typeof updatedContent.metadata === 'object') {
          updatedContent.metadata = JSON.stringify(updatedContent.metadata);
        }
        
        res.status(200).json(updatedContent);
      } else {
        console.log(`PATCH /api/social-media/${contentId} - Failed to update content`);
        res.status(500).json({ message: "Failed to update content" });
      }
    } catch (error) {
      console.error("PATCH /api/social-media/:id - Error:", error);
      next(error);
    }
  });

  // Delete social media content
  app.delete("/api/social-media/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const contentId = parseInt(req.params.id);
      
      if (isNaN(contentId)) {
        return res.status(400).json({ message: "Invalid content ID" });
      }
      
      // Verificar si el contenido pertenece al usuario actual
      const content = await storage.getSocialMediaContentById(contentId);
      
      if (!content) {
        return res.status(404).json({ message: "Content not found" });
      }
      
      if (content.userId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized to delete this content" });
      }
      
      // Borrar el contenido
      const deleted = await storage.deleteSocialMediaContent(contentId);
      
      if (deleted) {
        res.status(200).json({ message: "Content deleted successfully" });
      } else {
        res.status(500).json({ message: "Failed to delete content" });
      }
    } catch (error) {
      next(error);
    }
  });

  // Content recommendations
  app.post("/api/content-recommendations", async (req, res, next) => {
    try {
      console.log("Recibiendo solicitud de recomendaciones de contenido:", req.body);
      
      if (!req.isAuthenticated() || !req.user) {
        console.log("Usuario no autenticado en recomendaciones");
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { audience, industry, language = "en" } = req.body;
      console.log("Datos de recomendaciones:", { audience, industry, language });
      
      if (!audience || !industry) {
        console.log("Faltan datos requeridos en recomendaciones");
        return res.status(400).json({ message: "Audience and industry are required" });
      }
      
      // Verificar si tenemos API Key
      if (!process.env.OPENAI_API_KEY) {
        console.error("OPENAI_API_KEY no está configurada para recomendaciones");
        return res.status(503).json({ message: "OpenAI API key is not configured" });
      }
      
      console.log("Generando recomendaciones para:", industry);
      const recommendations = await generateContentRecommendations(audience, industry, language);
      console.log("Recomendaciones generadas exitosamente");
      res.json(recommendations);
    } catch (error: any) {
      console.error("Error al generar recomendaciones:", error);
      next(error);
    }
  });

  // In-memory rate limiting for /api/ai-brief
  const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
  const RATE_LIMIT_WINDOW = 10 * 60 * 1000; // 10 minutes
  const RATE_LIMIT_MAX_REQUESTS = 30;

  function checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = rateLimitMap.get(ip);
    
    if (!record || now > record.resetTime) {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
      return true;
    }
    
    if (record.count >= RATE_LIMIT_MAX_REQUESTS) {
      return false;
    }
    
    record.count++;
    return true;
  }

  // AI Brief webhook endpoint
  app.post("/api/ai-brief", async (req, res, next) => {
    try {
      // Extract IP address
      const forwarded = req.headers['x-forwarded-for'];
      const ip = (Array.isArray(forwarded) ? forwarded[0] : forwarded?.split(',')[0]) || req.socket.remoteAddress || 'unknown';
      
      // Rate limiting check
      if (!checkRateLimit(ip)) {
        return res.status(429).json({ error: "Too many requests" });
      }

      // Check environment configuration
      if (!process.env.N8N_WEBHOOK_URL || !process.env.WEBHOOK_SECRET) {
        return res.status(500).json({ error: "Server not configured" });
      }

      // Extract and validate request body
      const { name, email, company, industry, goal, style, budget, notes } = req.body;
      
      // Validate required fields
      if (!email || !goal || email.trim() === '' || goal.trim() === '') {
        return res.status(400).json({ error: "Missing required fields: email, goal" });
      }

      // No longer using webhook payload, going direct to OpenAI

      console.log(`✅ AI Brief para ${name} de ${company} - ${industry}`);
      
      // Use OpenAI directly (bypassing n8n issues)
      const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
        },
        body: JSON.stringify({
          model: "gpt-4o",
          messages: [{
            role: "system",
            content: "You are an expert marketing strategist. Create professional marketing briefs based on client requirements. Always respond in valid JSON format."
          }, {
            role: "user",
            content: `Create a professional marketing brief for ${name} from ${company}.

Client Details:
- Name: ${name}
- Company: ${company}
- Email: ${email}

Project Requirements:
- Industry: ${industry}
- Goal: ${goal}
- Style: ${style}
- Budget: $${budget}
- Notes: ${notes}

Generate a detailed marketing brief that specifically addresses their ${industry} business and their goal: "${goal}". Make sure to mention their company "${company}" and industry "${industry}" in the response.

Respond with valid JSON containing:
{
  "title": "A compelling title for their ${industry} marketing strategy",
  "summary": "A detailed summary specifically for ${company} in the ${industry} industry addressing their goal",
  "bullets": ["Strategic point 1", "Strategic point 2", "Strategic point 3"]
}`
          }],
          response_format: { type: "json_object" },
          temperature: 0.7
        })
      });

      if (!openaiResponse.ok) {
        throw new Error(`OpenAI API error: ${openaiResponse.status}`);
      }

      const openaiData: any = await openaiResponse.json();
      const aiResponse = JSON.parse(openaiData.choices[0].message.content);
      
      console.log(`✅ AI Brief generado: "${aiResponse.title}"`);
      
      // Send email to client
      const clientData = {
        name,
        email,
        company: company || '',
        industry: industry || '',
        goal: goal || '',
        style: style || '',
        budget: budget || 0,
        notes: notes || ''
      };
      
      const emailSent = await sendAIBriefEmail(clientData, aiResponse);

      if (emailSent) {
        console.log(`📧 Email enviado exitosamente a ${email}`);
      } else {
        console.log(`❌ Error enviando email a ${email}`);
      }

      // Prepare assessment insights for sales team
      const { hasWebsite, websiteQuality, hasSocialMedia, socialMediaQuality } = req.body;
      const insights = [];
      const opportunities = [];
      
      if (hasWebsite === 'no') {
        insights.push('NO WEBSITE');
        if (websiteQuality === 'ai_powered') opportunities.push('WANTS AI-POWERED SITE');
        if (websiteQuality === 'full_platform') opportunities.push('WANTS COMPLETE PLATFORM');
        if (websiteQuality === 'modern_minimal') opportunities.push('WANTS MODERN DESIGN');
      }
      if (websiteQuality === 'poor' || websiteQuality === 'outdated') insights.push('WEBSITE NEEDS WORK');
      if (hasSocialMedia === 'no') {
        insights.push('NO SOCIAL MEDIA');
        if (socialMediaQuality === 'ai_automated') opportunities.push('WANTS AI SOCIAL STRATEGY');
        if (socialMediaQuality === 'viral_growth') opportunities.push('WANTS VIRAL GROWTH');
        if (socialMediaQuality === 'engagement_focused') opportunities.push('WANTS ENGAGEMENT FOCUS');
      }
      if (hasSocialMedia === 'limited') insights.push('WEAK SOCIAL MEDIA');
      if (socialMediaQuality === 'poor' || socialMediaQuality === 'basic') insights.push('POOR SOCIAL STRATEGY');

      // ALWAYS send notification to sales@tobais.com with lead details
      try {
        const notificationSent = await sendAIBriefNotification(clientData, aiResponse, insights, opportunities);
        if (notificationSent) {
          console.log(`📧 Notificación enviada a sales@tobais.com para ${name}`);
        } else {
          console.log(`❌ Error enviando notificación a sales@tobais.com`);
        }
      } catch (error) {
        console.error(`Error enviando notificación a sales:`, error);
      }

      // Save prospect data to database with assessment data
      try {
        const prospectData = {
          name,
          email: email,
          company: company || null,
          industry: industry || null,
          goal: goal || null,
          style: style || null,
          budget: budget ? parseFloat(budget.toString()) : null,
          notes: notes || null,
          hasWebsite: hasWebsite || null,
          websiteQuality: websiteQuality || null,
          hasSocialMedia: hasSocialMedia || null,
          socialMediaQuality: socialMediaQuality || null,
          aiResponse: aiResponse,
          emailSent: emailSent,
          followupStatus: 'new',
          source: 'ai_brief'
        };

        const savedProspect = await storage.createProspect(prospectData);
        
        console.log(`🎯 Prospecto guardado: ID ${savedProspect.id} - ${name} (${email})`);
        if (insights.length > 0) {
          console.log(`🔍 Oportunidades detectadas: ${insights.join(', ')}`);
        }
        if (opportunities.length > 0) {
          console.log(`💎 Alto valor detectado: ${opportunities.join(', ')}`);
        }
      } catch (error) {
        console.log(`⚠️ Error guardando prospecto: ${error}`);
      }

      res.status(200).json(aiResponse);
    } catch (error: any) {
      console.error("Error in /api/ai-brief:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // Admin: Get all contact submissions
  app.get("/api/admin/contacts", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const submissions = await storage.getContactSubmissions();
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all prospects (AI Brief leads)
  app.get("/api/admin/prospects", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const { status } = req.query;
      const prospects = await storage.getProspects(status as string);
      res.json(prospects);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update prospect status
  app.patch("/api/admin/prospects/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updated = await storage.updateProspect(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Prospect not found" });
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Update contact submission
  app.patch("/api/admin/contacts/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updated = await storage.updateContactSubmission(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Contact submission not found" });
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Manage testimonials
  app.patch("/api/admin/testimonials/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updated = await storage.updateTestimonial(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Testimonial not found" });
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Admin: Get all testimonials including unapproved
  app.get("/api/admin/testimonials", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const testimonials = await storage.getTestimonials();
      res.json(testimonials);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin: Get all clients (users with role 'user')
  app.get("/api/admin/clients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const allUsers = await storage.getUsers();
      // Filtrar solo clientes (role 'user')
      const clients = allUsers.filter(user => user.role === "user");
      
      // Filtrar datos sensibles como contraseñas
      const safeClients = clients.map(client => ({
        id: client.id,
        username: client.username,
        email: client.email,
        firstName: client.firstName,
        lastName: client.lastName,
        phone: client.phone,
        role: client.role,
        isActive: client.isActive,
        createdAt: client.createdAt
      }));
      
      res.json(safeClients);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin: Get all users (for admin management)
  app.get("/api/admin/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const allUsers = await storage.getUsers();
      
      // Filtrar datos sensibles como contraseñas
      const safeUsers = allUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone,
        role: user.role,
        adminLevel: user.adminLevel,
        isActive: user.isActive,
        createdAt: user.createdAt
      }));
      
      res.json(safeUsers);
    } catch (error) {
      next(error);
    }
  });

  // Blog posts endpoints
  
  // Get published blog posts
  app.get("/api/blog", async (req, res, next) => {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string) : undefined;
      const posts = await storage.getBlogPosts(limit, true); // Only published posts
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });
  
  // Get a single blog post by slug
  app.get("/api/blog/:slug", async (req, res, next) => {
    try {
      const post = await storage.getBlogPostBySlug(req.params.slug);
      if (!post) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      // Only return published posts to public users
      if (!post.published && (!req.isAuthenticated() || req.user?.role !== "admin")) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(post);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin: Create a new blog post
  app.post("/api/admin/blog", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const postData = {
        ...req.body,
        authorId: req.user.id
      };
      
      const validatedData = insertBlogPostSchema.parse(postData);
      const post = await storage.createBlogPost(validatedData);
      res.status(201).json(post);
    } catch (error) {
      next(error);
    }
  });
  
  // Staff management endpoint
  app.get("/api/admin/staff", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || !['admin', 'superadmin'].includes(req.user.role) || req.user.adminLevel < 5) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      // Get all users and filter for staff members (adminLevel >= 1)
      const allUsers = await storage.getUsers();
      
      // Filter for staff members only
      const filteredStaff = allUsers.filter(user => (user.adminLevel || 0) >= 1);
      
      res.json(filteredStaff);
    } catch (error) {
      console.error("Error getting staff members:", error);
      res.status(500).json({ message: "Failed to fetch staff members" });
    }
  });

  // Create new staff member
  app.post("/api/admin/staff", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || !['admin', 'superadmin'].includes(req.user.role) || req.user.adminLevel < 5) {
        return res.status(403).json({ message: "Admin privileges required" });
      }

      const { username, email, firstName, lastName, phone, role, adminLevel, temporaryPassword } = req.body;

      // Validate required fields
      if (!username || !email || !firstName || !lastName || !temporaryPassword) {
        return res.status(400).json({ message: "All required fields must be provided" });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByUsername(username);
      if (existingUser) {
        return res.status(409).json({ message: "Username already exists" });
      }

      const existingEmail = await storage.getUserByEmail(email);
      if (existingEmail) {
        return res.status(409).json({ message: "Email already exists" });
      }

      // Hash the temporary password before storing
      const hashedPassword = await hashPassword(temporaryPassword);

      // Create new staff member
      const newStaff = await storage.createUser({
        username,
        email,
        firstName,
        lastName,
        phone: phone || undefined,
        role: role || 'user',
        adminLevel: adminLevel || 1,
        password: hashedPassword,
        isActive: true,
        emailVerified: true // Staff members are pre-verified
      });

      // Remove password from response
      const { password, ...staffResponse } = newStaff;
      
      res.status(201).json(staffResponse);
    } catch (error) {
      console.error("Error creating staff member:", error);
      res.status(500).json({ message: "Failed to create staff member" });
    }
  });

  // Admin: Get all blog posts including drafts
  app.get("/api/admin/blog", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const posts = await storage.getBlogPosts();
      res.json(posts);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin: Update a blog post
  app.patch("/api/admin/blog/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const updated = await storage.updateBlogPost(id, req.body);
      if (!updated) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });
  
  // Admin: Delete a blog post
  app.delete("/api/admin/blog/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid ID" });
      }
      
      const success = await storage.deleteBlogPost(id);
      if (!success) {
        return res.status(404).json({ message: "Blog post not found" });
      }
      
      res.status(204).end();
    } catch (error) {
      next(error);
    }
  });
  
  // Invoice routes
  // Get all invoices (admin only)
  app.get("/api/admin/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const userId = req.query.userId ? parseInt(req.query.userId as string) : undefined;
      const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : undefined;
      const status = req.query.status as string;
      
      const invoices = await storage.getInvoices(userId, projectId, status);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user invoices
  app.get("/api/user/invoices", requireEmailVerification, async (req, res, next) => {
    try {
      
      const invoices = await storage.getInvoices(req.user.id);
      res.json(invoices);
    } catch (error) {
      next(error);
    }
  });
  
  // Get user invoices (alternative route)
  // Using consolidated invoice routes from below
  
  // Get single invoice
  app.get("/api/invoices/:id", requireEmailVerification, async (req, res, next) => {
    try {
      
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verificar permiso: solo el dueño o un admin puede ver la factura
      if (invoice.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to access this invoice" });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  });
  
  // Create invoice (admin only)
  app.post("/api/invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      // Generar número de factura único (ejemplo: INV-2025-0001)
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const existingInvoices = await storage.getInvoices();
      const invoiceNumber = `INV-${year}-${month}-${String(existingInvoices.length + 1).padStart(4, '0')}`;
      
      const invoiceData = {
        ...req.body,
        number: invoiceNumber,
        status: req.body.status || "pending"
      };
      
      const invoice = await storage.createInvoice(invoiceData);
      res.status(201).json(invoice);
    } catch (error) {
      next(error);
    }
  });
  
  // Endpoint específico para crear facturas para Maryuri Alba y el proyecto Matoro Bridge Platform
  app.post("/api/admin/create-matoro-invoices", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      console.log("Iniciando creación de facturas para Maryuri Alba...");
      
      // 1. Buscar cliente Maryuri Alba
      const users = await storage.getUsers();
      const maryuri = users.find(user => 
        (user.email && user.email.toLowerCase().includes('maryuri')) || 
        (user.firstName && user.firstName.toLowerCase().includes('maryuri'))
      );
      
      if (!maryuri) {
        return res.status(404).json({ 
          message: "No se encontró la cliente Maryuri Alba en el sistema",
          users: users.map(u => ({ id: u.id, username: u.username, email: u.email }))
        });
      }
      
      console.log("Cliente Maryuri Alba encontrado:", maryuri.id);
      
      // 2. Buscar o crear el proyecto Matoro Bridge
      const projects = await storage.getProjects();
      let matoroProject = projects.find(project => 
        project.name && project.name.includes('Matoro Bridge')
      );
      
      if (!matoroProject) {
        // Crear el proyecto si no existe
        matoroProject = await storage.createProject({
          title: "Matoro Bridge Platform by Matoro Consulting LLC", // Título requerido
          name: "Matoro Bridge Platform by Matoro Consulting LLC",  // Campo usado en búsqueda
          description: "Desarrollo de plataforma web para Matoro Bridge con funcionalidad completa de gestión de usuarios, pagos y reportes",
          status: "active",
          startDate: new Date(),
          endDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 días después
          budget: 2500.00,
          clientId: maryuri.id
        });
        console.log("Proyecto creado:", matoroProject.id, matoroProject.name);
      } else if (matoroProject.name !== "Matoro Bridge Platform by Matoro Consulting LLC") {
        // Actualizar el nombre del proyecto para que sea exactamente como se requiere
        matoroProject = await storage.updateProject(matoroProject.id, {
          title: "Matoro Bridge Platform by Matoro Consulting LLC",
          name: "Matoro Bridge Platform by Matoro Consulting LLC"
        });
        console.log("Nombre del proyecto actualizado:", matoroProject.name);
      }
      
      console.log("Proyecto configurado:", matoroProject.id, matoroProject.name);
      
      // 3. Generar números de factura únicos
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const invoices = await storage.getInvoices();
      
      // 4. Crear la primera factura (pago inicial - 50%)
      const invoiceNumber1 = `INV-${year}-${month}-${String(invoices.length + 1).padStart(4, '0')}`;
      
      const invoice1 = await storage.createInvoice({
        number: invoiceNumber1,
        userId: maryuri.id,
        projectId: matoroProject.id,
        description: "Pago inicial - Matoro Bridge Platform by Matoro Consulting LLC",
        total: 1250.00,
        status: "pending",
        dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        issueDate: new Date(),
        notes: "Pago inicial correspondiente al 50% del presupuesto total del proyecto",
        metadata: JSON.stringify({
          type: "initial_payment",
          percentage: 50,
          projectPhase: "Development Start"
        }),
        items: JSON.stringify([
          { 
            description: "Análisis inicial y diseño - Matoro Bridge Platform", 
            amount: 500.00 
          },
          { 
            description: "Desarrollo front-end inicial - Matoro Bridge Platform", 
            amount: 400.00 
          },
          { 
            description: "Configuración de base de datos - Matoro Bridge Platform", 
            amount: 350.00 
          }
        ])
      });
      
      console.log("Primera factura creada:", invoice1.id, invoice1.number);
      
      // 5. Crear la segunda factura (pago final - 50%)
      const invoiceNumber2 = `INV-${year}-${month}-${String(invoices.length + 2).padStart(4, '0')}`;
      
      const invoice2 = await storage.createInvoice({
        number: invoiceNumber2,
        userId: maryuri.id,
        projectId: matoroProject.id,
        description: "Pago final - Matoro Bridge Platform by Matoro Consulting LLC",
        total: 1250.00,
        status: "pending",
        dueDate: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
        issueDate: new Date(),
        notes: "Pago final correspondiente al 50% restante del presupuesto total del proyecto a entregar al completar el desarrollo",
        metadata: JSON.stringify({
          type: "final_payment",
          percentage: 50,
          projectPhase: "Project Completion"
        }),
        items: JSON.stringify([
          { 
            description: "Desarrollo de APIs y backend - Matoro Bridge Platform", 
            amount: 500.00 
          },
          { 
            description: "Finalización de interfaces de usuario - Matoro Bridge Platform", 
            amount: 450.00 
          },
          { 
            description: "Pruebas y despliegue final - Matoro Bridge Platform", 
            amount: 300.00 
          }
        ])
      });
      
      console.log("Segunda factura creada:", invoice2.id, invoice2.number);
      
      // 6. Responder con la información de las facturas creadas
      res.status(201).json({
        success: true,
        message: "Facturas para Maryuri Alba creadas exitosamente",
        client: {
          id: maryuri.id,
          name: `${maryuri.firstName || ''} ${maryuri.lastName || ''}`.trim(),
          email: maryuri.email
        },
        project: {
          id: matoroProject.id,
          name: matoroProject.name,
          budget: matoroProject.budget
        },
        invoices: [
          {
            id: invoice1.id,
            number: invoice1.number,
            total: invoice1.total,
            status: invoice1.status,
            dueDate: invoice1.dueDate
          },
          {
            id: invoice2.id,
            number: invoice2.number,
            total: invoice2.total,
            status: invoice2.status,
            dueDate: invoice2.dueDate
          }
        ]
      });
    } catch (error) {
      console.error("Error creando facturas para Maryuri Alba:", error);
      next(error);
    }
  });
  
  // Update invoice (admin only)
  app.patch("/api/invoices/:id", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.updateInvoice(invoiceId, req.body);
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });
  
  // Mark invoice as paid (admin only)
  app.post("/api/invoices/:id/mark-paid", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const { paymentMethod, paymentDate } = req.body;
      if (!paymentMethod) {
        return res.status(400).json({ message: "Payment method is required" });
      }
      
      const updatedInvoice = await storage.markInvoiceAsPaid(
        invoiceId, 
        paymentMethod, 
        paymentDate ? new Date(paymentDate) : undefined
      );
      
      // Crear registro de pago
      await storage.createPaymentRecord({
        invoiceId,
        userId: invoice.userId,
        amount: invoice.total,
        paymentMethod,
        status: "completed",
        paymentDate: paymentDate ? new Date(paymentDate) : new Date(),
        transactionId: req.body.transactionId || null,
        metadata: req.body.metadata || null
      });
      
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });
  
  // Cancel invoice (admin only)
  app.post("/api/invoices/:id/cancel", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const updatedInvoice = await storage.markInvoiceAsCancelled(invoiceId);
      res.json(updatedInvoice);
    } catch (error) {
      next(error);
    }
  });
  


  // Payment Records routes
  // Get payment records for an invoice
  app.get("/api/invoices/:id/payments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verificar permiso: solo el dueño o un admin puede ver los pagos
      if (invoice.userId !== req.user.id && req.user.role !== "admin") {
        return res.status(403).json({ message: "Not authorized to access this invoice's payments" });
      }
      
      const payments = await storage.getPaymentRecords(invoiceId);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });
  
  // Get all user payment records
  app.get("/api/user/payments", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const payments = await storage.getPaymentRecords(undefined, req.user.id);
      res.json(payments);
    } catch (error) {
      next(error);
    }
  });

  // Stripe payment routes
  if (stripe) {
    // Webhook de Stripe para procesar eventos de pago
    // IMPORTANTE: Este endpoint debe usar formato raw para la firma
    app.post('/api/stripe-webhook', express.raw({ type: 'application/json' }), async (req, res) => {
      let event;
      
      try {
        // Verificar la firma del webhook si hay un secreto configurado
        if (process.env.STRIPE_WEBHOOK_SECRET) {
          const signature = req.headers['stripe-signature'];
          event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET
          );
        } else {
          // Si no hay secreto, confiar en el cuerpo de la solicitud (solo para desarrollo)
          event = req.body;
          console.warn('STRIPE_WEBHOOK_SECRET not configured. Using insecure webhook mode.');
        }
        
        console.log(`Processing Stripe webhook event: ${event.type}`);
        
        // Manejar diferentes tipos de eventos
        switch (event.type) {
          case 'payment_intent.succeeded':
            const paymentIntent = event.data.object;
            console.log(`Payment intent succeeded: ${paymentIntent.id}`);
            
            // Verificar si el pago está relacionado con facturas
            if (paymentIntent.metadata && paymentIntent.metadata.invoiceIds) {
              try {
                const invoiceIds = JSON.parse(paymentIntent.metadata.invoiceIds);
                const userId = parseInt(paymentIntent.metadata.userId);
                
                console.log(`Processing payment for invoices: ${invoiceIds.join(', ')} by user ${userId}`);
                
                // Procesar cada factura
                for (const invoiceId of invoiceIds) {
                  const invoice = await storage.getInvoice(parseInt(invoiceId));
                  
                  if (invoice) {
                    // Actualizar la factura con la información de Stripe
                    await storage.updateStripeInvoiceInfo(
                      parseInt(invoiceId),
                      paymentIntent.id,
                      paymentIntent.id
                    );
                    
                    // Marcar la factura como pagada
                    await storage.markInvoiceAsPaid(parseInt(invoiceId), "stripe");
                    
                    // Crear registro de pago
                    await storage.createPaymentRecord({
                      invoiceId: parseInt(invoiceId),
                      userId: userId,
                      amount: invoice.total,
                      paymentMethod: "stripe",
                      status: "completed",
                      paymentDate: new Date(),
                      transactionId: paymentIntent.id,
                      metadata: JSON.stringify(paymentIntent)
                    });
                    
                    console.log(`Invoice ${invoiceId} marked as paid`);
                  } else {
                    console.warn(`Invoice ${invoiceId} not found for payment ${paymentIntent.id}`);
                  }
                }
              } catch (error) {
                console.error('Error processing payment webhook:', error);
              }
            }
            break;
            
          case 'payment_intent.payment_failed':
            const failedPayment = event.data.object;
            console.log(`Payment failed: ${failedPayment.id}`);
            break;
            
          default:
            console.log(`Unhandled event type: ${event.type}`);
        }
        
        // Responder para confirmar recepción
        res.json({ received: true });
      } catch (err) {
        console.error(`Webhook error: ${err.message}`);
        res.status(400).send(`Webhook Error: ${err.message}`);
      }
    });
    
    // Test endpoint for $1.00 payment (only for testing)
    app.post("/api/test-payment", async (req, res, next) => {
      try {
        console.log("Creating test payment intent with body:", req.body);
        
        // Authentication is optional for test payments to simplify testing
        const userId = req.isAuthenticated() ? req.user.id : null;
        const testAmount = 1.00; // $1.00 USD for testing
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(testAmount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            test: "true",
            purpose: "API validation",
            userId: userId ? userId.toString() : "unauthenticated",
            isTestPayment: "true"
          }
        });
        
        console.log("Test payment intent created successfully:", {
          id: paymentIntent.id,
          amount: testAmount,
          hasClientSecret: !!paymentIntent.client_secret
        });
        
        res.json({ 
          clientSecret: paymentIntent.client_secret,
          amount: testAmount,
          message: "Test payment intent created successfully" 
        });
      } catch (error: any) {
        console.error("Error creating test payment intent:", error);
        res.status(500).json({ message: "Error creating test payment intent: " + error.message });
      }
    });
    
    // Create payment intent for service purchase
    app.post("/api/create-payment-intent", async (req, res, next) => {
      try {
        if (!req.isAuthenticated()) {
          return res.status(401).json({ message: "Authentication required" });
        }
        
        const { amount, serviceId } = req.body;
        
        if (!amount || amount <= 0) {
          return res.status(400).json({ message: "Valid amount is required" });
        }
        
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            userId: req.user?.id.toString(),
            serviceId: serviceId?.toString() || "",
          }
        });
        
        res.json({ clientSecret: paymentIntent.client_secret });
      } catch (error: any) {
        res.status(500).json({ message: "Error creating payment intent: " + error.message });
      }
    });
    
    // Create payment intent for invoice payments
    app.post("/api/create-invoice-payment-intent", async (req, res, next) => {
      try {
        console.log("Creating invoice payment intent with body:", req.body);
        
        if (!req.isAuthenticated()) {
          console.log("Authentication required for payment intent");
          return res.status(401).json({ message: "Authentication required" });
        }
        
        const { amount, invoiceIds } = req.body;
        console.log("Payment intent parameters:", { amount, invoiceIds });
        
        if (!amount || amount <= 0) {
          console.log("Invalid amount:", amount);
          return res.status(400).json({ message: "Valid amount is required" });
        }
        
        if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
          console.log("Invalid invoice IDs:", invoiceIds);
          return res.status(400).json({ message: "Valid invoice IDs are required" });
        }
        
        if (!stripe) {
          console.log("Stripe is not configured properly");
          return res.status(500).json({ 
            message: "Stripe payment processing is not available",
            error: "STRIPE_NOT_CONFIGURED"
          });
        }
        
        console.log("Creating Stripe payment intent for amount:", Math.round(amount * 100));
        const paymentIntent = await stripe.paymentIntents.create({
          amount: Math.round(amount * 100), // Convert to cents
          currency: "usd",
          metadata: {
            userId: req.user?.id.toString(),
            invoiceIds: JSON.stringify(invoiceIds),
            paymentType: "invoice"
          }
        });
        
        console.log("Payment intent created successfully:", { 
          id: paymentIntent.id,
          hasClientSecret: !!paymentIntent.client_secret,
          secretLength: paymentIntent.client_secret ? paymentIntent.client_secret.length : 0
        });
        
        res.json({ 
          clientSecret: paymentIntent.client_secret,
          paymentIntentId: paymentIntent.id
        });
      } catch (error: any) {
        console.error("Error creating invoice payment intent:", error);
        
        // Detailed error logging to help with debugging
        if (error.type && error.message) {
          console.error(`Stripe error (${error.type}): ${error.message}`);
        }
        
        // Return user-friendly error response
        res.status(500).json({ 
          message: "Error creating payment intent: " + error.message,
          errorType: error.type || "unknown_error",
          code: error.code || "server_error"
        });
      }
    });
  }

  // PayPal payment routes
  
  // Endpoint para verificar si PayPal está configurado correctamente
  app.get("/api/check-paypal-status", async (_req, res) => {
    const isInitialized = isPayPalInitialized();
    // Forzamos siempre el entorno LIVE para credenciales de producción
    const isLiveEnvironment = true; // Siempre LIVE/PRODUCTION
    
    // Determine API endpoint based on environment
    const apiEndpoint = 'https://api-m.paypal.com'; // Siempre API de producción
    
    console.log('Checking PayPal configuration status:');
    console.log('- Initialized:', isInitialized);
    console.log('- Environment: LIVE/PRODUCTION (FORCED)');
    console.log('- API Endpoint:', apiEndpoint);
    console.log('- Client ID Configured:', !!process.env.PAYPAL_CLIENT_ID);
    console.log('- Client Secret Configured:', !!process.env.PAYPAL_CLIENT_SECRET);
    
    res.json({ 
      initialized: isInitialized,
      clientIdConfigured: !!process.env.PAYPAL_CLIENT_ID,
      clientSecretConfigured: !!process.env.PAYPAL_CLIENT_SECRET,
      environment: 'live',
      apiEndpoint: apiEndpoint,
      message: isInitialized 
        ? `PayPal is properly configured and ready to use in LIVE mode` 
        : "PayPal is not initialized or credentials are invalid"
    });
  });
  
  // ========================================
  // AUTH OTP ENDPOINTS (NEW - PHASE 1)
  // ========================================
  
  // POST /api/auth/forgot-password
  app.post("/api/auth/forgot-password", createRateLimitMiddleware('FORGOT_PASSWORD'), async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email || typeof email !== 'string') {
        return res.status(400).json({ message: "Email is required" });
      }

      // Import sanitizeEmail from auth module and normalize email
      const { sanitizeEmail } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      // Always return success to prevent user enumeration
      const user = await storage.getUserByEmail(sanitizedEmail);
      
      if (user) {
        // Generate OTP and hash it
        const otp = generateOTP();
        const hashedOtp = await hashOTP(otp);
        const expiry = getOTPExpiry();
        
        // Store hashed OTP in database
        await storage.setResetPasswordToken(user.id, hashedOtp, expiry);
        
        // Send email
        const emailSent = await sendForgotPasswordOTP({
          email: user.email,
          code: otp,
          expiresIn: authEmailConfig.OTP_TTL_MINUTES.toString(),
          appUrl: authEmailConfig.APP_URL,
          supportEmail: authEmailConfig.supportEmail
        });
        
        if (emailSent) {
          console.log(`Password reset OTP sent to ${email}`);
        } else {
          console.error(`Failed to send password reset OTP to ${email}`);
        }
      }
      
      // Always return success message
      res.json({ 
        message: "If this email exists, you'll receive a password reset code shortly.",
        success: true 
      });
    } catch (error) {
      console.error('Forgot password error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/reset-password
  app.post("/api/auth/reset-password", createRateLimitMiddleware('RESET_PASSWORD'), async (req, res) => {
    try {
      const { email, code, newPassword } = req.body;
      
      if (!email || !code || !newPassword) {
        return res.status(400).json({ message: "Email, code, and new password are required" });
      }

      // Validate new password
      if (newPassword.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Import sanitizeEmail from auth module and normalize email
      const { sanitizeEmail } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      const user = await storage.getUserByEmail(sanitizedEmail);
      if (!user || !user.resetPasswordToken || !user.resetPasswordTokenExpiry) {
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Check if token is expired
      if (new Date() > user.resetPasswordTokenExpiry) {
        await storage.clearResetPasswordToken(user.id);
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Check OTP attempts
      const otpAttempt = incrementOTPAttempts(user.resetPasswordToken);
      if (otpAttempt.exceeded) {
        await storage.clearResetPasswordToken(user.id);
        return res.status(400).json({ message: "Too many attempts. Please request a new code." });
      }

      // Verify OTP
      const isValidOtp = await verifyOTP(code, user.resetPasswordToken);
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Update password and clear reset token
      const hashedPassword = await hashPassword(newPassword);
      await storage.updateUser(user.id, { password: hashedPassword });
      await storage.clearResetPasswordToken(user.id);
      resetOTPAttempts(user.resetPasswordToken);

      console.log(`Password successfully reset for user ${user.email}`);
      res.json({ message: "Password reset successfully", success: true });
    } catch (error) {
      console.error('Reset password error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/verify-email  
  app.post("/api/auth/verify-email", createRateLimitMiddleware('RESEND_OTP'), async (req, res) => {
    try {
      const { email, code } = req.body;
      
      if (!email || !code) {
        return res.status(400).json({ message: "Email and code are required" });
      }

      // Import sanitizeEmail from auth module and normalize email
      const { sanitizeEmail } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      const user = await storage.getUserByEmail(sanitizedEmail);
      if (!user || !user.verificationToken || !user.verificationTokenExpiry) {
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Check if token is expired
      if (new Date() > user.verificationTokenExpiry) {
        await storage.clearVerificationToken(user.id);
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Check OTP attempts
      const otpAttempt = incrementOTPAttempts(user.verificationToken);
      if (otpAttempt.exceeded) {
        await storage.clearVerificationToken(user.id);
        return res.status(400).json({ message: "Too many attempts. Please request a new code." });
      }

      // Verify OTP
      const isValidOtp = await verifyOTP(code, user.verificationToken);
      if (!isValidOtp) {
        return res.status(400).json({ message: "Invalid code or expired" });
      }

      // Mark email as verified
      await storage.markEmailAsVerified(user.id);
      resetOTPAttempts(user.verificationToken);

      console.log(`Email successfully verified for user ${user.email}`);
      res.json({ message: "Email verified successfully", success: true });
    } catch (error) {
      console.error('Verify email error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // POST /api/auth/resend-otp
  app.post("/api/auth/resend-otp", createRateLimitMiddleware('RESEND_OTP'), async (req, res) => {
    try {
      const { email, type } = req.body; // type: 'password-reset' | 'email-verification'
      
      if (!email || !type) {
        return res.status(400).json({ message: "Email and type are required" });
      }

      if (!['password-reset', 'email-verification'].includes(type)) {
        return res.status(400).json({ message: "Invalid OTP type" });
      }

      // Import sanitizeEmail from auth module and normalize email
      const { sanitizeEmail } = await import('./auth');
      const sanitizedEmail = sanitizeEmail(email);
      
      const user = await storage.getUserByEmail(sanitizedEmail);
      if (!user) {
        return res.json({ 
          message: "If this email exists, you'll receive a new code shortly.",
          success: true 
        });
      }

      // Generate new OTP
      const otp = generateOTP();
      const hashedOtp = await hashOTP(otp);
      const expiry = getOTPExpiry();

      let emailSent = false;

      if (type === 'password-reset') {
        await storage.setResetPasswordToken(user.id, hashedOtp, expiry);
        emailSent = await sendForgotPasswordOTP({
          email: user.email,
          code: otp,
          expiresIn: authEmailConfig.OTP_TTL_MINUTES.toString(),
          appUrl: authEmailConfig.APP_URL,
          supportEmail: authEmailConfig.supportEmail
        });
      } else if (type === 'email-verification') {
        await storage.setVerificationToken(user.id, hashedOtp, expiry);
        emailSent = await sendEmailVerificationOTP({
          email: user.email,
          code: otp,
          expiresIn: authEmailConfig.OTP_TTL_MINUTES.toString(),
          appUrl: authEmailConfig.APP_URL,
          supportEmail: authEmailConfig.supportEmail
        });
      }

      if (emailSent) {
        console.log(`${type} OTP resent to ${email}`);
      } else {
        console.error(`Failed to resend ${type} OTP to ${email}`);
      }

      res.json({ 
        message: "If this email exists, you'll receive a new code shortly.",
        success: true 
      });
    } catch (error) {
      console.error('Resend OTP error:', error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // ========================================
  // END AUTH OTP ENDPOINTS
  // ========================================

  // Check email service status
  app.get("/api/check-email-status", async (_req, res) => {
    try {
      const status = getEmailServiceStatus();
      const gmailCredentialsConfigured = !!(
        process.env.GMAIL_CLIENT_ID && 
        process.env.GMAIL_CLIENT_SECRET && 
        process.env.GMAIL_REFRESH_TOKEN && 
        process.env.GMAIL_EMAIL
      );
      
      console.log('Checking Email Service status:');
      console.log('- Service Status:', status);
      console.log('- Gmail API Credentials Configured:', gmailCredentialsConfigured);
      
      res.json({ 
        status,
        gmailCredentialsConfigured,
        message: status.isInitialized 
          ? `Email service is properly configured using ${status.provider}` 
          : "Email service is not initialized"
      });
    } catch (error) {
      console.error('Error checking email service status:', error);
      res.status(500).json({ 
        error: 'Failed to check email service status',
        message: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  });
  app.post("/api/create-paypal-order", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() && !req.body.isTestPayment) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verificar que PayPal esté inicializado
      if (!isPayPalInitialized()) {
        return res.status(503).json({ 
          message: "PayPal service unavailable", 
          details: "PayPal is not properly initialized or credentials are invalid",
          code: "PAYPAL_NOT_INITIALIZED"
        });
      }
      
      const { amount, isTestPayment } = req.body;
      
      if (!amount || amount <= 0) {
        return res.status(400).json({ message: "Valid amount is required" });
      }
      
      console.log(`Creating PayPal order for $${amount} (Test payment: ${isTestPayment ? 'Yes' : 'No'})`);
      
      const order = await createPayPalOrder(amount);
      console.log("PayPal order created successfully:", order.id);
      res.json(order);
    } catch (error: any) {
      console.error("PayPal API error:", error);
      
      // Mejorar el mensaje de error para facilitar la depuración
      let statusCode = 500;
      let errorMessage = "Error creating PayPal order: " + error.message;
      let errorCode = "UNKNOWN_ERROR";
      
      if (error.message && error.message.includes("authentication failed")) {
        statusCode = 401;
        errorMessage = "PayPal authentication failed. Please check your PAYPAL_CLIENT_ID and PAYPAL_CLIENT_SECRET.";
        errorCode = "PAYPAL_AUTH_FAILED";
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        code: errorCode
      });
    }
  });
  
  app.post("/api/capture-paypal-order", async (req, res, next) => {
    try {
      if (!req.isAuthenticated()) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Verificar que PayPal esté inicializado
      if (!isPayPalInitialized()) {
        return res.status(503).json({ 
          message: "PayPal service unavailable", 
          details: "PayPal is not properly initialized or credentials are invalid",
          code: "PAYPAL_NOT_INITIALIZED"
        });
      }
      
      const { orderId, invoiceIds } = req.body;
      
      if (!orderId) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      console.log(`Capturing PayPal order: ${orderId}`);
      const captureData = await capturePayPalOrder(orderId);
      console.log("PayPal order captured successfully:", captureData.id);
      
      // Si hay IDs de facturas asociadas, actualizarlas
      if (invoiceIds && Array.isArray(invoiceIds) && invoiceIds.length > 0) {
        console.log(`Processing payment for invoices: ${invoiceIds.join(', ')}`);
        
        for (const invoiceId of invoiceIds) {
          try {
            const invoice = await storage.getInvoice(parseInt(invoiceId));
            
            if (invoice) {
              // Actualizar factura con info de PayPal
              await storage.updatePayPalInvoiceInfo(
                parseInt(invoiceId),
                orderId,
                captureData.id
              );
              
              // Marcar factura como pagada
              await storage.markInvoiceAsPaid(parseInt(invoiceId), "paypal");
              
              // Crear registro de pago
              await storage.createPaymentRecord({
                invoiceId: parseInt(invoiceId),
                userId: req.user.id,
                amount: invoice.total,
                paymentMethod: "paypal",
                status: "completed",
                paymentDate: new Date(),
                transactionId: captureData.id,
                metadata: JSON.stringify(captureData)
              });
              
              console.log(`Invoice ${invoiceId} marked as paid with PayPal`);
            } else {
              console.warn(`Invoice ${invoiceId} not found for PayPal payment ${captureData.id}`);
            }
          } catch (invoiceError) {
            console.error(`Error processing invoice ${invoiceId}:`, invoiceError);
          }
        }
      }
      
      res.json(captureData);
    } catch (error: any) {
      console.error("Error capturing PayPal order:", error);
      
      // Mejorar el mensaje de error para facilitar la depuración
      let statusCode = 500;
      let errorMessage = "Error capturing PayPal order: " + error.message;
      let errorCode = "UNKNOWN_ERROR";
      
      if (error.message && error.message.includes("authentication failed")) {
        statusCode = 401;
        errorMessage = "PayPal authentication failed. Please check your credentials.";
        errorCode = "PAYPAL_AUTH_FAILED";
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        code: errorCode
      });
    }
  });

  // Register Gmail debug route for testing
  registerGmailDebugRoute(app);

  // =========== INICIO DE RUTAS DE FACTURACIÓN ===========
  
  // Webhook de Stripe para actualizaciones automáticas
  app.post("/api/webhooks/stripe", express.raw({ type: 'application/json' }), async (req, res) => {
    const sig = req.headers['stripe-signature'] as string;
    
    if (!process.env.STRIPE_WEBHOOK_SECRET) {
      console.warn("STRIPE_WEBHOOK_SECRET no está configurado, no se puede verificar la firma del webhook");
      return res.status(400).send('Webhook secret not configured');
    }
    
    let event: Stripe.Event;
    
    try {
      // Validar la firma del webhook
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      event = stripe.webhooks.constructEvent(
        req.body,
        sig,
        process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (err: any) {
      console.error(`Error de firma de webhook: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    
    try {
      // Procesar el evento
      const result = await handleStripeWebhook(event);
      
      console.log('Webhook procesado correctamente:', result);
      res.json({ received: true, result });
    } catch (error: any) {
      console.error(`Error procesando webhook: ${error.message}`);
      res.status(500).send(`Webhook processing error: ${error.message}`);
    }
  });
  
  // Rutas para usuarios autenticados - facturación
  
  // Ver las facturas del usuario actual
  app.get("/api/invoices", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      console.log(`Solicitando facturas para usuario ID: ${req.user!.id}, nombre: ${req.user!.firstName} ${req.user!.lastName}`);
      
      // Primero, obtener los IDs de todos los proyectos asociados al usuario
      const userProjects = await storage.getClientProjects(req.user!.id);
      const projectIds = userProjects.map(project => project.id);
      
      console.log(`Proyectos asociados: ${projectIds.join(', ')}`);
      
      // Usar la versión mejorada de getInvoices que incluye facturas relacionadas con proyectos
      const invoices = await storage.getInvoices(req.user!.id);
      
      console.log(`Encontradas ${invoices.length} facturas para el usuario`);
      
      res.json(invoices);
    } catch (error) {
      console.error("Error al obtener facturas:", error);
      next(error);
    }
  });
  
  // Obtener una factura específica (debe pertenecer al usuario)
  app.get("/api/invoices/:id", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await storage.getInvoice(invoiceId);
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verificar que la factura pertenece al usuario
      if (invoice.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to view this invoice" });
      }
      
      res.json(invoice);
    } catch (error) {
      next(error);
    }
  });
  
  // Crear checkout de Stripe para pagar facturas
  app.post("/api/create-payment-intent", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { invoiceIds } = req.body;
      
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty invoice IDs" });
      }
      
      // Verificar que todas las facturas pertenecen al usuario
      const invoices = [];
      let totalAmount = 0;
      
      for (const id of invoiceIds) {
        const invoiceId = parseInt(id);
        if (isNaN(invoiceId)) {
          return res.status(400).json({ message: `Invalid invoice ID: ${id}` });
        }
        
        const invoice = await storage.getInvoice(invoiceId);
        
        if (!invoice) {
          return res.status(404).json({ message: `Invoice ${id} not found` });
        }
        
        // Verificar que la factura pertenece al usuario
        if (invoice.userId !== req.user!.id && req.user!.role !== "admin") {
          return res.status(403).json({ message: `You don't have permission to pay invoice ${id}` });
        }
        
        // Verificar que la factura no esté pagada ya
        if (invoice.status === "paid") {
          return res.status(400).json({ message: `Invoice ${id} is already paid` });
        }
        
        invoices.push(invoice);
        totalAmount += invoice.total;
      }
      
      // Inicializar Stripe
      const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);
      
      // Crear intent de pago
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(totalAmount * 100), // Convertir a centavos
        currency: "usd",
        metadata: {
          invoiceIds: JSON.stringify(invoiceIds),
          userId: req.user!.id.toString()
        }
      });
      
      res.json({
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount,
        invoices: invoices.map(inv => ({
          id: inv.id,
          number: inv.number,
          description: inv.description,
          total: inv.total
        }))
      });
    } catch (error) {
      console.error("Error creating payment intent:", error);
      next(error);
    }
  });
  
  // Endpoint para pagar facturas con PayPal
  app.post("/api/paypal/create-order", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { invoiceIds } = req.body;
      
      if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
        return res.status(400).json({ message: "Invalid or empty invoice IDs" });
      }
      
      // Verificar que todas las facturas pertenecen al usuario
      const invoices = [];
      let totalAmount = 0;
      
      for (const id of invoiceIds) {
        const invoiceId = parseInt(id);
        if (isNaN(invoiceId)) {
          return res.status(400).json({ message: `Invalid invoice ID: ${id}` });
        }
        
        const invoice = await storage.getInvoice(invoiceId);
        
        if (!invoice) {
          return res.status(404).json({ message: `Invoice ${id} not found` });
        }
        
        // Verificar que la factura pertenece al usuario
        if (invoice.userId !== req.user!.id && req.user!.role !== "admin") {
          return res.status(403).json({ message: `You don't have permission to pay invoice ${id}` });
        }
        
        // Verificar que la factura no esté pagada ya
        if (invoice.status === "paid") {
          return res.status(400).json({ message: `Invoice ${id} is already paid` });
        }
        
        invoices.push(invoice);
        totalAmount += invoice.total;
      }
      
      // Crear descripción del pago
      let description = "Pago de ";
      if (invoices.length === 1) {
        description += `factura ${invoices[0].number}`;
      } else {
        description += `facturas: ${invoices.map(inv => inv.number).join(', ')}`;
      }
      
      // Crear orden de PayPal
      const createPaypalOrder = await import('./paypal');
      const result = await createPaypalOrder.createPayPalOrder(totalAmount, "USD");
      
      // Guardar metadatos de la orden
      await storage.updatePayPalOrderMetadata(
        result.id,
        {
          invoiceIds: invoiceIds,
          userId: req.user!.id,
          amount: totalAmount,
          description
        }
      );
      
      res.json(result);
    } catch (error) {
      console.error("Error creating PayPal order:", error);
      next(error);
    }
  });
  
  // Capturar pago de PayPal
  app.post("/api/paypal/capture-order/:orderID", async (req, res, next) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Authentication required" });
    }
    
    try {
      const { orderID } = req.params;
      
      // Verificar que tenemos un ID de orden
      if (!orderID) {
        return res.status(400).json({ message: "Order ID is required" });
      }
      
      // Buscar metadatos de la orden
      const metadata = await storage.getPayPalOrderMetadata(orderID);
      
      if (!metadata || !metadata.invoiceIds) {
        return res.status(404).json({ message: "Order metadata not found" });
      }
      
      // Verificar que la orden pertenece al usuario
      if (metadata.userId !== req.user!.id && req.user!.role !== "admin") {
        return res.status(403).json({ message: "You don't have permission to capture this order" });
      }
      
      // Capturar el pago
      const capturePayPalOrder = await import('./paypal');
      const captureData = await capturePayPalOrder.capturePayPalOrder(orderID);
      
      // Si la captura fue exitosa, actualizar facturas
      if (captureData && captureData.status === "COMPLETED") {
        const invoiceIds = metadata.invoiceIds;
        
        for (const invoiceId of invoiceIds) {
          try {
            const invoice = await storage.getInvoice(parseInt(invoiceId));
            
            if (invoice) {
              // Actualizar factura con info de PayPal
              await storage.updatePayPalInvoiceInfo(
                parseInt(invoiceId),
                orderID,
                captureData.id
              );
              
              // Marcar factura como pagada
              await storage.markInvoiceAsPaid(parseInt(invoiceId), "paypal");
              
              // Crear registro de pago
              await storage.createPaymentRecord({
                invoiceId: parseInt(invoiceId),
                userId: req.user!.id,
                amount: invoice.total,
                paymentMethod: "paypal",
                status: "completed",
                paymentDate: new Date(),
                transactionId: captureData.id,
                metadata: JSON.stringify(captureData)
              });
              
              console.log(`Invoice ${invoiceId} marked as paid with PayPal`);
            } else {
              console.warn(`Invoice ${invoiceId} not found for PayPal payment ${captureData.id}`);
            }
          } catch (invoiceError) {
            console.error(`Error processing invoice ${invoiceId}:`, invoiceError);
          }
        }
      }
      
      res.json(captureData);
    } catch (error: any) {
      console.error("Error capturing PayPal order:", error);
      
      // Mejorar el mensaje de error para facilitar la depuración
      let statusCode = 500;
      let errorMessage = "Error capturing PayPal order: " + error.message;
      let errorCode = "UNKNOWN_ERROR";
      
      if (error.message && error.message.includes("authentication failed")) {
        statusCode = 401;
        errorMessage = "PayPal authentication failed. Please check your credentials.";
        errorCode = "PAYPAL_AUTH_FAILED";
      }
      
      res.status(statusCode).json({ 
        message: errorMessage,
        code: errorCode
      });
    }
  });
  
  // =========== FIN DE RUTAS DE FACTURACIÓN ===========

  // Usar las rutas administrativas que ya están configuradas en línea 131
  // Las rutas de administración ya están registradas con la línea:
  // app.use("/api/admin", (req, res, next) => { ... }, adminRoutes);
  
  // Ruta deshabilitada - credenciales expuestas removidas (Security Hotfix 2025-08)
  app.post("/api/setup-diana-admin", async (req, res) => {
    return res.status(410).json({ error: "This endpoint has been disabled." });
  });
  
  // Ruta para crear facturas para Maryuri Alba (Matoro Bridge Platform)
  app.post("/api/admin/create-matoro-invoices", async (req, res, next) => {
    try {
      // Verificar permisos de administrador
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        console.log("Intento no autorizado de crear facturas Matoro");
        return res.status(403).json({ 
          success: false,
          message: "Acceso denegado. Se requieren permisos de administrador." 
        });
      }
      
      console.log("Iniciando creación de facturas para Maryuri Alba...");
      
      // Importar dinámicamente el módulo
      const maryuriModule = await import('./create-maryuri-invoices.js');
      const invoice = await maryuriModule.createMaryuriInvoices();
      
      console.log("Factura para Maryuri Alba creada exitosamente:", invoice.id);
      return res.status(201).json({
        success: true,
        message: "Factura para Maryuri Alba creada exitosamente",
        invoice
      });
    } catch (error: any) {
      console.error("Error al crear facturas para Maryuri Alba:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error al crear facturas para Maryuri Alba"
      });
    }
  });
  
  // Ruta para obtener el PDF de una factura
  app.get("/api/invoices/:id/pdf", async (req, res, next) => {
    try {
      const { id } = req.params;
      
      // Verificar autenticación del usuario
      if (!req.isAuthenticated() || !req.user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Obtener información de la factura
      const invoice = await storage.getInvoice(parseInt(id));
      
      if (!invoice) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Verificar que el usuario tiene acceso a esta factura
      const userCanAccess = 
        req.user.role === 'admin' || // Los administradores pueden ver todas las facturas
        invoice.userId === req.user.id; // O es la factura del propio usuario
      
      if (!userCanAccess) {
        return res.status(403).json({ message: "Access denied to this invoice" });
      }
      
      // Generar el PDF
      console.log(`Generando PDF para factura ${id}...`);
      const pdfBuffer = await generateInvoicePDF(parseInt(id));
      
      // Configurar encabezados para descarga
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="invoice-${invoice.number}.pdf"`);
      
      // Enviar el PDF
      res.send(pdfBuffer);
    } catch (error: any) {
      console.error("Error al generar PDF de factura:", error);
      return res.status(500).json({
        success: false,
        message: error.message || "Error al generar PDF de factura"
      });
    }
  });

  // Admin: Get all clients/users (no admins)
  app.get("/api/admin/clients", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      // Obtener todos los usuarios
      const users = await storage.getUsers();
      
      // Filtrar solo clientes (usuarios que no son admin)
      const clients = users.filter(user => 
        user.role !== "admin" && user.role !== "superadmin"
      );
      
      console.log(`Retornando ${clients.length} clientes para el dropdown`);
      res.json(clients);
    } catch (error) {
      console.error("Error al obtener clientes:", error);
      next(error);
    }
  });
  
  // Admin: Get all users (both admins and clients)
  app.get("/api/admin/users", async (req, res, next) => {
    try {
      if (!req.isAuthenticated() || !req.user || req.user.role !== "admin") {
        return res.status(403).json({ message: "Admin privileges required" });
      }
      
      const users = await storage.getUsers();
      res.json(users);
    } catch (error) {
      console.error("Error al obtener todos los usuarios:", error);
      next(error);
    }
  });

  // New AI-powered showcase endpoints
  
  // Real-Time Analytics endpoint
  app.post("/api/analytics", async (req, res, next) => {
    try {
      const { company, industry } = req.body;
      
      if (!company || !industry) {
        return res.status(400).json({ error: "Company and industry are required" });
      }
      
      const { generateRealTimeAnalytics } = await import("./openai.js");
      const analytics = await generateRealTimeAnalytics(company, industry);
      
      res.status(200).json(analytics);
    } catch (error: any) {
      console.error("Error in /api/analytics:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // Automation Flows endpoint
  app.post("/api/automation", async (req, res, next) => {
    try {
      const { company, industry, goal } = req.body;
      
      if (!company || !industry || !goal) {
        return res.status(400).json({ error: "Company, industry, and goal are required" });
      }
      
      const { generateAutomationFlows } = await import("./openai.js");
      const automation = await generateAutomationFlows(company, industry, goal);
      
      res.status(200).json(automation);
    } catch (error: any) {
      console.error("Error in /api/automation:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });
  
  // Predictive Insights endpoint
  app.post("/api/insights", async (req, res, next) => {
    try {
      const { company, industry } = req.body;
      
      if (!company || !industry) {
        return res.status(400).json({ error: "Company and industry are required" });
      }
      
      const { generatePredictiveInsights } = await import("./openai.js");
      const insights = await generatePredictiveInsights(company, industry);
      
      res.status(200).json(insights);
    } catch (error: any) {
      console.error("Error in /api/insights:", error);
      res.status(500).json({ error: "Internal Server Error" });
    }
  });

  // =============================================
  // STAFF MANAGEMENT SYSTEM API ROUTES
  // =============================================

  // NOTE: Staff authentication now uses main system /api/login, /api/logout, /api/user

  // Staff Members Management (admin only)
  app.get("/api/staff/members", requireAdmin, async (req, res, next) => {
    try {
      // Get all users with staff level (adminLevel >= 1)
      const allUsers = await storage.getUsers();
      const staffMembers = allUsers.filter(user => (user.adminLevel || 0) >= 1);
      res.json(staffMembers.map(m => ({ ...m, password: undefined }))); // Don't send passwords
    } catch (error) {
      next(error);
    }
  });

  app.get("/api/staff/members/:id", requireAdmin, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid member ID" });
      }
      
      const user = await storage.getUser(id);
      if (!user || (user.adminLevel || 0) < 1) {
        return res.status(404).json({ message: "Staff member not found" });
      }
      
      res.json({ ...user, password: undefined });
    } catch (error) {
      next(error);
    }
  });

  // AI Brief Submissions
  app.post("/api/staff/briefs", requireStaff, async (req, res, next) => {
    try {
      // Generate unique brief ID for tracking
      const uniqueBriefId = `brief_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
      
      const submission = await storage.createAIBriefSubmission({
        ...req.body,
        staffMemberId: req.user!.id,
        uniqueBriefId: uniqueBriefId
      });
      
      res.status(201).json(submission);
    } catch (error) {
      console.error('Error creating AI brief:', error);
      next(error);
    }
  });
  
  app.get("/api/staff/briefs", requireStaff, async (req, res, next) => {
    try {
      const staffMemberId = req.query.all === 'true' ? undefined : req.user!.id;
      const status = req.query.status as string | undefined;
      
      const submissions = await storage.getAIBriefSubmissions(staffMemberId, status);
      res.json(submissions);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/staff/briefs/:id", requireStaff, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }
      
      const submission = await storage.getAIBriefSubmission(id);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Check if staff member owns this submission (unless they are higher level admin)
      const userLevel = req.user!.adminLevel || 0;
      if (submission.staffMemberId !== req.user!.id && userLevel < 3) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(submission);
    } catch (error) {
      next(error);
    }
  });
  
  app.put("/api/staff/briefs/:id", requireStaff, async (req, res, next) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid submission ID" });
      }
      
      const existing = await storage.getAIBriefSubmission(id);
      if (!existing) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      // Check if staff member owns this submission (unless they are higher level admin)
      const userLevel = req.user!.adminLevel || 0;
      if (existing.staffMemberId !== req.user!.id && userLevel < 3) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      const updated = await storage.updateAIBriefSubmission(id, req.body);
      res.json(updated);
    } catch (error) {
      next(error);
    }
  });

  // Send Updated Email
  app.post("/api/staff/send-email", requireStaff, async (req, res, next) => {
    try {
      const { submissionId, emailContent, recipientEmail, recipientName, companyName } = req.body;
      
      if (!submissionId || !emailContent || !recipientEmail) {
        return res.status(400).json({ 
          message: "Submission ID, email content, and recipient email are required" 
        });
      }

      // Send email via Gmail
      const subject = `AI-Powered Marketing Solutions for ${companyName}`;
      const staffMember = req.user!;
      
      await sendEmail({
        to: recipientEmail,
        from: `${staffMember.firstName} ${staffMember.lastName} at TOBAIS <sales@tobais.com>`,
        subject: subject,
        html: emailContent.replace(/\n/g, '<br>')
      });

      // Update the brief to mark as sent
      const submission = await storage.getAIBriefSubmissionBySubmissionId(submissionId);
      if (submission) {
        await storage.updateAIBriefSubmission(submission.id, {
          emailSent: true,
          sentAt: new Date(),
          status: 'sent'
        });
      }

      res.json({ success: true, message: "Email sent successfully" });
    } catch (error) {
      console.error("Error sending email:", error);
      next(error);
    }
  });

  // Email Tracking
  app.post("/api/staff/email-tracking", async (req, res, next) => {
    try {
      const tracking = await storage.createStaffEmailTracking(req.body);
      res.status(201).json(tracking);
    } catch (error) {
      next(error);
    }
  });

  // Mark email as effective when briefId is visited
  app.post("/api/staff/mark-effective", async (req, res, next) => {
    try {
      const { briefId } = req.body;
      
      if (!briefId) {
        return res.status(400).json({ error: "briefId is required" });
      }
      
      console.log(`🎯 Contact page visited with briefId: ${briefId}`);
      
      // Find the brief submission by submission_id
      const brief = await storage.getAIBriefSubmissionBySubmissionId(briefId);
      
      if (brief) {
        // Update email effectiveness
        await storage.updateEmailEffectiveness(briefId, 1);
        console.log(`📧 Email marked as effective - briefId: ${briefId}`);
        
        res.json({ success: true, message: "Email marked as effective" });
      } else {
        console.log(`❌ Brief not found for briefId: ${briefId}`);
        res.status(404).json({ error: "Brief not found" });
      }
    } catch (error) {
      console.error('Error marking email as effective:', error);
      res.status(500).json({ error: "Failed to mark email as effective" });
    }
  });
  
  // Enhanced email open tracking endpoint
  app.get("/api/staff/track-open", async (req, res, next) => {
    try {
      const submissionId = req.query.submissionId as string;
      
      if (submissionId) {
        console.log(`📧 Email opened via track-open - submissionId: ${submissionId}`);
        
        // Create tracking record
        await storage.createStaffEmailTracking({
          submissionId,
          eventType: 'opened',
          eventData: {
            openedAt: new Date(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            method: 'track-open'
          }
        });
      }
      
      // Return 1x1 transparent pixel with aggressive cache busting
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      
      res.set({
        'Content-Type': 'image/png',
        'Content-Length': pixel.length,
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Access-Control-Allow-Origin': '*'
      });
      
      return res.send(pixel);
    } catch (error) {
      console.error('Email open tracking error:', error);
      // Still return pixel even on error
      const pixel = Buffer.from(
        'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        'base64'
      );
      res.set({ 'Content-Type': 'image/png' });
      return res.send(pixel);
    }
  });

  // Link click tracking endpoint
  app.get("/api/staff/track-click", async (req, res, next) => {
    try {
      const submissionId = req.query.submissionId as string;
      const linkType = req.query.type as string || 'unknown';
      const redirectTo = req.query.redirectTo as string;
      
      if (submissionId) {
        console.log(`🔗 Link clicked - submissionId: ${submissionId}, type: ${linkType}`);
        
        // Find the brief by unique_brief_id to get the actual submission_id for FK constraint
        console.log(`🔍 Looking for brief with unique_brief_id: ${submissionId}`);
        const brief = await storage.getAIBriefSubmissionByUniqueId(submissionId);
        console.log(`🔍 Brief lookup result:`, brief ? { id: brief.id, submissionId: brief.submissionId } : 'NOT FOUND');
        
        if (brief) {
          // Use the brief's submission_id for database FK constraint
          const actualSubmissionId = brief.submissionId;
          console.log(`Found brief: ${submissionId} -> actualSubmissionId: ${actualSubmissionId}`);
          
          // Track both open and click events
          await storage.createStaffEmailTracking({
            submissionId: actualSubmissionId,
            eventType: 'opened',
            eventData: {
              openedAt: new Date(),
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              method: 'link-click',
              originalId: submissionId // Keep original for reference
            }
          });
          
          await storage.createStaffEmailTracking({
            submissionId: actualSubmissionId,
            eventType: 'clicked',
            eventData: {
              clickedAt: new Date(),
              userAgent: req.get('User-Agent'),
              ip: req.ip,
              link: redirectTo,
              linkType,
              originalId: submissionId // Keep original for reference
            }
          });
          
          // If this is a consultation button click, mark email as effective
          if (linkType === 'contact') {
            await storage.updateEmailEffectiveness(submissionId, 1);
            console.log(`📧 Email marked as effective - consultation button clicked for ${submissionId}`);
          }
        } else {
          console.log(`⚠️  Brief not found for tracking ID: ${submissionId}`);
        }
      }
      
      // Redirect to target URL
      if (redirectTo) {
        return res.redirect(302, decodeURIComponent(redirectTo));
      } else {
        return res.redirect(302, 'https://tobais.com');
      }
    } catch (error) {
      console.error('Link click tracking error:', error);
      // Still redirect even on error
      if (req.query.redirectTo) {
        return res.redirect(302, decodeURIComponent(req.query.redirectTo as string));
      } else {
        return res.redirect(302, 'https://tobais.com');
      }
    }
  });

  // Original tracking endpoint (kept for backwards compatibility)
  app.get("/api/staff/email-tracking", async (req, res, next) => {
    try {
      const submissionId = req.query.submissionId as string;
      const eventType = req.query.eventType as string;
      
      if (submissionId && eventType === 'opened') {
        console.log(`📧 Email opened via legacy endpoint - submissionId: ${submissionId}`);
        
        await storage.createStaffEmailTracking({
          submissionId,
          eventType: 'opened',
          eventData: {
            openedAt: new Date(),
            userAgent: req.get('User-Agent'),
            ip: req.ip,
            method: 'legacy'
          }
        });
        
        const pixel = Buffer.from(
          'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          'base64'
        );
        
        res.set({
          'Content-Type': 'image/png',
          'Content-Length': pixel.length,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        });
        
        return res.send(pixel);
      }
      
      // Regular tracking query (for retrieving data)
      const tracking = await storage.getStaffEmailTracking(submissionId, eventType);
      res.json(tracking);
    } catch (error) {
      console.error('Email tracking error:', error);
      next(error);
    }
  });

  // Contact Page Visits Tracking
  app.post("/api/staff/contact-visits", async (req, res, next) => {
    try {
      const visit = await storage.createContactPageVisit(req.body);
      res.status(201).json(visit);
    } catch (error) {
      next(error);
    }
  });
  
  app.get("/api/staff/contact-visits", async (req, res, next) => {
    try {
      const submissionId = req.query.submissionId as string | undefined;
      const visits = await storage.getContactPageVisits(submissionId);
      res.json(visits);
    } catch (error) {
      next(error);
    }
  });

  // Staff Dashboard Data
  app.get("/api/staff/dashboard", requireStaff, async (req, res, next) => {
    try {
      const staffMemberId = req.user!.id;
      const dashboardData = await storage.getStaffDashboardData(staffMemberId);
      res.json(dashboardData);
    } catch (error) {
      next(error);
    }
  });

  // Performance Analytics
  app.get("/api/staff/analytics", requireStaff, async (req, res, next) => {
    try {
      const userLevel = req.user!.adminLevel || 0;
      const staffMemberId = (req.query.all === 'true' && userLevel >= 3) ? undefined : req.user!.id;
      const period = req.query.period as string | undefined;
      
      const analytics = await storage.getStaffPerformanceAnalytics(staffMemberId, period);
      res.json(analytics);
    } catch (error) {
      next(error);
    }
  });

  // Export CSV Report
  app.get("/api/staff/briefs/export", requireStaff, async (req, res, next) => {
    try {
      const userLevel = req.user!.adminLevel || 0;
      const staffMemberId = (req.query.all === 'true' && userLevel >= 3) ? undefined : req.user!.id;
      const submissions = await storage.getAIBriefSubmissions(staffMemberId);
      
      // Generate CSV content
      const csvHeaders = [
        'Company Name',
        'Contact Name', 
        'Contact Email',
        'Industry',
        'Lead Score',
        'Brief Created',
        'Email Sent',
        'Email Sent Date',
        'Email Opened',
        'Email Opened Date',
        'Status'
      ];
      
      const csvRows = submissions.map(submission => [
        submission.companyName || '',
        submission.contactName || '',
        submission.contactEmail || '',
        submission.industry || '',
        submission.leadScore?.toString() || '0',
        submission.createdAt ? new Date(submission.createdAt).toLocaleDateString() : '',
        submission.emailSent ? 'Yes' : 'No',
        submission.sentAt ? new Date(submission.sentAt).toLocaleString() : '',
        (submission as any).emailOpened ? 'Yes' : 'No',
        (submission as any).openedAt ? new Date((submission as any).openedAt).toLocaleString() : '',
        submission.status || 'draft'
      ]);
      
      const csvContent = [
        csvHeaders.join(','),
        ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');
      
      // Set CSV headers
      const filename = `tobais_briefs_report_${new Date().toISOString().split('T')[0]}.csv`;
      res.set({
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`
      });
      
      res.send(csvContent);
    } catch (error) {
      console.error('Error exporting CSV:', error);
      next(error);
    }
  });

  // Generate AI Brief Content
  app.post("/api/staff/generate-ai-brief", requireStaff, async (req, res, next) => {
    
    try {
      const { companyName, website, industry, challenges, audience } = req.body;
      
      if (!companyName || !website) {
        return res.status(400).json({ message: "Company name and website are required" });
      }
      
      // Import OpenAI functions
      const { generateAIBrief } = await import("./openai.js");
      
      // Generate AI analysis and recommendations
      const aiAnalysis = await generateAIBrief({
        companyName,
        website,
        industry,
        challenges,
        audience
      });
      
      res.json({
        success: true,
        analysis: aiAnalysis.analysis,
        recommendations: aiAnalysis.recommendations,
        personalizedEmail: aiAnalysis.email,
        leadScore: aiAnalysis.leadScore || 75
      });
    } catch (error) {
      console.error('Error generating AI brief:', error);
      next(error);
    }
  });

  // Send AI-Generated Email
  app.post("/api/staff/send-brief-email", requireStaff, async (req, res, next) => {
    
    try {
      const { submissionId, emailContent, recipientEmail, recipientName, companyName } = req.body;
      
      if (!submissionId || !emailContent || !recipientEmail) {
        return res.status(400).json({ message: "Missing required fields" });
      }
      
      // Get the submission to verify ownership
      const submission = await storage.getAIBriefSubmissionBySubmissionId(submissionId);
      if (!submission) {
        return res.status(404).json({ message: "Submission not found" });
      }
      
      if (submission.staffMemberId !== req.user.id) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      // Send the AI-generated email
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const emailSent = await sendAIBriefEmail({
        to: recipientEmail,
        recipientName: recipientName || 'There',
        companyName: companyName || 'your company',
        emailContent,
        trackingId: submissionId,
        staffMemberName: `${req.user.firstName} ${req.user.lastName}`,
        baseUrl
      });
      
      if (emailSent) {
        // Update submission status
        await storage.updateAIBriefSubmission(submission.id, {
          emailSent: true,
          sentAt: new Date(),
          status: 'sent'
        });
        
        // Track the email send event
        await storage.createStaffEmailTracking({
          submissionId,
          eventType: 'sent',
          eventData: {
            recipient: recipientEmail,
            subject: `Strategic Marketing Insights for ${companyName}`,
            staff_member: req.user.id
          }
        });
        
        res.json({ success: true, message: "Email sent successfully" });
      } else {
        res.status(500).json({ message: "Failed to send email" });
      }
    } catch (error) {
      console.error('Error sending brief email:', error);
      next(error);
    }
  });

  registerRetellConfigRoute(app);

  const httpServer = createServer(app);
  return httpServer;
}
