import { pgTable, text, serial, integer, boolean, timestamp, jsonb, doublePrecision, foreignKey, date, real, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// Users Table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(), // mínimo 7 caracteres, validado en la capa de aplicación
  password: text("password").notNull(), // mínimo 8 caracteres con combinación de caracteres, validado en la capa de aplicación
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  role: text("role").default("user").notNull(), // 'user', 'admin', 'superadmin'
  adminLevel: integer("admin_level").default(0), // 0: regular user, 1-4: limited admin, 5: full admin/superadmin
  permissions: jsonb("permissions").default('{}'), // JSON array of specific permissions
  language: text("language").default("en").notNull(),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  emailVerified: boolean("email_verified").default(false),
  verificationToken: text("verification_token"),
  verificationTokenExpiry: timestamp("verification_token_expiry"),
  resetPasswordToken: text("reset_password_token"),
  resetPasswordTokenExpiry: timestamp("reset_password_token_expiry"),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  language: true,
});

// Contact Submissions Table
export const contactSubmissions = pgTable("contact_submissions", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  message: text("message").notNull(),
  serviceId: integer("service_id").references(() => serviceTypes.id),
  serviceType: text("service_type"), // New field for "other" value
  smsConsent: boolean("sms_consent").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  resolved: boolean("resolved").default(false),
});

// Create contact schema and add transformations for the serviceId
export const insertContactSchema = createInsertSchema(contactSubmissions)
  .pick({
    name: true,
    email: true,
    message: true,
    serviceId: true,
    serviceType: true,
    smsConsent: true,
  })
  .transform((data) => {
    // Handle serviceId vs serviceType
    if (data.serviceType === "other") {
      // If serviceType is "other", ensure serviceId is undefined
      return { ...data, serviceId: undefined };
    }
    
    if (typeof data.serviceId === "string") {
      // Convert string serviceId to number when it's not "other"
      if (data.serviceId) {
        return { ...data, serviceId: Number(data.serviceId) };
      } else {
        return { ...data, serviceId: undefined };
      }
    }
    
    // Return data as is if serviceId is already a number or undefined
    return data;
  });

export type ContactSubmission = typeof contactSubmissions.$inferSelect;
export type InsertContactSubmission = z.infer<typeof insertContactSchema>;

// Prospects Table (for AI Brief leads)
export const prospects = pgTable("prospects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull(),
  company: text("company"),
  industry: text("industry"),
  goal: text("goal"),
  style: text("style"),
  budget: real("budget"),
  notes: text("notes"),
  hasWebsite: text("has_website"), // 'yes', 'no', 'basic'
  websiteQuality: text("website_quality"), // For existing: 'poor', 'outdated', 'good', 'want_better' | For new: 'basic_contact', 'modern_minimal', 'ai_powered', 'full_platform'
  hasSocialMedia: text("has_social_media"), // 'yes', 'no', 'limited'
  socialMediaQuality: text("social_media_quality"), // 'poor', 'basic', 'good', 'want_better'
  aiResponse: jsonb("ai_response"), // Store the full AI-generated brief
  emailSent: boolean("email_sent").default(false),
  followupStatus: text("followup_status").default("new"), // 'new', 'contacted', 'qualified', 'closed', 'lost'
  source: text("source").default("ai_brief"), // Track where the lead came from
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastContactAt: timestamp("last_contact_at"),
});

export const insertProspectSchema = createInsertSchema(prospects).pick({
  name: true,
  email: true,
  company: true,
  industry: true,
  goal: true,
  style: true,
  budget: true,
  notes: true,
  hasWebsite: true,
  websiteQuality: true,
  hasSocialMedia: true,
  socialMediaQuality: true,
  aiResponse: true,
  emailSent: true,
  followupStatus: true,
  source: true,
});

export type Prospect = typeof prospects.$inferSelect;
export type InsertProspect = z.infer<typeof insertProspectSchema>;

// Blog Posts Table
export const blogPosts = pgTable("blog_posts", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  authorId: integer("author_id").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  published: boolean("published").default(false),
  slug: text("slug").notNull().unique(),
  featuredImage: text("featured_image"),
});

export const insertBlogPostSchema = createInsertSchema(blogPosts).pick({
  title: true,
  titleEs: true,
  content: true,
  contentEs: true,
  authorId: true,
  published: true,
  slug: true,
  featuredImage: true,
});

// Projects Table
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  description: text("description").notNull(),
  descriptionEs: text("description_es"),
  clientId: integer("client_id").references(() => users.id),
  status: text("status").default("pending"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  image: text("image"),
  featured: boolean("featured").default(false),
  adminNotes: text("admin_notes"), // Notas internas para administradores
});

export const insertProjectSchema = createInsertSchema(projects).pick({
  title: true,
  titleEs: true,
  description: true,
  descriptionEs: true,
  clientId: true,
  status: true,
  startDate: true,
  endDate: true,
  image: true,
  featured: true,
  adminNotes: true,
});

// Testimonials Table
export const testimonials = pgTable("testimonials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  position: text("position"),
  company: text("company"),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  rating: integer("rating").default(5),
  image: text("image"),
  approved: boolean("approved").default(false),
});

export const insertTestimonialSchema = createInsertSchema(testimonials).pick({
  name: true,
  position: true,
  company: true,
  content: true,
  contentEs: true,
  rating: true,
  image: true,
  approved: true,
});

// Social Media Content Table
export const socialMediaContent = pgTable("social_media_content", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id),
  platform: text("platform").notNull(),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  image: text("image"),
  scheduled: boolean("scheduled").default(false),
  scheduledDate: timestamp("scheduled_date"),
  aiGenerated: boolean("ai_generated").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  metadata: jsonb("metadata"),
});

export const insertSocialMediaSchema = createInsertSchema(socialMediaContent).pick({
  userId: true,
  platform: true,
  content: true,
  contentEs: true,
  image: true,
  scheduled: true,
  scheduledDate: true,
  aiGenerated: true,
  metadata: true,
});

// Service Types
export const serviceTypes = pgTable("service_types", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  nameEs: text("name_es"),
  description: text("description").notNull(),
  descriptionEs: text("description_es"),
  price: integer("price").notNull(),
  features: jsonb("features"),
  featuresEs: jsonb("features_es"),
  icon: text("icon"),
  sortOrder: integer("sort_order").default(0),
});

export const insertServiceTypeSchema = createInsertSchema(serviceTypes).pick({
  name: true,
  nameEs: true,
  description: true,
  descriptionEs: true,
  price: true,
  features: true,
  featuresEs: true,
  icon: true,
  sortOrder: true,
});

// Type exports
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContact = z.infer<typeof insertContactSchema>;

export type InsertBlogPost = z.infer<typeof insertBlogPostSchema>;
export type BlogPost = typeof blogPosts.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertTestimonial = z.infer<typeof insertTestimonialSchema>;
export type Testimonial = typeof testimonials.$inferSelect;

export type InsertSocialMedia = z.infer<typeof insertSocialMediaSchema>;
export type SocialMedia = typeof socialMediaContent.$inferSelect;

export type InsertServiceType = z.infer<typeof insertServiceTypeSchema>;
export type ServiceType = typeof serviceTypes.$inferSelect;

// Orders Table
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  status: text("status").default("pending").notNull(),
  total: integer("total").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
  stripePaymentId: text("stripe_payment_id"),
  stripeCustomerId: text("stripe_customer_id"),
  notes: text("notes"),
  shippingAddress: jsonb("shipping_address"),
  paymentMethod: text("payment_method").default("stripe"),
  discountCode: text("discount_code"),
  discountAmount: integer("discount_amount").default(0),
});

export const insertOrderSchema = createInsertSchema(orders).pick({
  userId: true,
  status: true,
  total: true,
  stripePaymentId: true,
  stripeCustomerId: true,
  notes: true,
  shippingAddress: true,
  paymentMethod: true,
  discountCode: true,
  discountAmount: true,
});

// Order Items Table
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").references(() => orders.id).notNull(),
  serviceId: integer("service_id").references(() => serviceTypes.id).notNull(),
  quantity: integer("quantity").default(1).notNull(),
  price: integer("price").notNull(),
  name: text("name").notNull(),
  description: text("description"),
});

export const insertOrderItemSchema = createInsertSchema(orderItems).pick({
  orderId: true,
  serviceId: true,
  quantity: true,
  price: true,
  name: true,
  description: true,
});

// Project Milestones Table
export const projectMilestones = pgTable("project_milestones", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  title: text("title").notNull(),
  titleEs: text("title_es"),
  description: text("description"),
  descriptionEs: text("description_es"),
  dueDate: timestamp("due_date"),
  completedAt: timestamp("completed_at"),
  status: text("status").default("pending").notNull(),
  sortOrder: integer("sort_order").default(0),
});

export const insertProjectMilestoneSchema = createInsertSchema(projectMilestones).pick({
  projectId: true,
  title: true,
  titleEs: true,
  description: true,
  descriptionEs: true,
  dueDate: true,
  completedAt: true,
  status: true,
  sortOrder: true,
});

// Project Updates Table
export const projectUpdates = pgTable("project_updates", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  contentEs: text("content_es"),
  attachments: jsonb("attachments"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  isPublic: boolean("is_public").default(true),
});

export const insertProjectUpdateSchema = createInsertSchema(projectUpdates).pick({
  projectId: true,
  userId: true,
  content: true,
  contentEs: true,
  attachments: true,
  isPublic: true,
});

// Project Comments Table
export const projectComments = pgTable("project_comments", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").references(() => projects.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  attachments: jsonb("attachments"),
});

export const insertProjectCommentSchema = createInsertSchema(projectComments).pick({
  projectId: true,
  userId: true,
  content: true,
  attachments: true,
});

// Define relations
export const usersRelations = relations(users, ({ many }) => ({
  projects: many(projects),
  orders: many(orders),
  projectComments: many(projectComments),
  projectUpdates: many(projectUpdates),
  socialMediaContent: many(socialMediaContent),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  client: one(users, {
    fields: [projects.clientId],
    references: [users.id],
  }),
  milestones: many(projectMilestones),
  updates: many(projectUpdates),
  comments: many(projectComments),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  items: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  service: one(serviceTypes, {
    fields: [orderItems.serviceId],
    references: [serviceTypes.id],
  }),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({ one }) => ({
  project: one(projects, {
    fields: [projectMilestones.projectId],
    references: [projects.id],
  }),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({ one }) => ({
  project: one(projects, {
    fields: [projectUpdates.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectUpdates.userId],
    references: [users.id],
  }),
}));

export const projectCommentsRelations = relations(projectComments, ({ one }) => ({
  project: one(projects, {
    fields: [projectComments.projectId],
    references: [projects.id],
  }),
  user: one(users, {
    fields: [projectComments.userId],
    references: [users.id],
  }),
}));

export const socialMediaContentRelations = relations(socialMediaContent, ({ one }) => ({
  user: one(users, {
    fields: [socialMediaContent.userId],
    references: [users.id],
  }),
}));

export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type Order = typeof orders.$inferSelect;

export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type OrderItem = typeof orderItems.$inferSelect;

export type InsertProjectMilestone = z.infer<typeof insertProjectMilestoneSchema>;
export type ProjectMilestone = typeof projectMilestones.$inferSelect;

export type InsertProjectUpdate = z.infer<typeof insertProjectUpdateSchema>;
export type ProjectUpdate = typeof projectUpdates.$inferSelect;

export type InsertProjectComment = z.infer<typeof insertProjectCommentSchema>;
export type ProjectComment = typeof projectComments.$inferSelect;

// Invoices Table
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").references(() => users.id).notNull(),
  projectId: integer("project_id").references(() => projects.id),
  number: varchar("number", { length: 50 }).notNull().unique(),
  status: text("status").default("pending").notNull(), // pending, paid, cancelled, overdue
  issueDate: timestamp("issue_date").defaultNow().notNull(),
  dueDate: timestamp("due_date").notNull(),
  amount: integer("amount").notNull(), // in cents
  taxRate: real("tax_rate").default(0), // Tasa de impuesto (en porcentaje, 0.0 a 100.0)
  tax: integer("tax").default(0), // in cents (valor calculado)
  discount: integer("discount").default(0), // in cents
  total: integer("total").notNull(), // in cents (amount + tax - discount)
  notes: text("notes"),
  paymentMethod: text("payment_method").default(""), // stripe, paypal, bank_transfer, etc.
  paymentDate: timestamp("payment_date"),
  paymentLink: text("payment_link"), // Para almacenar enlaces de pago (especialmente PayPal o manuales)
  stripeInvoiceId: text("stripe_invoice_id"),
  stripePaymentIntentId: text("stripe_payment_intent_id"),
  paypalOrderId: text("paypal_order_id"),
  description: text("description"), // Descripción detallada de la factura
  items: jsonb("items"), // JSON array of invoice items
  metadata: jsonb("metadata"), // For additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertInvoiceSchema = createInsertSchema(invoices).pick({
  userId: true,
  projectId: true,
  number: true,
  status: true,
  issueDate: true,
  dueDate: true,
  amount: true,
  taxRate: true,
  tax: true,
  discount: true,
  total: true,
  notes: true,
  description: true,
  paymentMethod: true,
  paymentDate: true,
  paymentLink: true,
  stripeInvoiceId: true,
  stripePaymentIntentId: true,
  paypalOrderId: true,
  items: true,
  metadata: true,
});

// Payment Records Table
export const paymentRecords = pgTable("payment_records", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").references(() => invoices.id).notNull(),
  userId: integer("user_id").references(() => users.id).notNull(),
  amount: integer("amount").notNull(), // in cents
  paymentMethod: text("payment_method").notNull(), // stripe, paypal, bank_transfer, etc.
  paymentDate: timestamp("payment_date").defaultNow().notNull(),
  status: text("status").default("completed").notNull(), // completed, failed, refunded
  transactionId: text("transaction_id"), // Payment processor transaction ID
  metadata: jsonb("metadata"), // For additional data
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertPaymentRecordSchema = createInsertSchema(paymentRecords).pick({
  invoiceId: true,
  userId: true,
  amount: true,
  paymentMethod: true,
  paymentDate: true,
  status: true,
  transactionId: true,
  metadata: true,
});

// Now that we've defined all tables, we can add the relations specific to invoices
export const usersInvoicesRelations = relations(users, ({ many }) => ({
  invoices: many(invoices),
  paymentRecords: many(paymentRecords),
}));

export const projectsInvoicesRelations = relations(projects, ({ many }) => ({
  invoices: many(invoices),
}));

export const invoicesRelations = relations(invoices, ({ one, many }) => ({
  user: one(users, {
    fields: [invoices.userId],
    references: [users.id],
  }),
  project: one(projects, {
    fields: [invoices.projectId],
    references: [projects.id],
  }),
  payments: many(paymentRecords),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({ one }) => ({
  invoice: one(invoices, {
    fields: [paymentRecords.invoiceId],
    references: [invoices.id],
  }),
  user: one(users, {
    fields: [paymentRecords.userId],
    references: [users.id],
  }),
}));

export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;
export type Invoice = typeof invoices.$inferSelect;

export type InsertPaymentRecord = z.infer<typeof insertPaymentRecordSchema>;
export type PaymentRecord = typeof paymentRecords.$inferSelect;

// Outreach Campaigns Table
export const outreachCampaigns = pgTable("outreach_campaigns", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  status: text("status").default("active").notNull(), // active, paused, completed
  templateId: integer("template_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Outreach Templates Table
export const outreachTemplates = pgTable("outreach_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  variables: jsonb("variables").default('[]'), // Array of template variables
  isDefault: boolean("is_default").default(false),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prospect Research Table (expanded from existing prospects)
export const prospectResearch = pgTable("prospect_research", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").references(() => prospects.id).notNull(),
  websiteUrl: text("website_url"),
  websiteAnalysis: jsonb("website_analysis"), // AI analysis results
  socialMediaPresence: jsonb("social_media_presence"), // Social media analysis
  competitorAnalysis: jsonb("competitor_analysis"),
  recommendations: jsonb("recommendations"), // AI-generated recommendations
  industryCategory: text("industry_category"),
  businessSize: text("business_size"), // small, medium, large, enterprise
  digitalMaturityScore: integer("digital_maturity_score"), // 1-100
  researchedBy: integer("researched_by").references(() => users.id).notNull(),
  researchDate: timestamp("research_date").defaultNow().notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

// Outreach Emails Table
export const outreachEmails = pgTable("outreach_emails", {
  id: serial("id").primaryKey(),
  campaignId: integer("campaign_id").references(() => outreachCampaigns.id).notNull(),
  prospectId: integer("prospect_id").references(() => prospects.id).notNull(),
  researchId: integer("research_id").references(() => prospectResearch.id),
  sentBy: integer("sent_by").references(() => users.id).notNull(),
  recipientEmail: text("recipient_email").notNull(),
  recipientName: text("recipient_name"),
  subject: text("subject").notNull(),
  htmlContent: text("html_content").notNull(),
  textContent: text("text_content"),
  personalizedContent: jsonb("personalized_content"), // AI-generated personalized insights
  status: text("status").default("sent").notNull(), // sent, delivered, opened, clicked, replied, bounced
  sentAt: timestamp("sent_at").defaultNow().notNull(),
  deliveredAt: timestamp("delivered_at"),
  firstOpenedAt: timestamp("first_opened_at"),
  lastOpenedAt: timestamp("last_opened_at"),
  openCount: integer("open_count").default(0),
  clickCount: integer("click_count").default(0),
  replyAt: timestamp("reply_at"),
  bounceReason: text("bounce_reason"),
  trackingId: text("tracking_id").notNull().unique(), // For email tracking
  metadata: jsonb("metadata").default('{}'),
});

// Email Tracking Events Table
export const emailTrackingEvents = pgTable("email_tracking_events", {
  id: serial("id").primaryKey(),
  emailId: integer("email_id").references(() => outreachEmails.id).notNull(),
  eventType: text("event_type").notNull(), // open, click, reply, bounce, unsubscribe
  eventData: jsonb("event_data"), // Additional event data (IP, user agent, etc.)
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  location: text("location"), // City, Country
});

// Follow-up Sequences Table
export const followupSequences = pgTable("followup_sequences", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  steps: jsonb("steps").notNull(), // Array of follow-up steps with delays and templates
  isActive: boolean("is_active").default(true),
  createdBy: integer("created_by").references(() => users.id).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Prospect Follow-ups Table
export const prospectFollowups = pgTable("prospect_followups", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").references(() => prospects.id).notNull(),
  sequenceId: integer("sequence_id").references(() => followupSequences.id).notNull(),
  currentStep: integer("current_step").default(0),
  nextActionAt: timestamp("next_action_at"),
  status: text("status").default("active").notNull(), // active, paused, completed, stopped
  completedSteps: jsonb("completed_steps").default('[]'),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// Lead Scoring Table
export const leadScoring = pgTable("lead_scoring", {
  id: serial("id").primaryKey(),
  prospectId: integer("prospect_id").references(() => prospects.id).notNull().unique(),
  overallScore: integer("overall_score").default(0), // 0-100
  emailEngagementScore: integer("email_engagement_score").default(0),
  websiteQualityScore: integer("website_quality_score").default(0),
  socialMediaScore: integer("social_media_score").default(0),
  businessPotentialScore: integer("business_potential_score").default(0),
  responseScore: integer("response_score").default(0),
  lastCalculated: timestamp("last_calculated").defaultNow().notNull(),
  scoringData: jsonb("scoring_data").default('{}'),
});

// Insert Schemas
export const insertOutreachCampaignSchema = createInsertSchema(outreachCampaigns).pick({
  name: true,
  description: true,
  createdBy: true,
  status: true,
  templateId: true,
});

export const insertOutreachTemplateSchema = createInsertSchema(outreachTemplates).pick({
  name: true,
  subject: true,
  htmlContent: true,
  textContent: true,
  variables: true,
  isDefault: true,
  createdBy: true,
});

export const insertProspectResearchSchema = createInsertSchema(prospectResearch).pick({
  prospectId: true,
  websiteUrl: true,
  websiteAnalysis: true,
  socialMediaPresence: true,
  competitorAnalysis: true,
  recommendations: true,
  industryCategory: true,
  businessSize: true,
  digitalMaturityScore: true,
  researchedBy: true,
});

export const insertOutreachEmailSchema = createInsertSchema(outreachEmails).pick({
  campaignId: true,
  prospectId: true,
  researchId: true,
  sentBy: true,
  recipientEmail: true,
  recipientName: true,
  subject: true,
  htmlContent: true,
  textContent: true,
  personalizedContent: true,
  trackingId: true,
  metadata: true,
});

export const insertEmailTrackingEventSchema = createInsertSchema(emailTrackingEvents).pick({
  emailId: true,
  eventType: true,
  eventData: true,
  ipAddress: true,
  userAgent: true,
  location: true,
});

export const insertFollowupSequenceSchema = createInsertSchema(followupSequences).pick({
  name: true,
  description: true,
  steps: true,
  isActive: true,
  createdBy: true,
});

export const insertProspectFollowupSchema = createInsertSchema(prospectFollowups).pick({
  prospectId: true,
  sequenceId: true,
  currentStep: true,
  nextActionAt: true,
  status: true,
  completedSteps: true,
});

export const insertLeadScoringSchema = createInsertSchema(leadScoring).pick({
  prospectId: true,
  overallScore: true,
  emailEngagementScore: true,
  websiteQualityScore: true,
  socialMediaScore: true,
  businessPotentialScore: true,
  responseScore: true,
  scoringData: true,
});

// Relations
export const outreachCampaignsRelations = relations(outreachCampaigns, ({ one, many }) => ({
  creator: one(users, {
    fields: [outreachCampaigns.createdBy],
    references: [users.id],
  }),
  emails: many(outreachEmails),
}));

export const outreachTemplatesRelations = relations(outreachTemplates, ({ one }) => ({
  creator: one(users, {
    fields: [outreachTemplates.createdBy],
    references: [users.id],
  }),
}));

export const prospectResearchRelations = relations(prospectResearch, ({ one }) => ({
  prospect: one(prospects, {
    fields: [prospectResearch.prospectId],
    references: [prospects.id],
  }),
  researcher: one(users, {
    fields: [prospectResearch.researchedBy],
    references: [users.id],
  }),
}));

export const outreachEmailsRelations = relations(outreachEmails, ({ one, many }) => ({
  campaign: one(outreachCampaigns, {
    fields: [outreachEmails.campaignId],
    references: [outreachCampaigns.id],
  }),
  prospect: one(prospects, {
    fields: [outreachEmails.prospectId],
    references: [prospects.id],
  }),
  research: one(prospectResearch, {
    fields: [outreachEmails.researchId],
    references: [prospectResearch.id],
  }),
  sender: one(users, {
    fields: [outreachEmails.sentBy],
    references: [users.id],
  }),
  trackingEvents: many(emailTrackingEvents),
}));

export const emailTrackingEventsRelations = relations(emailTrackingEvents, ({ one }) => ({
  email: one(outreachEmails, {
    fields: [emailTrackingEvents.emailId],
    references: [outreachEmails.id],
  }),
}));

export const followupSequencesRelations = relations(followupSequences, ({ one, many }) => ({
  creator: one(users, {
    fields: [followupSequences.createdBy],
    references: [users.id],
  }),
  prospectFollowups: many(prospectFollowups),
}));

export const prospectFollowupsRelations = relations(prospectFollowups, ({ one }) => ({
  prospect: one(prospects, {
    fields: [prospectFollowups.prospectId],
    references: [prospects.id],
  }),
  sequence: one(followupSequences, {
    fields: [prospectFollowups.sequenceId],
    references: [followupSequences.id],
  }),
}));

export const leadScoringRelations = relations(leadScoring, ({ one }) => ({
  prospect: one(prospects, {
    fields: [leadScoring.prospectId],
    references: [prospects.id],
  }),
}));

// Extended user relations to include outreach activities
export const usersOutreachRelations = relations(users, ({ many }) => ({
  outreachCampaigns: many(outreachCampaigns),
  outreachTemplates: many(outreachTemplates),
  prospectResearch: many(prospectResearch),
  outreachEmails: many(outreachEmails),
  followupSequences: many(followupSequences),
}));

// Extended prospect relations
export const prospectsExtendedRelations = relations(prospects, ({ many, one }) => ({
  research: many(prospectResearch),
  outreachEmails: many(outreachEmails),
  followups: many(prospectFollowups),
  leadScore: one(leadScoring, {
    fields: [prospects.id],
    references: [leadScoring.prospectId],
  }),
}));

// Type exports
export type OutreachCampaign = typeof outreachCampaigns.$inferSelect;
export type InsertOutreachCampaign = z.infer<typeof insertOutreachCampaignSchema>;

export type OutreachTemplate = typeof outreachTemplates.$inferSelect;
export type InsertOutreachTemplate = z.infer<typeof insertOutreachTemplateSchema>;

export type ProspectResearch = typeof prospectResearch.$inferSelect;
export type InsertProspectResearch = z.infer<typeof insertProspectResearchSchema>;

export type OutreachEmail = typeof outreachEmails.$inferSelect;
export type InsertOutreachEmail = z.infer<typeof insertOutreachEmailSchema>;

export type EmailTrackingEvent = typeof emailTrackingEvents.$inferSelect;
export type InsertEmailTrackingEvent = z.infer<typeof insertEmailTrackingEventSchema>;

export type FollowupSequence = typeof followupSequences.$inferSelect;
export type InsertFollowupSequence = z.infer<typeof insertFollowupSequenceSchema>;

export type ProspectFollowup = typeof prospectFollowups.$inferSelect;
export type InsertProspectFollowup = z.infer<typeof insertProspectFollowupSchema>;

export type LeadScoring = typeof leadScoring.$inferSelect;
export type InsertLeadScoring = z.infer<typeof insertLeadScoringSchema>;

// ================================
// STAFF MANAGEMENT SYSTEM TABLES
// ================================

// Staff Members (separate from regular users)
export const staffMembers = pgTable("staff_members", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  password: text("password").notNull(),
  role: text("role").default("staff").notNull(), // 'staff', 'lead', 'manager'
  permissions: jsonb("permissions").default('["ai_brief", "outreach"]'),
  isActive: boolean("is_active").default(true).notNull(),
  emailVerified: boolean("email_verified").default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  lastLogin: timestamp("last_login"),
  createdBy: integer("created_by").references(() => users.id), // admin que lo creó
});

export const insertStaffMemberSchema = createInsertSchema(staffMembers).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

// AI Brief Submissions (cada empleado genera estos)
export const aiBriefSubmissions = pgTable("ai_brief_submissions", {
  id: serial("id").primaryKey(),
  submissionId: text("submission_id").notNull().unique(), // formato: staff_id_timestamp
  staffMemberId: integer("staff_member_id").notNull().references(() => staffMembers.id),
  
  // Prospect Information
  companyName: text("company_name").notNull(),
  contactName: text("contact_name"),
  contactEmail: text("contact_email").notNull(),
  website: text("website").notNull(),
  industry: text("industry"),
  businessSize: text("business_size").default("medium"),
  currentChallenges: text("current_challenges"),
  targetAudience: text("target_audience"),
  socialMediaPresence: text("social_media_presence"),
  businessGoals: text("business_goals"),
  
  // AI Generated Content
  aiAnalysis: jsonb("ai_analysis"), // website analysis, social media analysis, etc.
  aiRecommendations: jsonb("ai_recommendations"), // strategic recommendations
  personalizedEmail: text("personalized_email"), // AI generated email
  leadScore: integer("lead_score").default(0),
  
  // Status and Tracking
  status: text("status").default("draft").notNull(), // 'draft', 'generated', 'sent', 'responded'
  emailSent: boolean("email_sent").default(false),
  sentAt: timestamp("sent_at"),
  
  // Email tracking fields
  uniqueBriefId: text("unique_brief_id").unique(), // unique identifier for tracking clicks
  emailEffective: integer("email_effective").default(0), // 0 = not clicked, 1 = clicked
  
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertAIBriefSubmissionSchema = createInsertSchema(aiBriefSubmissions).omit({
  id: true,
  submissionId: true,
  createdAt: true,
  updatedAt: true,
});

// Email Tracking Events (tracking de clicks en emails)
export const staffEmailTracking = pgTable("staff_email_tracking", {
  id: serial("id").primaryKey(),
  submissionId: text("submission_id").notNull().references(() => aiBriefSubmissions.submissionId),
  eventType: text("event_type").notNull(), // 'sent', 'delivered', 'opened', 'clicked', 'contact_page_visit'
  eventData: jsonb("event_data"), // additional event information
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertStaffEmailTrackingSchema = createInsertSchema(staffEmailTracking).omit({
  id: true,
  timestamp: true,
});

// Contact Page Visits (tracking cuando vienen del email)
export const contactPageVisits = pgTable("contact_page_visits", {
  id: serial("id").primaryKey(),
  submissionId: text("submission_id").references(() => aiBriefSubmissions.submissionId),
  visitId: text("visit_id").notNull().unique(), // UUID para tracking
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  referrer: text("referrer"),
  visitedAt: timestamp("visited_at").defaultNow().notNull(),
  formSubmitted: boolean("form_submitted").default(false),
  submissionData: jsonb("submission_data"), // if they submitted contact form
});

export const insertContactPageVisitSchema = createInsertSchema(contactPageVisits).omit({
  id: true,
  visitedAt: true,
});

// Staff Performance Analytics
export const staffPerformanceAnalytics = pgTable("staff_performance_analytics", {
  id: serial("id").primaryKey(),
  staffMemberId: integer("staff_member_id").notNull().references(() => staffMembers.id),
  period: text("period").notNull(), // 'daily', 'weekly', 'monthly'
  periodDate: date("period_date").notNull(),
  
  // Performance Metrics
  briefsGenerated: integer("briefs_generated").default(0),
  emailsSent: integer("emails_sent").default(0),
  emailsOpened: integer("emails_opened").default(0),
  emailsClicked: integer("emails_clicked").default(0),
  contactPageVisits: integer("contact_page_visits").default(0),
  contactFormsSubmitted: integer("contact_forms_submitted").default(0),
  
  // Rates
  openRate: real("open_rate").default(0), // percentage
  clickRate: real("click_rate").default(0), // percentage
  conversionRate: real("conversion_rate").default(0), // percentage
  
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const insertStaffPerformanceAnalyticsSchema = createInsertSchema(staffPerformanceAnalytics).omit({
  id: true,
  updatedAt: true,
});

// Relations for Staff System
export const staffMemberRelations = relations(staffMembers, ({ many, one }) => ({
  aiBriefSubmissions: many(aiBriefSubmissions),
  performanceAnalytics: many(staffPerformanceAnalytics),
  createdByUser: one(users, {
    fields: [staffMembers.createdBy],
    references: [users.id],
  }),
}));

export const aiBriefSubmissionRelations = relations(aiBriefSubmissions, ({ one, many }) => ({
  staffMember: one(staffMembers, {
    fields: [aiBriefSubmissions.staffMemberId],
    references: [staffMembers.id],
  }),
  emailTracking: many(staffEmailTracking),
  contactPageVisits: many(contactPageVisits),
}));

export const staffEmailTrackingRelations = relations(staffEmailTracking, ({ one }) => ({
  submission: one(aiBriefSubmissions, {
    fields: [staffEmailTracking.submissionId],
    references: [aiBriefSubmissions.submissionId],
  }),
}));

export const contactPageVisitsRelations = relations(contactPageVisits, ({ one }) => ({
  submission: one(aiBriefSubmissions, {
    fields: [contactPageVisits.submissionId],
    references: [aiBriefSubmissions.submissionId],
  }),
}));

export const staffPerformanceAnalyticsRelations = relations(staffPerformanceAnalytics, ({ one }) => ({
  staffMember: one(staffMembers, {
    fields: [staffPerformanceAnalytics.staffMemberId],
    references: [staffMembers.id],
  }),
}));

// Type exports for Staff System
export type StaffMember = typeof staffMembers.$inferSelect;
export type InsertStaffMember = z.infer<typeof insertStaffMemberSchema>;

export type AIBriefSubmission = typeof aiBriefSubmissions.$inferSelect;
export type InsertAIBriefSubmission = z.infer<typeof insertAIBriefSubmissionSchema>;

export type StaffEmailTracking = typeof staffEmailTracking.$inferSelect;
export type InsertStaffEmailTracking = z.infer<typeof insertStaffEmailTrackingSchema>;

export type ContactPageVisit = typeof contactPageVisits.$inferSelect;
export type InsertContactPageVisit = z.infer<typeof insertContactPageVisitSchema>;

export type StaffPerformanceAnalytics = typeof staffPerformanceAnalytics.$inferSelect;
export type InsertStaffPerformanceAnalytics = z.infer<typeof insertStaffPerformanceAnalyticsSchema>;
