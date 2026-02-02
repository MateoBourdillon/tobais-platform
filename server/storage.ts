import { 
  users, 
  contactSubmissions,
  prospects,
  blogPosts, 
  projects, 
  testimonials, 
  socialMediaContent, 
  serviceTypes,
  orders,
  orderItems,
  projectMilestones,
  projectUpdates,
  projectComments,
  invoices,
  paymentRecords,
  // Staff System Tables
  aiBriefSubmissions,
  staffEmailTracking,
  contactPageVisits,
  staffPerformanceAnalytics,
  type User, 
  type InsertUser,
  type ContactSubmission, 
  type InsertContact, 
  type Prospect,
  type InsertProspect,
  type BlogPost, 
  type InsertBlogPost, 
  type Project, 
  type InsertProject, 
  type Testimonial, 
  type InsertTestimonial, 
  type SocialMedia, 
  type InsertSocialMedia, 
  type ServiceType, 
  type InsertServiceType,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type ProjectMilestone,
  type InsertProjectMilestone,
  type ProjectUpdate,
  type InsertProjectUpdate,
  type ProjectComment,
  type InsertProjectComment,
  type Invoice,
  type InsertInvoice,
  type PaymentRecord,
  type InsertPaymentRecord,
  // Staff System Types
  type AIBriefSubmission,
  type InsertAIBriefSubmission,
  type StaffEmailTracking,
  type InsertStaffEmailTracking,
  type ContactPageVisit,
  type InsertContactPageVisit,
  type StaffPerformanceAnalytics,
  type InsertStaffPerformanceAnalytics
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";
import { Store as SessionStore } from "express-session";
import { eq, desc, asc, or, and, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import pgSimpleModule from "connect-pg-simple";
import { sendInvoiceEmail } from "./email";

const MemoryStore = createMemoryStore(session);

// Interface for all storage operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  createAdminUser(user: InsertUser & { adminLevel?: number, permissions?: string[] }): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User | undefined>;
  deleteUser(id: number): Promise<boolean>;
  getAllAdminUsers(): Promise<User[]>;
  
  // Auth token operations
  setResetPasswordToken(userId: number, token: string, expiry: Date): Promise<void>;
  setVerificationToken(userId: number, token: string, expiry: Date): Promise<void>;
  getUserByResetToken(token: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  clearResetPasswordToken(userId: number): Promise<void>;
  clearVerificationToken(userId: number): Promise<void>;
  markEmailAsVerified(userId: number): Promise<void>;
  
  // Contact submissions
  createContactSubmission(submission: InsertContact): Promise<ContactSubmission>;
  getContactSubmissions(): Promise<ContactSubmission[]>;
  getContactSubmission(id: number): Promise<ContactSubmission | undefined>;
  updateContactSubmission(id: number, data: Partial<ContactSubmission>): Promise<ContactSubmission | undefined>;
  
  // Prospects (AI Brief leads)
  createProspect(prospect: InsertProspect): Promise<Prospect>;
  getProspects(followupStatus?: string): Promise<Prospect[]>;
  getProspect(id: number): Promise<Prospect | undefined>;
  getProspectByEmail(email: string): Promise<Prospect | undefined>;
  updateProspect(id: number, data: Partial<Prospect>): Promise<Prospect | undefined>;
  deleteProspect(id: number): Promise<boolean>;
  
  // Blog posts
  createBlogPost(post: InsertBlogPost): Promise<BlogPost>;
  getBlogPosts(limit?: number, published?: boolean): Promise<BlogPost[]>;
  getBlogPost(id: number): Promise<BlogPost | undefined>;
  getBlogPostBySlug(slug: string): Promise<BlogPost | undefined>;
  updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined>;
  deleteBlogPost(id: number): Promise<boolean>;
  
  // Projects
  createProject(project: InsertProject): Promise<Project>;
  getProjects(featured?: boolean): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  getClientProjects(clientId: number): Promise<Project[]>;
  updateProject(id: number, data: Partial<Project>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;
  
  // Project Milestones
  createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone>;
  getProjectMilestones(projectId: number): Promise<ProjectMilestone[]>;
  getProjectMilestone(id: number): Promise<ProjectMilestone | undefined>;
  updateProjectMilestone(id: number, data: Partial<ProjectMilestone>): Promise<ProjectMilestone | undefined>;
  deleteProjectMilestone(id: number): Promise<boolean>;
  
  // Project Updates
  createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate>;
  getProjectUpdates(projectId: number, publicOnly?: boolean): Promise<ProjectUpdate[]>;
  getProjectUpdate(id: number): Promise<ProjectUpdate | undefined>;
  updateProjectUpdate(id: number, data: Partial<ProjectUpdate>): Promise<ProjectUpdate | undefined>;
  deleteProjectUpdate(id: number): Promise<boolean>;
  
  // Project Comments
  createProjectComment(comment: InsertProjectComment): Promise<ProjectComment>;
  getProjectComments(projectId: number): Promise<ProjectComment[]>;
  getProjectComment(id: number): Promise<ProjectComment | undefined>;
  updateProjectComment(id: number, data: Partial<ProjectComment>): Promise<ProjectComment | undefined>;
  deleteProjectComment(id: number): Promise<boolean>;
  
  // Orders
  createOrder(order: InsertOrder): Promise<Order>;
  getOrders(userId?: number, status?: string): Promise<Order[]>;
  getOrder(id: number): Promise<Order | undefined>;
  updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined>;
  updateStripeInfo(userId: number, stripeCustomerId: string, orderId: number, stripePaymentId: string): Promise<Order | undefined>;
  
  // Order Items
  createOrderItem(item: InsertOrderItem): Promise<OrderItem>;
  getOrderItems(orderId: number): Promise<OrderItem[]>;
  getOrderItem(id: number): Promise<OrderItem | undefined>;
  updateOrderItem(id: number, data: Partial<OrderItem>): Promise<OrderItem | undefined>;
  deleteOrderItem(id: number): Promise<boolean>;
  
  // Testimonials
  createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial>;
  getTestimonials(approved?: boolean): Promise<Testimonial[]>;
  updateTestimonial(id: number, data: Partial<Testimonial>): Promise<Testimonial | undefined>;
  deleteTestimonial(id: number): Promise<boolean>;
  
  // Social Media Content
  createSocialMediaContent(content: InsertSocialMedia): Promise<SocialMedia>;
  getUserSocialMediaContent(userId: number): Promise<SocialMedia[]>;
  updateSocialMediaContent(id: number, data: Partial<SocialMedia>): Promise<SocialMedia | undefined>;
  deleteSocialMediaContent(id: number): Promise<boolean>;
  
  // Service Types
  createServiceType(service: InsertServiceType): Promise<ServiceType>;
  getServiceTypes(): Promise<ServiceType[]>;
  getServiceType(id: number): Promise<ServiceType | undefined>;
  updateServiceType(id: number, data: Partial<ServiceType>): Promise<ServiceType | undefined>;
  deleteServiceType(id: number): Promise<boolean>;
  
  // Invoices
  createInvoice(invoice: InsertInvoice): Promise<Invoice>;
  getInvoices(userId?: number, projectId?: number, status?: string): Promise<Invoice[]>;
  getInvoicesByPrefix(prefix: string): Promise<Invoice[]>;
  getInvoice(id: number): Promise<Invoice | undefined>;
  getInvoiceByNumber(number: string): Promise<Invoice | undefined>;
  updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined>;
  updateStripeInvoiceInfo(invoiceId: number, stripeInvoiceId: string, stripePaymentIntentId?: string): Promise<Invoice | undefined>;
  updatePayPalInvoiceInfo(invoiceId: number, paypalOrderId: string): Promise<Invoice | undefined>;
  markInvoiceAsPaid(id: number, paymentMethod: string, paymentDate?: Date): Promise<Invoice | undefined>;
  markInvoiceAsCancelled(id: number): Promise<Invoice | undefined>;
  markInvoiceAsOverdue(id: number): Promise<Invoice | undefined>;
  
  // Payment Records
  createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord>;
  getPaymentRecords(invoiceId?: number, userId?: number): Promise<PaymentRecord[]>;
  getPaymentRecord(id: number): Promise<PaymentRecord | undefined>;
  updatePaymentRecord(id: number, data: Partial<PaymentRecord>): Promise<PaymentRecord | undefined>;
  
  // PayPal related operations
  updatePayPalInvoiceInfo(invoiceId: number, paypalOrderId: string, paypalCaptureId?: string): Promise<Invoice | undefined>;
  updatePayPalOrderMetadata(orderId: string, metadata: any): Promise<boolean>;
  getPayPalOrderMetadata(orderId: string): Promise<any>;
  
  // Email related operations
  sendInvoiceEmail(invoice: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    description: string;
    paymentLink: string;
  }): Promise<boolean>;
  
  // User management (additional methods)
  
  // =======================
  // STAFF MANAGEMENT SYSTEM
  // =======================
  
  // AI Brief Submissions
  createAIBriefSubmission(submission: InsertAIBriefSubmission): Promise<AIBriefSubmission>;
  getAIBriefSubmissions(staffMemberId?: number, status?: string): Promise<AIBriefSubmission[]>;
  getAIBriefSubmission(id: number): Promise<AIBriefSubmission | undefined>;
  getAIBriefSubmissionBySubmissionId(submissionId: string): Promise<AIBriefSubmission | undefined>;
  updateAIBriefSubmission(id: number, data: Partial<AIBriefSubmission>): Promise<AIBriefSubmission | undefined>;
  deleteAIBriefSubmission(id: number): Promise<boolean>;
  generateUniqueSubmissionId(staffMemberId: number): string;
  
  // Email Tracking
  createStaffEmailTracking(tracking: InsertStaffEmailTracking): Promise<StaffEmailTracking>;
  getStaffEmailTracking(submissionId?: string, eventType?: string): Promise<StaffEmailTracking[]>;
  getEmailTrackingEvents(submissionId: string): Promise<StaffEmailTracking[]>;
  
  // Contact Page Visits
  createContactPageVisit(visit: InsertContactPageVisit): Promise<ContactPageVisit>;
  getContactPageVisits(submissionId?: string): Promise<ContactPageVisit[]>;
  updateContactPageVisit(id: number, data: Partial<ContactPageVisit>): Promise<ContactPageVisit | undefined>;
  generateUniqueVisitId(): string;
  
  // Performance Analytics
  createStaffPerformanceAnalytics(analytics: InsertStaffPerformanceAnalytics): Promise<StaffPerformanceAnalytics>;
  getStaffPerformanceAnalytics(staffMemberId?: number, period?: string, startDate?: Date, endDate?: Date): Promise<StaffPerformanceAnalytics[]>;
  updateStaffPerformanceAnalytics(id: number, data: Partial<StaffPerformanceAnalytics>): Promise<StaffPerformanceAnalytics | undefined>;
  updateDailyStaffMetrics(staffMemberId: number, date: Date): Promise<void>;
  getStaffDashboardData(staffMemberId: number): Promise<{
    totalBriefs: number;
    emailsSent: number;
    emailsOpened: number;
    contactPageVisits: number;
    conversionRate: number;
    recentSubmissions: AIBriefSubmission[];
  }>;
  
  // Session store
  sessionStore: SessionStore;
  
  // Database initialization (for PostgreSQL)
  initializeDatabase?(): Promise<void>;
  
  // Email Effectiveness Tracking
  updateEmailEffectiveness(submissionId: string, effective: number): Promise<void>;
  
  // Find submission by unique brief ID
  getAIBriefSubmissionByUniqueId(uniqueBriefId: string): Promise<AIBriefSubmission | undefined>;
}

/**
 * ============================================================================
 * LEGACY CODE - DO NOT USE
 * ============================================================================
 * 
 * MemStorage is LEGACY/DEAD CODE and is NEVER instantiated at runtime.
 * It exists only for historical reference and development testing.
 * 
 * ACTIVE SESSION STORE: PostgresStorage (line ~1493) using connect-pg-simple
 * ACTIVE EXPORT: export const storage = new PostgresStorage(); (line 3229)
 * 
 * This class is UNREACHABLE in any production or development execution path.
 * All imports of `storage` receive PostgresStorage exclusively.
 * 
 * DO NOT instantiate MemStorage - sessions will NOT persist across restarts.
 * ============================================================================
 */
export class MemStorage implements IStorage {
  private users: Map<number, User> = new Map();
  private contactSubmissions: Map<number, ContactSubmission> = new Map();
  private blogPosts: Map<number, BlogPost> = new Map();
  private projects: Map<number, Project> = new Map();
  private testimonials: Map<number, Testimonial> = new Map();
  private socialMediaContents: Map<number, SocialMedia> = new Map();
  private serviceTypes: Map<number, ServiceType> = new Map();
  private orders: Map<number, Order> = new Map();
  private orderItems: Map<number, OrderItem> = new Map();
  private projectMilestones: Map<number, ProjectMilestone> = new Map();
  private projectUpdates: Map<number, ProjectUpdate> = new Map();
  private projectComments: Map<number, ProjectComment> = new Map();
  private invoices: Map<number, Invoice> = new Map();
  private paymentRecords: Map<number, PaymentRecord> = new Map();
  
  currentUserId: number;
  currentContactId: number;
  currentBlogId: number;
  currentProjectId: number;
  currentTestimonialId: number;
  currentSocialMediaId: number;
  currentServiceTypeId: number;
  currentOrderId: number;
  currentOrderItemId: number;
  currentProjectMilestoneId: number;
  currentProjectUpdateId: number;
  currentProjectCommentId: number;
  currentPaymentRecordId: number;
  currentInvoiceId: number;
  
  sessionStore: SessionStore;

  constructor() {
    this.currentUserId = 1;
    this.currentContactId = 1;
    this.currentBlogId = 1;
    this.currentProjectId = 1;
    this.currentTestimonialId = 1;
    this.currentSocialMediaId = 1;
    this.currentServiceTypeId = 1;
    this.currentOrderId = 1;
    this.currentOrderItemId = 1;
    this.currentProjectMilestoneId = 1;
    this.currentProjectUpdateId = 1;
    this.currentProjectCommentId = 1;
    this.currentInvoiceId = 1;
    this.currentPaymentRecordId = 1;
    
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000, // prune expired entries every 24h
    });
    
    // Initialize with default service types
    this.initializeServices();
    this.initializeTestimonials();
  }
  
  // This is a no-op for in-memory storage as initialization is done in constructor
  async initializeDatabase(): Promise<void> {
    console.log("In-memory storage already initialized");
    return Promise.resolve();
  }

  // Initialize default services
  private initializeServices() {
    const services = [
      {
        name: "Web Design",
        nameEs: "Diseño Web",
        description: "Custom responsive websites that attract and convert visitors with modern designs.",
        descriptionEs: "Sitios web responsivos personalizados que atraen y convierten visitantes con diseños modernos.",
        price: 500,
        features: JSON.stringify(["Responsive design", "SEO optimization", "Modern UI/UX"]),
        featuresEs: JSON.stringify(["Diseño responsivo", "Optimización SEO", "UI/UX moderno"]),
        icon: "laptop-code",
        sortOrder: 1
      },
      {
        name: "Automation",
        nameEs: "Automatización",
        description: "Streamline your business processes with AI-powered automation solutions.",
        descriptionEs: "Optimice sus procesos de negocio con soluciones de automatización impulsadas por IA.",
        price: 899,
        features: JSON.stringify(["Workflow automation", "AI integrations", "Business analytics"]),
        featuresEs: JSON.stringify(["Automatización de flujos", "Integraciones con IA", "Análisis de negocio"]),
        icon: "robot",
        sortOrder: 2
      },
      {
        name: "Branding",
        nameEs: "Branding",
        description: "Create a memorable brand identity that resonates with your target audience.",
        descriptionEs: "Cree una identidad de marca memorable que resuene con su público objetivo.",
        price: 800,
        features: JSON.stringify(["Logo design", "Brand strategy", "Marketing materials"]),
        featuresEs: JSON.stringify(["Diseño de logo", "Estrategia de marca", "Materiales de marketing"]),
        icon: "paint-brush",
        sortOrder: 3
      },
      {
        name: "Social Media Marketing",
        nameEs: "Marketing en Redes Sociales",
        description: "Engage with your audience through strategic social media marketing campaigns on Facebook, Instagram, WhatsApp, and LinkedIn.",
        descriptionEs: "Conecte con su audiencia a través de campañas estratégicas de marketing en redes sociales en Facebook, Instagram, WhatsApp y LinkedIn.",
        price: 499,
        features: JSON.stringify(["Facebook marketing", "Instagram content", "WhatsApp campaigns", "LinkedIn strategy"]),
        featuresEs: JSON.stringify(["Marketing en Facebook", "Contenido para Instagram", "Campañas en WhatsApp", "Estrategia para LinkedIn"]),
        icon: "share-alt",
        sortOrder: 4
      },
      {
        name: "Accounting",
        nameEs: "Contabilidad",
        description: "Professional accounting services to help manage your business finances effectively.",
        descriptionEs: "Servicios de contabilidad profesionales para ayudar a gestionar las finanzas de su negocio de manera efectiva.",
        price: 700,
        features: JSON.stringify(["Bookkeeping", "Tax preparation", "Financial reporting", "Business consulting"]),
        featuresEs: JSON.stringify(["Teneduría de libros", "Preparación de impuestos", "Informes financieros", "Consultoría empresarial"]),
        icon: "calculator",
        sortOrder: 5
      }
    ];
    
    services.forEach(service => {
      this.createServiceType(service as any);
    });
  }
  
  // Initialize default testimonials
  private initializeTestimonials() {
    const testimonials = [
      {
        name: "Sarah Johnson",
        position: "Fitness Studio Owner",
        company: "Fit Life Studio",
        content: "TOBAIS transformed our online presence completely. Our website now perfectly represents our brand, and the automation tools they implemented have saved us countless hours on administrative tasks.",
        contentEs: "TOBAIS transformó completamente nuestra presencia en línea. Nuestro sitio web ahora representa perfectamente nuestra marca, y las herramientas de automatización que implementaron nos han ahorrado incontables horas en tareas administrativas.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      },
      {
        name: "Miguel Ramirez",
        position: "Restaurant Owner",
        company: "Sabores Auténticos",
        content: "Working with TOBAIS was a game-changer for our restaurant. Their bilingual website design helped us reach a broader audience, and their online ordering system increased our sales by 40%.",
        contentEs: "Trabajar con TOBAIS cambió las reglas del juego para nuestro restaurante. Su diseño web bilingüe nos ayudó a llegar a una audiencia más amplia, y su sistema de pedidos en línea aumentó nuestras ventas en un 40%.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      },
      {
        name: "Amanda Chen",
        position: "E-commerce Entrepreneur",
        company: "StyleBox",
        content: "The branding package from TOBAIS helped us establish a strong identity in a competitive market. Their attention to detail and strategic approach to our digital presence exceeded our expectations.",
        contentEs: "El paquete de branding de TOBAIS nos ayudó a establecer una identidad fuerte en un mercado competitivo. Su atención al detalle y enfoque estratégico de nuestra presencia digital superó nuestras expectativas.",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      }
    ];
    
    testimonials.forEach(testimonial => {
      this.createTestimonial(testimonial as any);
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username.toLowerCase() === username.toLowerCase()
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email.toLowerCase() === email.toLowerCase()
    );
  }
  
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const user: User = { 
      ...insertUser, 
      id, 
      language: insertUser.language ?? 'en',
      role: "user", 
      isActive: true, 
      createdAt: now
    };
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const user = await this.getUser(id);
    if (!user) return undefined;
    
    const updatedUser = { ...user, ...data };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async deleteUser(id: number): Promise<boolean> {
    return this.users.delete(id);
  }
  
  async getAllAdminUsers(): Promise<User[]> {
    return Array.from(this.users.values())
      .filter(user => user.role === "admin" || user.role === "superadmin");
  }

  // Auth token operations
  async setResetPasswordToken(userId: number, token: string, expiry: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.resetPasswordToken = token;
      user.resetPasswordTokenExpiry = expiry;
    }
  }

  async setVerificationToken(userId: number, token: string, expiry: Date): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.verificationToken = token;
      user.verificationTokenExpiry = expiry;
    }
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.resetPasswordToken === token) {
        return user;
      }
    }
    return undefined;
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.verificationToken === token) {
        return user;
      }
    }
    return undefined;
  }

  async clearResetPasswordToken(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.resetPasswordToken = null;
      user.resetPasswordTokenExpiry = null;
    }
  }

  async clearVerificationToken(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
    }
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.emailVerified = true;
      user.verificationToken = null;
      user.verificationTokenExpiry = null;
    }
  }
  
  async createAdminUser(user: InsertUser & { adminLevel?: number, permissions?: string[] }): Promise<User> {
    const id = this.currentUserId++;
    const now = new Date();
    const adminUser: User = { 
      ...user, 
      id, 
      language: user.language ?? 'en',
      role: "admin", 
      adminLevel: user.adminLevel ?? 1,
      permissions: user.permissions ?? [],
      isActive: true, 
      createdAt: now
    };
    this.users.set(id, adminUser);
    return adminUser;
  }
  
  // Contact submissions
  async createContactSubmission(submission: InsertContact): Promise<ContactSubmission> {
    const id = this.currentContactId++;
    const now = new Date();
    const contactSubmission: ContactSubmission = {
      ...submission,
      id,
      serviceId: submission.serviceId || null,
      createdAt: now,
      resolved: false
    };
    this.contactSubmissions.set(id, contactSubmission);
    return contactSubmission;
  }
  
  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return Array.from(this.contactSubmissions.values()).sort((a, b) => 
      b.createdAt.getTime() - a.createdAt.getTime()
    );
  }
  
  async getContactSubmission(id: number): Promise<ContactSubmission | undefined> {
    return this.contactSubmissions.get(id);
  }
  
  async updateContactSubmission(id: number, data: Partial<ContactSubmission>): Promise<ContactSubmission | undefined> {
    const submission = await this.getContactSubmission(id);
    if (!submission) return undefined;
    
    const updatedSubmission = { ...submission, ...data };
    this.contactSubmissions.set(id, updatedSubmission);
    return updatedSubmission;
  }
  
  // Blog posts
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const id = this.currentBlogId++;
    const now = new Date();
    
    // Destructure to remove the fields we'll explicitly set
    const { 
      titleEs, contentEs, authorId, published, featuredImage,
      ...otherProps 
    } = post;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const blogPost: BlogPost = {
      ...otherProps,
      id,
      titleEs: titleEs ?? null,
      contentEs: contentEs ?? null,
      authorId: authorId ?? null,
      published: published ?? null,
      featuredImage: featuredImage ?? null,
      createdAt: now
    };
    this.blogPosts.set(id, blogPost);
    return blogPost;
  }
  
  async getBlogPosts(limit?: number, published?: boolean): Promise<BlogPost[]> {
    let posts = Array.from(this.blogPosts.values());
    
    if (published !== undefined) {
      posts = posts.filter(post => post.published === published);
    }
    
    posts = posts.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    
    if (limit) {
      posts = posts.slice(0, limit);
    }
    
    return posts;
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    return this.blogPosts.get(id);
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    return Array.from(this.blogPosts.values()).find(post => post.slug === slug);
  }
  
  async updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const post = await this.getBlogPost(id);
    if (!post) return undefined;
    
    const updatedPost = { ...post, ...data };
    this.blogPosts.set(id, updatedPost);
    return updatedPost;
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    return this.blogPosts.delete(id);
  }
  
  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    const id = this.currentProjectId++;
    
    // Destructure to remove the fields we'll explicitly set
    const { 
      status, descriptionEs, titleEs, clientId, startDate, endDate, 
      image, featured,
      ...otherProps 
    } = project;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const projectData: Project = {
      ...otherProps,
      id,
      status: status ?? null,
      descriptionEs: descriptionEs ?? null,
      titleEs: titleEs ?? null,
      clientId: clientId ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      image: image ?? null,
      featured: featured ?? null
    };
    this.projects.set(id, projectData);
    return projectData;
  }
  
  async getProjects(featured?: boolean): Promise<Project[]> {
    let projectList = Array.from(this.projects.values());
    
    if (featured !== undefined) {
      projectList = projectList.filter(project => project.featured === featured);
    }
    
    return projectList;
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }
  
  async getClientProjects(clientId: number): Promise<Project[]> {
    return Array.from(this.projects.values())
      .filter(project => project.clientId === clientId);
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const project = await this.getProject(id);
    if (!project) return undefined;
    
    const updatedProject = { ...project, ...data };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }
  
  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }
  
  // Testimonials
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    const id = this.currentTestimonialId++;
    // Destructure to remove the fields we'll explicitly set
    const { 
      contentEs, image, position, company, rating, approved,
      ...otherProps 
    } = testimonial;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const testimonialData: Testimonial = {
      ...otherProps,
      id,
      contentEs: contentEs ?? null,
      image: image ?? null,
      position: position ?? null,
      company: company ?? null,
      rating: rating ?? 5,
      approved: approved ?? false
    };
    this.testimonials.set(id, testimonialData);
    return testimonialData;
  }
  
  async getTestimonials(approved?: boolean): Promise<Testimonial[]> {
    let testimonialList = Array.from(this.testimonials.values());
    
    if (approved !== undefined) {
      testimonialList = testimonialList.filter(testimonial => testimonial.approved === approved);
    }
    
    return testimonialList;
  }
  
  async updateTestimonial(id: number, data: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const testimonial = this.testimonials.get(id);
    if (!testimonial) return undefined;
    
    const updatedTestimonial = { ...testimonial, ...data };
    this.testimonials.set(id, updatedTestimonial);
    return updatedTestimonial;
  }
  
  async deleteTestimonial(id: number): Promise<boolean> {
    return this.testimonials.delete(id);
  }
  
  // Social Media Content
  async createSocialMediaContent(content: InsertSocialMedia): Promise<SocialMedia> {
    const id = this.currentSocialMediaId++;
    const now = new Date();
    
    // Destructure to remove the fields we'll explicitly set
    const { 
      contentEs, image, userId, scheduled, scheduledDate, aiGenerated, metadata,
      ...otherProps 
    } = content;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const socialMediaContent: SocialMedia = {
      ...otherProps,
      id,
      createdAt: now,
      contentEs: contentEs ?? null,
      image: image ?? null,
      userId: userId ?? null,
      scheduled: scheduled ?? null,
      scheduledDate: scheduledDate ?? null,
      aiGenerated: aiGenerated ?? null,
      metadata: metadata ?? null
    };
    this.socialMediaContents.set(id, socialMediaContent);
    return socialMediaContent;
  }
  
  async getUserSocialMediaContent(userId: number): Promise<SocialMedia[]> {
    return Array.from(this.socialMediaContents.values())
      .filter(content => content.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async updateSocialMediaContent(id: number, data: Partial<SocialMedia>): Promise<SocialMedia | undefined> {
    const content = this.socialMediaContents.get(id);
    if (!content) return undefined;
    
    const updatedContent = { ...content, ...data };
    this.socialMediaContents.set(id, updatedContent);
    return updatedContent;
  }
  
  async deleteSocialMediaContent(id: number): Promise<boolean> {
    return this.socialMediaContents.delete(id);
  }
  
  // Service Types
  async createServiceType(service: InsertServiceType): Promise<ServiceType> {
    const id = this.currentServiceTypeId++;
    // Destructure to remove the fields we'll explicitly set
    const { 
      nameEs, descriptionEs, features, featuresEs, icon, sortOrder, 
      ...otherProps 
    } = service;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const serviceType: ServiceType = {
      ...otherProps,
      id,
      nameEs: nameEs ?? null,
      descriptionEs: descriptionEs ?? null,
      features: features ?? null,
      featuresEs: featuresEs ?? null,
      icon: icon ?? null,
      sortOrder: sortOrder ?? null
    };
    this.serviceTypes.set(id, serviceType);
    return serviceType;
  }
  
  async getServiceTypes(): Promise<ServiceType[]> {
    return Array.from(this.serviceTypes.values())
      .sort((a, b) => {
        // Handle null values safely
        const sortOrderA = a.sortOrder ?? 0;
        const sortOrderB = b.sortOrder ?? 0;
        return sortOrderA - sortOrderB;
      });
  }
  
  async getServiceType(id: number): Promise<ServiceType | undefined> {
    return this.serviceTypes.get(id);
  }
  
  async updateServiceType(id: number, data: Partial<ServiceType>): Promise<ServiceType | undefined> {
    const service = this.serviceTypes.get(id);
    if (!service) return undefined;
    
    const updatedService = { ...service, ...data };
    this.serviceTypes.set(id, updatedService);
    return updatedService;
  }
  
  async deleteServiceType(id: number): Promise<boolean> {
    return this.serviceTypes.delete(id);
  }
  
  // Invoice operations
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    const id = this.currentInvoiceId++;
    const now = new Date();
    
    // Ensure required fields have default values if not provided
    const status = invoice.status || "pending";
    const projectId = invoice.projectId || null;
    const notes = invoice.notes || null;
    const paymentMethod = invoice.paymentMethod || "";
    const stripeInvoiceId = invoice.stripeInvoiceId || null;
    const stripePaymentIntentId = invoice.stripePaymentIntentId || null;
    const paypalOrderId = invoice.paypalOrderId || null;
    const items = invoice.items || null;
    const metadata = invoice.metadata || null;
    const tax = invoice.tax || 0;
    const discount = invoice.discount || 0;
    const paymentDate = invoice.paymentDate || null;
    
    const invoiceData: Invoice = {
      ...invoice,
      id,
      status,
      projectId,
      notes,
      paymentMethod,
      stripeInvoiceId,
      stripePaymentIntentId,
      paypalOrderId,
      items,
      metadata,
      tax,
      discount,
      paymentDate,
      createdAt: now,
      updatedAt: now
    };
    
    this.invoices.set(id, invoiceData);
    return invoiceData;
  }
  
  async getInvoices(userId?: number, projectId?: number, status?: string): Promise<Invoice[]> {
    try {
      console.log(`Buscando facturas con los filtros: userId=${userId || 'todos'}, projectId=${projectId || 'todos'}, status=${status || 'todos'}`);
      
      // Consulta SQL con DISTINCT para eliminar duplicados
      const sql = `
        SELECT DISTINCT ON (i.id) i.* 
        FROM invoices i
        LEFT JOIN projects p ON i.project_id = p.id
        LEFT JOIN project_users pu ON p.id = pu.project_id
        WHERE 1=1
        ${userId !== undefined ? `AND (i.user_id = $1 OR pu.user_id = $1 OR p.client_id = $1 OR p.user_id = $1)` : ''}
        ${projectId !== undefined ? `AND i.project_id = $${userId !== undefined ? 2 : 1}` : ''}
        ${status !== undefined ? `AND i.status = $${
          (userId !== undefined ? 1 : 0) + 
          (projectId !== undefined ? 1 : 0) + 
          1
        }` : ''}
        ORDER BY i.id, i.created_at DESC
      `;
      
      // Preparar los parámetros para la consulta
      const params = [];
      if (userId !== undefined) params.push(userId);
      if (projectId !== undefined) params.push(projectId);
      if (status !== undefined) params.push(status);
      
      // Ejecutar la consulta SQL directa
      let result;
      
      if (params.length > 0) {
        result = await this.db.execute(sql, params);
      } else {
        result = await this.db.execute(sql);
      }
      
      console.log(`Encontradas ${result.length} facturas únicas en la base de datos`);
      
      // Hacer log detallado de cada factura encontrada
      if (result.length > 0) {
        console.log("Detalles de facturas encontradas:");
        result.forEach(inv => {
          console.log(`- ID=${inv.id}, Número=${inv.number}, Total=${inv.total}$, Estado=${inv.status}, Usuario=${inv.user_id}, Proyecto=${inv.project_id || 'N/A'}`);
        });
      }
      
      return result;
    } catch (error) {
      console.error("Error al obtener facturas de la base de datos:", error);
      console.log("Devolviendo array vacío debido al error");
      return [];
    }
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      // First try to get it from the database
      const [dbInvoice] = await this.db
        .select()
        .from(invoices)
        .where(eq(invoices.id, id));
      
      if (dbInvoice) {
        console.log(`Found invoice ${id} in database`);
        return dbInvoice;
      }
      
      // Fallback to in-memory if not in DB
      console.log(`Invoice ${id} not found in database, checking in-memory`);
      return this.invoices.get(id);
    } catch (error) {
      console.error(`Error fetching invoice ${id} from database:`, error);
      // Fallback to in-memory
      return this.invoices.get(id);
    }
  }
  
  async getInvoiceByNumber(number: string): Promise<Invoice | undefined> {
    try {
      // First try to get it from the database
      const [dbInvoice] = await this.db
        .select()
        .from(invoices)
        .where(eq(invoices.number, number));
      
      if (dbInvoice) {
        console.log(`Found invoice number ${number} in database`);
        return dbInvoice;
      }
      
      // Fallback to in-memory if not in DB
      console.log(`Invoice number ${number} not found in database, checking in-memory`);
      return Array.from(this.invoices.values()).find(invoice => invoice.number === number);
    } catch (error) {
      console.error(`Error fetching invoice number ${number} from database:`, error);
      // Fallback to in-memory
      return Array.from(this.invoices.values()).find(invoice => invoice.number === number);
    }
  }
  
  
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      ...data, 
      updatedAt: now 
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async updateStripeInvoiceInfo(invoiceId: number, stripeInvoiceId: string, stripePaymentIntentId?: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return undefined;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      stripeInvoiceId, 
      stripePaymentIntentId: stripePaymentIntentId || invoice.stripePaymentIntentId,
      updatedAt: now 
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
    return updatedInvoice;
  }
  
  async updatePayPalInvoiceInfo(invoiceId: number, paypalOrderId: string, paypalCaptureId?: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return undefined;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      paypalOrderId,
      paypalCaptureId: paypalCaptureId || null,
      updatedAt: now 
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
    return updatedInvoice;
  }
  
  async markInvoiceAsPaid(id: number, paymentMethod: string, paymentDate?: Date): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      status: "paid",
      paymentMethod,
      paymentDate: paymentDate || now,
      updatedAt: now 
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async getInvoiceByNumber(number: string): Promise<Invoice | undefined> {
    try {
      // First try to get it from the database
      const [dbInvoice] = await this.db
        .select()
        .from(invoices)
        .where(eq(invoices.number, number));
      
      if (dbInvoice) {
        console.log(`Found invoice number ${number} in database`);
        return dbInvoice;
      }
      
      // Fallback to in-memory if not in DB
      console.log(`Invoice number ${number} not found in database, checking in-memory`);
      return Array.from(this.invoices.values()).find(invoice => invoice.number === number);
    } catch (error) {
      console.error(`Error fetching invoice number ${number} from database:`, error);
      // Fallback to in-memory
      return Array.from(this.invoices.values()).find(invoice => invoice.number === number);
    }
  }
  
  async markInvoiceAsCancelled(id: number): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      status: "cancelled",
      updatedAt: now 
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  async markInvoiceAsOverdue(id: number): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(id);
    if (!invoice) return undefined;
    
    // Solo marcar como vencida si está pendiente
    if (invoice.status !== "pending") return invoice;
    
    const now = new Date();
    const updatedInvoice = { 
      ...invoice, 
      status: "overdue",
      updatedAt: now 
    };
    
    this.invoices.set(id, updatedInvoice);
    return updatedInvoice;
  }
  
  
  async updatePayPalInvoiceInfo(invoiceId: number, paypalOrderId: string, paypalCaptureId?: string): Promise<Invoice | undefined> {
    const invoice = await this.getInvoice(invoiceId);
    if (!invoice) return undefined;
    
    const now = new Date();
    const metadata = invoice.metadata ? JSON.parse(invoice.metadata.toString()) : {};
    
    // Añadir información de captura de PayPal al metadata
    if (paypalCaptureId) {
      metadata.paypalCaptureId = paypalCaptureId;
    }
    
    const updatedInvoice = { 
      ...invoice, 
      paypalOrderId,
      metadata: JSON.stringify(metadata),
      updatedAt: now 
    };
    
    this.invoices.set(invoiceId, updatedInvoice);
    return updatedInvoice;
  }
  
  // Email operations
  async sendInvoiceEmail(invoice: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    description: string;
    paymentLink: string;
  }): Promise<boolean> {
    try {
      // Implementación simplificada para MemStorage, en producción
      // esto llamaría a la función correspondiente en email.ts
      console.log(`[EMAIL] Factura ${invoice.invoiceNumber} enviada a ${invoice.to}`);
      return true;
    } catch (error) {
      console.error("Error sending invoice email:", error);
      return false;
    }
  }
  
  // User operations (complementario)
  async getUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }
  
  // Payment Records operations
  async createPaymentRecord(payment: InsertPaymentRecord): Promise<PaymentRecord> {
    const id = this.currentPaymentRecordId++;
    const now = new Date();
    
    // Ensure required fields have default values
    const status = payment.status || "completed";
    const metadata = payment.metadata || null;
    const paymentDate = payment.paymentDate || now;
    const transactionId = payment.transactionId || null;
    
    const paymentData: PaymentRecord = {
      ...payment,
      id,
      status,
      metadata,
      paymentDate,
      transactionId,
      createdAt: now
    };
    
    this.paymentRecords.set(id, paymentData);
    return paymentData;
  }
  
  async getPaymentRecords(invoiceId?: number, userId?: number): Promise<PaymentRecord[]> {
    let payments = Array.from(this.paymentRecords.values());
    
    if (invoiceId !== undefined) {
      payments = payments.filter(payment => payment.invoiceId === invoiceId);
    }
    
    if (userId !== undefined) {
      payments = payments.filter(payment => payment.userId === userId);
    }
    
    return payments.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getPaymentRecord(id: number): Promise<PaymentRecord | undefined> {
    return this.paymentRecords.get(id);
  }
  
  async updatePaymentRecord(id: number, data: Partial<PaymentRecord>): Promise<PaymentRecord | undefined> {
    const payment = await this.getPaymentRecord(id);
    if (!payment) return undefined;
    
    const updatedPayment = { ...payment, ...data };
    this.paymentRecords.set(id, updatedPayment);
    return updatedPayment;
  }
  
  // Project Milestones
  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    const id = this.currentProjectMilestoneId++;
    const { titleEs, description, descriptionEs, dueDate, completedAt, status, sortOrder, ...otherProps } = milestone;
    
    const milestoneData: ProjectMilestone = {
      ...otherProps,
      id,
      titleEs: titleEs ?? null,
      description: description ?? null,
      descriptionEs: descriptionEs ?? null,
      dueDate: dueDate ?? null,
      completedAt: completedAt ?? null,
      status: status ?? "pending",
      sortOrder: sortOrder ?? 0
    };
    
    this.projectMilestones.set(id, milestoneData);
    return milestoneData;
  }
  
  async getProjectMilestones(projectId: number): Promise<ProjectMilestone[]> {
    return Array.from(this.projectMilestones.values())
      .filter(milestone => milestone.projectId === projectId)
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  }
  
  async getProjectMilestone(id: number): Promise<ProjectMilestone | undefined> {
    return this.projectMilestones.get(id);
  }
  
  async updateProjectMilestone(id: number, data: Partial<ProjectMilestone>): Promise<ProjectMilestone | undefined> {
    const milestone = await this.getProjectMilestone(id);
    if (!milestone) return undefined;
    
    const updatedMilestone = { ...milestone, ...data };
    this.projectMilestones.set(id, updatedMilestone);
    return updatedMilestone;
  }
  
  async deleteProjectMilestone(id: number): Promise<boolean> {
    return this.projectMilestones.delete(id);
  }
  
  // Project Updates
  async createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate> {
    const id = this.currentProjectUpdateId++;
    const now = new Date();
    
    const { contentEs, attachments, isPublic, ...otherProps } = update;
    
    const updateData: ProjectUpdate = {
      ...otherProps,
      id,
      contentEs: contentEs ?? null,
      attachments: attachments ?? null,
      isPublic: isPublic ?? true,
      createdAt: now
    };
    
    this.projectUpdates.set(id, updateData);
    return updateData;
  }
  
  async getProjectUpdates(projectId: number, publicOnly?: boolean): Promise<ProjectUpdate[]> {
    let updates = Array.from(this.projectUpdates.values())
      .filter(update => update.projectId === projectId);
    
    if (publicOnly) {
      updates = updates.filter(update => update.isPublic);
    }
    
    return updates.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getProjectUpdate(id: number): Promise<ProjectUpdate | undefined> {
    return this.projectUpdates.get(id);
  }
  
  async updateProjectUpdate(id: number, data: Partial<ProjectUpdate>): Promise<ProjectUpdate | undefined> {
    const update = await this.getProjectUpdate(id);
    if (!update) return undefined;
    
    const updatedUpdate = { ...update, ...data };
    this.projectUpdates.set(id, updatedUpdate);
    return updatedUpdate;
  }
  
  async deleteProjectUpdate(id: number): Promise<boolean> {
    return this.projectUpdates.delete(id);
  }
  
  // Project Comments
  async createProjectComment(comment: InsertProjectComment): Promise<ProjectComment> {
    const id = this.currentProjectCommentId++;
    const now = new Date();
    
    const { attachments, ...otherProps } = comment;
    
    const commentData: ProjectComment = {
      ...otherProps,
      id,
      attachments: attachments ?? null,
      createdAt: now
    };
    
    this.projectComments.set(id, commentData);
    return commentData;
  }
  
  async getProjectComments(projectId: number): Promise<ProjectComment[]> {
    return Array.from(this.projectComments.values())
      .filter(comment => comment.projectId === projectId)
      .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }
  
  async getProjectComment(id: number): Promise<ProjectComment | undefined> {
    return this.projectComments.get(id);
  }
  
  async updateProjectComment(id: number, data: Partial<ProjectComment>): Promise<ProjectComment | undefined> {
    const comment = await this.getProjectComment(id);
    if (!comment) return undefined;
    
    const updatedComment = { ...comment, ...data };
    this.projectComments.set(id, updatedComment);
    return updatedComment;
  }
  
  async deleteProjectComment(id: number): Promise<boolean> {
    return this.projectComments.delete(id);
  }
  
  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    const id = this.currentOrderId++;
    const now = new Date();
    
    const { status, stripePaymentId, stripeCustomerId, notes, shippingAddress, paymentMethod, discountCode, discountAmount, ...otherProps } = order;
    
    const orderData: Order = {
      ...otherProps,
      id,
      status: status ?? "pending",
      createdAt: now,
      updatedAt: now,
      stripePaymentId: stripePaymentId ?? null,
      stripeCustomerId: stripeCustomerId ?? null,
      notes: notes ?? null,
      shippingAddress: shippingAddress ?? null,
      paymentMethod: paymentMethod ?? "stripe",
      discountCode: discountCode ?? null,
      discountAmount: discountAmount ?? 0
    };
    
    this.orders.set(id, orderData);
    return orderData;
  }
  
  async getOrders(userId?: number, status?: string): Promise<Order[]> {
    let orders = Array.from(this.orders.values());
    
    if (userId !== undefined) {
      orders = orders.filter(order => order.userId === userId);
    }
    
    if (status !== undefined) {
      orders = orders.filter(order => order.status === status);
    }
    
    return orders.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    return this.orders.get(id);
  }
  
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    const order = await this.getOrder(id);
    if (!order) return undefined;
    
    const updatedOrder = { ...order, ...data, updatedAt: new Date() };
    this.orders.set(id, updatedOrder);
    return updatedOrder;
  }
  
  async updateStripeInfo(userId: number, stripeCustomerId: string, orderId: number, stripePaymentId: string): Promise<Order | undefined> {
    const order = await this.getOrder(orderId);
    if (!order) return undefined;
    
    const updatedOrder = { 
      ...order, 
      stripeCustomerId, 
      stripePaymentId,
      status: "paid",
      updatedAt: new Date() 
    };
    
    this.orders.set(orderId, updatedOrder);
    return updatedOrder;
  }
  
  // Order Items
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    const id = this.currentOrderItemId++;
    
    const { quantity, description, ...otherProps } = item;
    
    const itemData: OrderItem = {
      ...otherProps,
      id,
      quantity: quantity ?? 1,
      description: description ?? null
    };
    
    this.orderItems.set(id, itemData);
    return itemData;
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    return Array.from(this.orderItems.values())
      .filter(item => item.orderId === orderId);
  }
  
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    return this.orderItems.get(id);
  }
  
  async updateOrderItem(id: number, data: Partial<OrderItem>): Promise<OrderItem | undefined> {
    const item = await this.getOrderItem(id);
    if (!item) return undefined;
    
    const updatedItem = { ...item, ...data };
    this.orderItems.set(id, updatedItem);
    return updatedItem;
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    return this.orderItems.delete(id);
  }
}

/**
 * PostgreSQL implementation of storage using Drizzle ORM
 */
export class PostgresStorage implements IStorage {
  db: ReturnType<typeof drizzle>;
  sessionStore: SessionStore;
  
  constructor() {
    if (!process.env.DATABASE_URL) {
      throw new Error("DATABASE_URL environment variable is required");
    }
    
    // Initialize PostgreSQL client
    const sqlClient = postgres(process.env.DATABASE_URL);
    this.db = drizzle(sqlClient);
    
    // Initialize session store
    const PgSessionStore = pgSimpleModule(session);
    this.sessionStore = new PgSessionStore({
      conObject: {
        connectionString: process.env.DATABASE_URL,
      },
      createTableIfMissing: true,
    });
    
    console.log("PostgreSQL connection established successfully");
  }

  async initializeDatabase(): Promise<void> {
    console.log("Initializing database...");
    
    try {
      // Check if we have any service types, if not, initialize sample data
      const existingServices = await this.getServiceTypes();
      if (existingServices.length === 0) {
        console.log("Initializing services...");
        await this.initializeServices();
      }
      
      // Check if we have any testimonials, if not, initialize sample data
      const existingTestimonials = await this.getTestimonials();
      if (existingTestimonials.length === 0) {
        console.log("Initializing testimonials...");
        await this.initializeTestimonials();
      }
      
      console.log("Database initialization complete");
    } catch (error) {
      console.error("Error initializing database:", error);
    }
  }

  // Initialize default services
  private async initializeServices() {    
    const services = [
      {
        name: "Web Design",
        nameEs: "Diseño Web",
        description: "Custom responsive websites that attract and convert visitors with modern designs.",
        descriptionEs: "Sitios web responsivos personalizados que atraen y convierten visitantes con diseños modernos.",
        price: 500,
        features: JSON.stringify(["Responsive design", "SEO optimization", "Modern UI/UX"]),
        featuresEs: JSON.stringify(["Diseño responsivo", "Optimización SEO", "UI/UX moderno"]),
        icon: "laptop-code",
        sortOrder: 1
      },
      {
        name: "Automation",
        nameEs: "Automatización",
        description: "Streamline your business processes with AI-powered automation solutions.",
        descriptionEs: "Optimice sus procesos de negocio con soluciones de automatización impulsadas por IA.",
        price: 899,
        features: JSON.stringify(["Workflow automation", "AI integrations", "Business analytics"]),
        featuresEs: JSON.stringify(["Automatización de flujos", "Integraciones con IA", "Análisis de negocio"]),
        icon: "robot",
        sortOrder: 2
      },
      {
        name: "Branding",
        nameEs: "Branding",
        description: "Create a memorable brand identity that resonates with your target audience.",
        descriptionEs: "Cree una identidad de marca memorable que resuene con su público objetivo.",
        price: 800,
        features: JSON.stringify(["Logo design", "Brand strategy", "Marketing materials"]),
        featuresEs: JSON.stringify(["Diseño de logo", "Estrategia de marca", "Materiales de marketing"]),
        icon: "paint-brush",
        sortOrder: 3
      },
      {
        name: "Social Media Marketing",
        nameEs: "Marketing en Redes Sociales",
        description: "Engage with your audience through strategic social media marketing campaigns on Facebook, Instagram, WhatsApp, and LinkedIn.",
        descriptionEs: "Conecte con su audiencia a través de campañas estratégicas de marketing en redes sociales en Facebook, Instagram, WhatsApp y LinkedIn.",
        price: 499,
        features: JSON.stringify(["Facebook marketing", "Instagram content", "WhatsApp campaigns", "LinkedIn strategy"]),
        featuresEs: JSON.stringify(["Marketing en Facebook", "Contenido para Instagram", "Campañas en WhatsApp", "Estrategia para LinkedIn"]),
        icon: "share-alt",
        sortOrder: 4
      },
      {
        name: "Accounting",
        nameEs: "Contabilidad",
        description: "Professional accounting services to help manage your business finances effectively.",
        descriptionEs: "Servicios de contabilidad profesionales para ayudar a gestionar las finanzas de su negocio de manera efectiva.",
        price: 700,
        features: JSON.stringify(["Bookkeeping", "Tax preparation", "Financial reporting", "Business consulting"]),
        featuresEs: JSON.stringify(["Teneduría de libros", "Preparación de impuestos", "Informes financieros", "Consultoría empresarial"]),
        icon: "calculator",
        sortOrder: 5
      }
    ];
    
    for (const service of services) {
      await this.createServiceType(service as any);
    }
  }
  
  // Initialize default testimonials
  private async initializeTestimonials() {
    const testimonials = [
      {
        name: "Sarah Johnson",
        position: "Fitness Studio Owner",
        company: "Fit Life Studio",
        content: "TOBAIS transformed our online presence completely. Our website now perfectly represents our brand, and the automation tools they implemented have saved us countless hours on administrative tasks.",
        contentEs: "TOBAIS transformó completamente nuestra presencia en línea. Nuestro sitio web ahora representa perfectamente nuestra marca, y las herramientas de automatización que implementaron nos han ahorrado incontables horas en tareas administrativas.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1580489944761-15a19d654956?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      },
      {
        name: "Miguel Ramirez",
        position: "Restaurant Owner",
        company: "Sabores Auténticos",
        content: "Working with TOBAIS was a game-changer for our restaurant. Their bilingual website design helped us reach a broader audience, and their online ordering system increased our sales by 40%.",
        contentEs: "Trabajar con TOBAIS cambió las reglas del juego para nuestro restaurante. Su diseño web bilingüe nos ayudó a llegar a una audiencia más amplia, y su sistema de pedidos en línea aumentó nuestras ventas en un 40%.",
        rating: 5,
        image: "https://images.unsplash.com/photo-1566492031773-4f4e44671857?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      },
      {
        name: "Amanda Chen",
        position: "E-commerce Entrepreneur",
        company: "StyleBox",
        content: "The branding package from TOBAIS helped us establish a strong identity in a competitive market. Their attention to detail and strategic approach to our digital presence exceeded our expectations.",
        contentEs: "El paquete de branding de TOBAIS nos ayudó a establecer una identidad fuerte en un mercado competitivo. Su atención al detalle y enfoque estratégico de nuestra presencia digital superó nuestras expectativas.",
        rating: 4.5,
        image: "https://images.unsplash.com/photo-1573497019940-1c28c88b4f3e?ixlib=rb-4.0.3&auto=format&fit=crop&w=100&q=80",
        approved: true
      }
    ];
    
    for (const testimonial of testimonials) {
      await this.createTestimonial(testimonial as any);
    }
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.username, username));
    return result[0];
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async createUser(insertUser: InsertUser & {
    emailVerified?: boolean;
    verificationToken?: string;
    verificationTokenExpiry?: Date;
  }): Promise<User> {
    const now = new Date();
    
    const userData = {
      ...insertUser,
      firstName: insertUser.firstName ?? null,
      lastName: insertUser.lastName ?? null,
      language: insertUser.language ?? 'en',
      role: "user",
      isActive: true,
      createdAt: now,
      emailVerified: insertUser.emailVerified ?? false,
      verificationToken: insertUser.verificationToken ?? null,
      verificationTokenExpiry: insertUser.verificationTokenExpiry ?? null
    };
    
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }
  
  async updateUser(id: number, data: Partial<User>): Promise<User | undefined> {
    const result = await this.db.update(users)
      .set(data)
      .where(eq(users.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.count > 0;
  }
  
  // Contact submissions
  async createContactSubmission(submission: InsertContact): Promise<ContactSubmission> {
    const now = new Date();
    const result = await this.db.insert(contactSubmissions).values({
      ...submission,
      createdAt: now,
      resolved: false
    }).returning();
    
    return result[0];
  }
  
  async getContactSubmissions(): Promise<ContactSubmission[]> {
    return await this.db.select().from(contactSubmissions).orderBy(desc(contactSubmissions.createdAt));
  }
  
  async getContactSubmission(id: number): Promise<ContactSubmission | undefined> {
    const result = await this.db.select().from(contactSubmissions).where(eq(contactSubmissions.id, id));
    return result[0];
  }
  
  async updateContactSubmission(id: number, data: Partial<ContactSubmission>): Promise<ContactSubmission | undefined> {
    const result = await this.db.update(contactSubmissions)
      .set(data)
      .where(eq(contactSubmissions.id, id))
      .returning();
    
    return result[0];
  }
  
  // Prospects operations
  async createProspect(prospect: InsertProspect): Promise<Prospect> {
    const [created] = await this.db
      .insert(prospects)
      .values(prospect)
      .returning();
    return created;
  }

  async getProspects(followupStatus?: string): Promise<Prospect[]> {
    const query = this.db.select().from(prospects).orderBy(desc(prospects.createdAt));
    
    if (followupStatus) {
      return await query.where(eq(prospects.followupStatus, followupStatus));
    }
    
    return await query;
  }

  async getProspect(id: number): Promise<Prospect | undefined> {
    const [prospect] = await this.db
      .select()
      .from(prospects)
      .where(eq(prospects.id, id));
    return prospect || undefined;
  }

  async getProspectByEmail(email: string): Promise<Prospect | undefined> {
    const [prospect] = await this.db
      .select()
      .from(prospects)
      .where(eq(prospects.email, email));
    return prospect || undefined;
  }

  async updateProspect(id: number, data: Partial<Prospect>): Promise<Prospect | undefined> {
    const [updated] = await this.db
      .update(prospects)
      .set(data)
      .where(eq(prospects.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteProspect(id: number): Promise<boolean> {
    const result = await this.db
      .delete(prospects)
      .where(eq(prospects.id, id));
    return result.rowCount > 0;
  }
  
  // Blog posts
  async createBlogPost(post: InsertBlogPost): Promise<BlogPost> {
    const now = new Date();
    // Ensure all nullable fields are explicitly set to null if not provided
    const blogPostData = {
      ...post,
      titleEs: post.titleEs ?? null,
      contentEs: post.contentEs ?? null,
      authorId: post.authorId ?? null,
      published: post.published ?? null,
      featuredImage: post.featuredImage ?? null,
      createdAt: now
    };
    
    const result = await this.db.insert(blogPosts).values(blogPostData).returning();
    return result[0];
  }
  
  async getBlogPosts(limit?: number, published?: boolean): Promise<BlogPost[]> {
    if (published !== undefined) {
      const query = this.db.select()
        .from(blogPosts)
        .where(eq(blogPosts.published, published))
        .orderBy(desc(blogPosts.createdAt));
      
      if (limit) {
        return await query.limit(limit);
      }
      
      return await query;
    } else {
      const query = this.db.select()
        .from(blogPosts)
        .orderBy(desc(blogPosts.createdAt));
      
      if (limit) {
        return await query.limit(limit);
      }
      
      return await query;
    }
  }
  
  async getBlogPost(id: number): Promise<BlogPost | undefined> {
    const result = await this.db.select().from(blogPosts).where(eq(blogPosts.id, id));
    return result[0];
  }
  
  async getBlogPostBySlug(slug: string): Promise<BlogPost | undefined> {
    const result = await this.db.select().from(blogPosts).where(eq(blogPosts.slug, slug));
    return result[0];
  }
  
  async updateBlogPost(id: number, data: Partial<BlogPost>): Promise<BlogPost | undefined> {
    const result = await this.db.update(blogPosts)
      .set(data)
      .where(eq(blogPosts.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteBlogPost(id: number): Promise<boolean> {
    const result = await this.db.delete(blogPosts).where(eq(blogPosts.id, id));
    return result.count > 0;
  }
  
  // Projects
  async createProject(project: InsertProject): Promise<Project> {
    // Destructure to remove the fields we'll explicitly set
    const { 
      status, descriptionEs, titleEs, clientId, startDate, endDate, 
      image, featured,
      ...otherProps 
    } = project;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const projectData = {
      ...otherProps,
      status: status ?? null,
      descriptionEs: descriptionEs ?? null,
      titleEs: titleEs ?? null,
      clientId: clientId ?? null,
      startDate: startDate ?? null,
      endDate: endDate ?? null,
      image: image ?? null,
      featured: featured ?? null
    };
    
    const result = await this.db.insert(projects).values(projectData).returning();
    return result[0];
  }
  
  async getProjects(featured?: boolean): Promise<Project[]> {
    try {
      console.log("Consultando proyectos con featured:", featured);
      
      if (featured !== undefined) {
        const result = await this.db.select()
          .from(projects)
          .where(eq(projects.featured, featured));
        return result;
      }
      
      const result = await this.db.select().from(projects);
      return result;
    } catch (error) {
      console.error("Error al obtener proyectos:", error);
      return [];
    }
  }
  
  async getProject(id: number): Promise<Project | undefined> {
    try {
      console.log(`Buscando proyecto con ID: ${id}`);
      
      // Usar un enfoque más simple para obtener el proyecto
      const [project] = await this.db.select().from(projects).where(eq(projects.id, id));
      
      if (project) {
        console.log(`Proyecto encontrado: ${project.title}`);
        return project;
      }
      
      console.log(`No se encontró ningún proyecto con ID: ${id}`);
      return undefined;
    } catch (error) {
      console.error("Error al obtener proyecto:", error);
      return undefined;
    }
  }
  
  // Alias para mantener compatibilidad con la API existente
  async getProjectById(id: number): Promise<Project | undefined> {
    return this.getProject(id);
  }
  
  async getClientProjects(userId: number): Promise<Project[]> {
    try {
      console.log(`Buscando proyectos para el usuario con ID: ${userId}`);
      
      // Usamos la API de consulta relacional de Drizzle
      const result = await this.db.query.projects.findMany({
        where: eq(projects.clientId, userId),
        with: {
          user_clientId: true
        }
      });
      
      // Mapear la relación user_clientId a client para compatibilidad con el frontend
      const mappedResult = result.map(project => ({
        ...project,
        client: project.user_clientId
      }));
      
      console.log(`Encontrados ${mappedResult.length} proyectos para el usuario ${userId}`);
      return mappedResult;
    } catch (error) {
      console.error('Error al obtener proyectos del cliente:', error);
      return [];
    }
  }
  
  async updateProject(id: number, data: Partial<Project>): Promise<Project | undefined> {
    const result = await this.db.update(projects)
      .set(data)
      .where(eq(projects.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteProject(id: number): Promise<boolean> {
    const result = await this.db.delete(projects).where(eq(projects.id, id));
    return result.count > 0;
  }
  
  // Testimonials
  async createTestimonial(testimonial: InsertTestimonial): Promise<Testimonial> {
    // Destructure to remove the fields we'll explicitly set
    const { 
      contentEs, image, position, company, rating, approved,
      ...otherProps 
    } = testimonial;
    
    // Make sure rating is an integer
    const ratingInt = rating ? Math.round(Number(rating)) : 5;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const data = {
      ...otherProps,
      contentEs: contentEs ?? null,
      image: image ?? null,
      position: position ?? null,
      company: company ?? null,
      rating: ratingInt, // Use the integer version
      approved: approved ?? false
    };
    
    const result = await this.db.insert(testimonials).values(data).returning();
    return result[0];
  }
  
  async getTestimonials(approved?: boolean): Promise<Testimonial[]> {
    if (approved !== undefined) {
      return await this.db.select().from(testimonials).where(eq(testimonials.approved, approved));
    }
    
    return await this.db.select().from(testimonials);
  }
  
  async updateTestimonial(id: number, data: Partial<Testimonial>): Promise<Testimonial | undefined> {
    const result = await this.db.update(testimonials)
      .set(data)
      .where(eq(testimonials.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteTestimonial(id: number): Promise<boolean> {
    const result = await this.db.delete(testimonials).where(eq(testimonials.id, id));
    return result.count > 0;
  }
  
  // Social Media Content
  async createSocialMediaContent(content: InsertSocialMedia): Promise<SocialMedia> {
    const now = new Date();
    
    // Destructure to remove the fields we'll explicitly set
    const { 
      contentEs, image, userId, scheduled, scheduledDate, aiGenerated, metadata,
      ...otherProps 
    } = content;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const socialMediaData = {
      ...otherProps,
      contentEs: contentEs ?? null,
      image: image ?? null,
      userId: userId ?? null,
      scheduled: scheduled ?? null,
      scheduledDate: scheduledDate ?? null,
      aiGenerated: aiGenerated ?? null,
      metadata: metadata ?? null,
      createdAt: now
    };
    
    const result = await this.db.insert(socialMediaContent).values(socialMediaData).returning();
    return result[0];
  }
  
  async getUserSocialMediaContent(userId: number): Promise<SocialMedia[]> {
    return await this.db
      .select()
      .from(socialMediaContent)
      .where(eq(socialMediaContent.userId, userId))
      .orderBy(desc(socialMediaContent.createdAt));
  }
  
  async updateSocialMediaContent(id: number, data: Partial<SocialMedia>): Promise<SocialMedia | undefined> {
    const result = await this.db.update(socialMediaContent)
      .set(data)
      .where(eq(socialMediaContent.id, id))
      .returning();
    
    return result[0];
  }
  
  async getSocialMediaContentById(id: number): Promise<SocialMedia | undefined> {
    const [content] = await this.db
      .select()
      .from(socialMediaContent)
      .where(eq(socialMediaContent.id, id));
    
    return content || undefined;
  }
  
  async updateSocialMediaContent(id: number, data: Partial<SocialMedia>): Promise<SocialMedia | undefined> {
    const [updatedContent] = await this.db
      .update(socialMediaContent)
      .set(data)
      .where(eq(socialMediaContent.id, id))
      .returning();
    
    return updatedContent || undefined;
  }

  async deleteSocialMediaContent(id: number): Promise<boolean> {
    const result = await this.db.delete(socialMediaContent).where(eq(socialMediaContent.id, id));
    return result.count > 0;
  }
  
  // Service Types
  async createServiceType(service: InsertServiceType): Promise<ServiceType> {
    // Destructure to remove the fields we'll explicitly set
    const { 
      nameEs, descriptionEs, features, featuresEs, icon, sortOrder, 
      ...otherProps 
    } = service;
    
    // Ensure all nullable fields are explicitly set to null if not provided
    const serviceData = {
      ...otherProps,
      nameEs: nameEs ?? null,
      descriptionEs: descriptionEs ?? null,
      features: features ?? null,
      featuresEs: featuresEs ?? null,
      icon: icon ?? null,
      sortOrder: sortOrder ?? null
    };
    
    const result = await this.db.insert(serviceTypes).values(serviceData).returning();
    return result[0];
  }
  
  async getServiceTypes(): Promise<ServiceType[]> {
    // First ensure we get all services
    const services = await this.db.select().from(serviceTypes);
    
    // Then sort them manually to handle null sortOrder values safely
    return services.sort((a, b) => {
      // If both have null sortOrder, maintain original order
      if (a.sortOrder === null && b.sortOrder === null) {
        return 0;
      }
      
      // Null sortOrder values should come after non-null values
      if (a.sortOrder === null) {
        return 1;
      }
      
      if (b.sortOrder === null) {
        return -1;
      }
      
      // Both have non-null sortOrder, compare them directly
      return a.sortOrder - b.sortOrder;
    });
  }
  
  async getServiceType(id: number): Promise<ServiceType | undefined> {
    const result = await this.db.select().from(serviceTypes).where(eq(serviceTypes.id, id));
    return result[0];
  }
  
  async updateServiceType(id: number, data: Partial<ServiceType>): Promise<ServiceType | undefined> {
    const result = await this.db.update(serviceTypes)
      .set(data)
      .where(eq(serviceTypes.id, id))
      .returning();
    
    return result[0];
  }
  
  async deleteServiceType(id: number): Promise<boolean> {
    const result = await this.db.delete(serviceTypes).where(eq(serviceTypes.id, id));
    return result.count > 0;
  }
  
  // Project Milestones
  async createProjectMilestone(milestone: InsertProjectMilestone): Promise<ProjectMilestone> {
    try {
      const [result] = await this.db.insert(projectMilestones).values(milestone).returning();
      return result;
    } catch (error) {
      console.error("Error creating project milestone:", error);
      throw error;
    }
  }
  
  async getProjectMilestones(projectId: number): Promise<ProjectMilestone[]> {
    try {
      return await this.db
        .select()
        .from(projectMilestones)
        .where(eq(projectMilestones.projectId, projectId))
        .orderBy(asc(projectMilestones.sortOrder));
    } catch (error) {
      console.error("Error getting project milestones:", error);
      return [];
    }
  }
  
  async getProjectMilestone(id: number): Promise<ProjectMilestone | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(projectMilestones)
        .where(eq(projectMilestones.id, id));
      return result;
    } catch (error) {
      console.error("Error getting project milestone:", error);
      return undefined;
    }
  }
  
  async updateProjectMilestone(id: number, data: Partial<ProjectMilestone>): Promise<ProjectMilestone | undefined> {
    try {
      const [result] = await this.db
        .update(projectMilestones)
        .set(data)
        .where(eq(projectMilestones.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating project milestone:", error);
      return undefined;
    }
  }
  
  async deleteProjectMilestone(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(projectMilestones)
        .where(eq(projectMilestones.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting project milestone:", error);
      return false;
    }
  }
  
  // Project Updates
  async createProjectUpdate(update: InsertProjectUpdate): Promise<ProjectUpdate> {
    try {
      const [result] = await this.db.insert(projectUpdates).values(update).returning();
      return result;
    } catch (error) {
      console.error("Error creating project update:", error);
      throw error;
    }
  }
  
  async getProjectUpdates(projectId: number, publicOnly?: boolean): Promise<ProjectUpdate[]> {
    try {
      if (publicOnly) {
        return await this.db
          .select()
          .from(projectUpdates)
          .where(eq(projectUpdates.projectId, projectId))
          .where(eq(projectUpdates.isPublic, true))
          .orderBy(desc(projectUpdates.createdAt));
      } else {
        return await this.db
          .select()
          .from(projectUpdates)
          .where(eq(projectUpdates.projectId, projectId))
          .orderBy(desc(projectUpdates.createdAt));
      }
    } catch (error) {
      console.error("Error getting project updates:", error);
      return [];
    }
  }
  
  async getProjectUpdate(id: number): Promise<ProjectUpdate | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(projectUpdates)
        .where(eq(projectUpdates.id, id));
      return result;
    } catch (error) {
      console.error("Error getting project update:", error);
      return undefined;
    }
  }
  
  async updateProjectUpdate(id: number, data: Partial<ProjectUpdate>): Promise<ProjectUpdate | undefined> {
    try {
      const [result] = await this.db
        .update(projectUpdates)
        .set(data)
        .where(eq(projectUpdates.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating project update:", error);
      return undefined;
    }
  }
  
  async deleteProjectUpdate(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(projectUpdates)
        .where(eq(projectUpdates.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting project update:", error);
      return false;
    }
  }
  
  // Project Comments
  async createProjectComment(comment: InsertProjectComment): Promise<ProjectComment> {
    try {
      const [result] = await this.db.insert(projectComments).values(comment).returning();
      return result;
    } catch (error) {
      console.error("Error creating project comment:", error);
      throw error;
    }
  }
  
  async getProjectComments(projectId: number): Promise<ProjectComment[]> {
    try {
      return await this.db
        .select()
        .from(projectComments)
        .where(eq(projectComments.projectId, projectId))
        .orderBy(asc(projectComments.createdAt));
    } catch (error) {
      console.error("Error getting project comments:", error);
      return [];
    }
  }
  
  async getProjectComment(id: number): Promise<ProjectComment | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(projectComments)
        .where(eq(projectComments.id, id));
      return result;
    } catch (error) {
      console.error("Error getting project comment:", error);
      return undefined;
    }
  }
  
  async updateProjectComment(id: number, data: Partial<ProjectComment>): Promise<ProjectComment | undefined> {
    try {
      const [result] = await this.db
        .update(projectComments)
        .set(data)
        .where(eq(projectComments.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating project comment:", error);
      return undefined;
    }
  }
  
  async deleteProjectComment(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(projectComments)
        .where(eq(projectComments.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting project comment:", error);
      return false;
    }
  }
  
  // Orders
  async createOrder(order: InsertOrder): Promise<Order> {
    try {
      const [result] = await this.db.insert(orders).values(order).returning();
      return result;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }
  
  async getOrders(userId?: number, status?: string): Promise<Order[]> {
    try {
      if (userId !== undefined && status !== undefined) {
        return await this.db
          .select()
          .from(orders)
          .where(eq(orders.userId, userId))
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt));
      } else if (userId !== undefined) {
        return await this.db
          .select()
          .from(orders)
          .where(eq(orders.userId, userId))
          .orderBy(desc(orders.createdAt));
      } else if (status !== undefined) {
        return await this.db
          .select()
          .from(orders)
          .where(eq(orders.status, status))
          .orderBy(desc(orders.createdAt));
      } else {
        return await this.db
          .select()
          .from(orders)
          .orderBy(desc(orders.createdAt));
      }
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }
  
  async getOrder(id: number): Promise<Order | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(orders)
        .where(eq(orders.id, id));
      return result;
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }
  
  async updateOrder(id: number, data: Partial<Order>): Promise<Order | undefined> {
    try {
      const now = new Date();
      const [result] = await this.db
        .update(orders)
        .set({ ...data, updatedAt: now })
        .where(eq(orders.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating order:", error);
      return undefined;
    }
  }
  
  async updateStripeInfo(userId: number, stripeCustomerId: string, orderId: number, stripePaymentId: string): Promise<Order | undefined> {
    try {
      const now = new Date();
      const [result] = await this.db
        .update(orders)
        .set({ 
          stripeCustomerId, 
          stripePaymentId, 
          status: "paid", 
          updatedAt: now 
        })
        .where(eq(orders.id, orderId))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating stripe info:", error);
      return undefined;
    }
  }
  
  // Order Items
  async createOrderItem(item: InsertOrderItem): Promise<OrderItem> {
    try {
      const [result] = await this.db.insert(orderItems).values(item).returning();
      return result;
    } catch (error) {
      console.error("Error creating order item:", error);
      throw error;
    }
  }
  
  async getOrderItems(orderId: number): Promise<OrderItem[]> {
    try {
      return await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.orderId, orderId));
    } catch (error) {
      console.error("Error getting order items:", error);
      return [];
    }
  }
  
  async getOrderItem(id: number): Promise<OrderItem | undefined> {
    try {
      const [result] = await this.db
        .select()
        .from(orderItems)
        .where(eq(orderItems.id, id));
      return result;
    } catch (error) {
      console.error("Error getting order item:", error);
      return undefined;
    }
  }
  
  async updateOrderItem(id: number, data: Partial<OrderItem>): Promise<OrderItem | undefined> {
    try {
      const [result] = await this.db
        .update(orderItems)
        .set(data)
        .where(eq(orderItems.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating order item:", error);
      return undefined;
    }
  }
  
  async deleteOrderItem(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(orderItems)
        .where(eq(orderItems.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting order item:", error);
      return false;
    }
  }

  // Invoice operations
  async getInvoices(userId?: number, projectId?: number, status?: string): Promise<Invoice[]> {
    try {
      console.log("PostgresStorage.getInvoices called with:", { userId, projectId, status });
      
      // Direct SQL query with JOIN to users table to get client information
      let sqlQuery = `
        SELECT 
          i.id, i.user_id, i.project_id, i.number, i.description, i.status, 
          i.issue_date, i.due_date, i.total, i.notes, i.payment_method, 
          i.payment_date, i.stripe_invoice_id, i.stripe_payment_intent_id, 
          i.paypal_order_id, i.payment_link, i.items, i.metadata, i.created_at, i.updated_at,
          u.first_name, u.last_name, u.email
        FROM invoices i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE 1=1
      `;
      
      const params: any[] = [];
      
      // Add conditions
      if (userId !== undefined) {
        sqlQuery += ` AND i.user_id = $${params.length + 1}`;
        params.push(userId);
      }
      
      if (projectId !== undefined) {
        sqlQuery += ` AND i.project_id = $${params.length + 1}`;
        params.push(projectId);
      }
      
      if (status !== undefined) {
        sqlQuery += ` AND i.status = $${params.length + 1}`;
        params.push(status);
      }
      
      // Order by most recent first
      sqlQuery += ` ORDER BY i.created_at DESC`;
      
      // Execute the raw SQL query
      const result = await this.db.execute(sqlQuery, params);
      console.log(`Found ${result.length} invoices for user ${userId || 'all'}`);
      
      // Transform the results to match our TypeScript interface as best as possible
      return result.map(row => {
        // Create client name from user data
        const clientName = row.first_name && row.last_name
          ? `${row.first_name} ${row.last_name}`
          : row.email || null;
        
        // Map database column names to our TypeScript property names
        return {
          id: row.id,
          userId: row.user_id,
          projectId: row.project_id,
          number: row.number,
          description: row.description,
          status: row.status,
          issueDate: row.issue_date,
          dueDate: row.due_date,
          // Los valores ya están en dólares en la base de datos, no necesitan conversión
          amount: parseFloat(String(row.total)), // Mantener el valor como está
          tax: 0,
          discount: 0,
          total: parseFloat(String(row.total)), // Mantener el valor como está
          notes: row.notes,
          paymentMethod: row.payment_method,
          paymentDate: row.payment_date,
          stripeInvoiceId: row.stripe_invoice_id,
          stripePaymentIntentId: row.stripe_payment_intent_id,
          paypalOrderId: row.paypal_order_id,
          paymentLink: row.payment_link,
          items: row.items,
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          // Add client information
          clientName: clientName,
          user: {
            firstName: row.first_name,
            lastName: row.last_name,
            email: row.email
          }
        } as unknown as Invoice;
      });
    } catch (error) {
      console.error("Error getting invoices:", error);
      return [];
    }
  }
  
  async getInvoice(id: number): Promise<Invoice | undefined> {
    try {
      // Use the same direct SQL approach as getInvoices with user JOIN
      const sqlQuery = `
        SELECT 
          i.id, i.user_id, i.project_id, i.number, i.description, i.status, 
          i.issue_date, i.due_date, i.total, i.notes, i.payment_method, 
          i.payment_date, i.stripe_invoice_id, i.stripe_payment_intent_id, 
          i.paypal_order_id, i.payment_link, i.items, i.metadata, i.created_at, i.updated_at,
          u.first_name, u.last_name, u.email
        FROM invoices i
        LEFT JOIN users u ON i.user_id = u.id
        WHERE i.id = $1
        LIMIT 1
      `;
      
      const results = await this.db.execute(sqlQuery, [id]);
      if (results.length === 0) return undefined;
      
      const row = results[0];
      
      // Create client name from user data
      const clientName = row.first_name && row.last_name
        ? `${row.first_name} ${row.last_name}`
        : row.email || null;
      
      // Map database column names to our TypeScript property names
      return {
        id: row.id,
        userId: row.user_id,
        projectId: row.project_id,
        number: row.number,
        description: row.description,
        status: row.status,
        issueDate: row.issue_date,
        dueDate: row.due_date,
        // Los valores ya están en dólares en la base de datos, no necesitan conversión
        amount: parseFloat(String(row.total)), // Mantener el valor como está
        tax: 0,
        discount: 0,
        total: parseFloat(String(row.total)), // Mantener el valor como está
        notes: row.notes,
        paymentMethod: row.payment_method,
        paymentDate: row.payment_date,
        stripeInvoiceId: row.stripe_invoice_id,
        stripePaymentIntentId: row.stripe_payment_intent_id,
        paypalOrderId: row.paypal_order_id,
        paymentLink: row.payment_link,
        items: row.items,
        metadata: row.metadata,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
        // Add client information
        clientName: clientName,
        user: {
          firstName: row.first_name,
          lastName: row.last_name,
          email: row.email
        }
      } as unknown as Invoice;
    } catch (error) {
      console.error("Error getting invoice:", error);
      return undefined;
    }
  }
  
  async createInvoice(invoice: InsertInvoice): Promise<Invoice> {
    try {
      const [result] = await this.db
        .insert(invoices)
        .values(invoice)
        .returning();
      return result;
    } catch (error) {
      console.error("Error creating invoice:", error);
      throw error;
    }
  }
  
  async updateInvoice(id: number, data: Partial<Invoice>): Promise<Invoice | undefined> {
    try {
      const [result] = await this.db
        .update(invoices)
        .set(data)
        .where(eq(invoices.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating invoice:", error);
      return undefined;
    }
  }
  
  async deleteInvoice(id: number): Promise<boolean> {
    try {
      const result = await this.db
        .delete(invoices)
        .where(eq(invoices.id, id));
      return result.count > 0;
    } catch (error) {
      console.error("Error deleting invoice:", error);
      return false;
    }
  }
  
  async updateInvoiceWithPayPalOrderId(
    invoiceId: number,
    paypalOrderId: string,
    paypalCaptureId?: string
  ): Promise<Invoice | undefined> {
    try {
      const invoice = await this.getInvoice(invoiceId);
      if (!invoice) return undefined;
      
      const now = new Date();
      const metadata = invoice.metadata ? invoice.metadata : {};
      
      // Añadir información de captura de PayPal al metadata
      if (paypalCaptureId) {
        metadata.paypalCaptureId = paypalCaptureId;
      }
      
      const [updatedInvoice] = await this.db
        .update(invoices)
        .set({
          paypalOrderId,
          metadata,
          updatedAt: now
        })
        .where(eq(invoices.id, invoiceId))
        .returning();
      
      return updatedInvoice;
    } catch (error) {
      console.error("Error updating invoice with PayPal order ID:", error);
      return undefined;
    }
  }
  
  async sendInvoiceEmail(invoice: {
    to: string;
    clientName: string;
    invoiceNumber: string;
    amount: number;
    dueDate: Date;
    description: string;
    paymentLink: string;
  }): Promise<boolean> {
    try {
      // Call the real email function in email.ts
      console.log(`[EMAIL] Sending invoice ${invoice.invoiceNumber} to ${invoice.to}`);
      const result = await sendInvoiceEmail(invoice);
      return result;
    } catch (error) {
      console.error("Error sending invoice email:", error);
      return false;
    }
  }
  
  // Get all users (admin function)
  async getUsers(): Promise<User[]> {
    try {
      return await this.db.select().from(users);
    } catch (error) {
      console.error("Error getting users:", error);
      return [];
    }
  }

  // Auth token operations - MISSING IMPLEMENTATION HOTFIX
  async setResetPasswordToken(userId: number, token: string, expiry: Date): Promise<void> {
    await this.db.update(users)
      .set({ 
        resetPasswordToken: token, 
        resetPasswordTokenExpiry: expiry 
      })
      .where(eq(users.id, userId));
  }

  async setVerificationToken(userId: number, token: string, expiry: Date): Promise<void> {
    await this.db.update(users)
      .set({ 
        verificationToken: token, 
        verificationTokenExpiry: expiry 
      })
      .where(eq(users.id, userId));
  }

  async getUserByResetToken(token: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.resetPasswordToken, token));
    return result[0];
  }

  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    const result = await this.db.select()
      .from(users)
      .where(eq(users.verificationToken, token));
    return result[0];
  }

  async clearResetPasswordToken(userId: number): Promise<void> {
    await this.db.update(users)
      .set({ 
        resetPasswordToken: null, 
        resetPasswordTokenExpiry: null 
      })
      .where(eq(users.id, userId));
  }

  async clearVerificationToken(userId: number): Promise<void> {
    await this.db.update(users)
      .set({ 
        verificationToken: null, 
        verificationTokenExpiry: null 
      })
      .where(eq(users.id, userId));
  }

  async markEmailAsVerified(userId: number): Promise<void> {
    await this.db.update(users)
      .set({ emailVerified: true })
      .where(eq(users.id, userId));
  }

  async getAllAdminUsers(): Promise<User[]> {
    return await this.db.select()
      .from(users)
      .where(or(eq(users.role, "admin"), eq(users.role, "superadmin")));
  }

  async createAdminUser(user: InsertUser & { adminLevel?: number, permissions?: string[] }): Promise<User> {
    const now = new Date();
    const userData = {
      ...user,
      firstName: user.firstName ?? null,
      lastName: user.lastName ?? null,
      language: user.language ?? 'en',
      role: user.role ?? "admin",
      adminLevel: user.adminLevel ?? 1,
      permissions: user.permissions ? JSON.stringify(user.permissions) : '{}',
      isActive: true,
      createdAt: now
    };
    
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  // =============================================
  // STAFF MANAGEMENT SYSTEM IMPLEMENTATIONS
  // =============================================

  // Staff Members
  async createStaffMember(member: InsertStaffMember): Promise<StaffMember> {
    const now = new Date();
    const memberData = {
      ...member,
      createdAt: now,
      isActive: member.isActive ?? true,
      emailVerified: member.emailVerified ?? true
    };
    
    const result = await this.db.insert(staffMembers).values(memberData).returning();
    return result[0];
  }

  async getStaffMembers(includeInactive?: boolean): Promise<StaffMember[]> {
    if (includeInactive) {
      return await this.db.select().from(staffMembers).orderBy(desc(staffMembers.createdAt));
    }
    
    return await this.db.select().from(staffMembers)
      .where(eq(staffMembers.isActive, true))
      .orderBy(desc(staffMembers.createdAt));
  }

  async getStaffMember(id: number): Promise<StaffMember | undefined> {
    const result = await this.db.select().from(staffMembers).where(eq(staffMembers.id, id));
    return result[0];
  }

  async getStaffMemberByEmail(email: string): Promise<StaffMember | undefined> {
    const result = await this.db.select().from(staffMembers).where(eq(staffMembers.email, email));
    return result[0];
  }

  async getStaffMemberByUsername(username: string): Promise<StaffMember | undefined> {
    const result = await this.db.select().from(staffMembers).where(eq(staffMembers.username, username));
    return result[0];
  }

  async updateStaffMember(id: number, data: Partial<StaffMember>): Promise<StaffMember | undefined> {
    const result = await this.db.update(staffMembers)
      .set(data)
      .where(eq(staffMembers.id, id))
      .returning();
    
    return result[0];
  }

  async deleteStaffMember(id: number): Promise<boolean> {
    const result = await this.db.delete(staffMembers).where(eq(staffMembers.id, id));
    return result.count > 0;
  }

  async validateStaffCredentials(usernameOrEmail: string, password: string): Promise<StaffMember | null> {
    try {
      const staffMember = await this.db.select().from(staffMembers)
        .where(or(
          eq(staffMembers.username, usernameOrEmail),
          eq(staffMembers.email, usernameOrEmail)
        ))
        .limit(1);

      if (!staffMember.length || !staffMember[0].isActive) {
        return null;
      }

      // Basic password validation - you would normally hash and compare here
      if (staffMember[0].password === password) {
        // Update last login
        await this.updateStaffMember(staffMember[0].id, { lastLogin: new Date() });
        return staffMember[0];
      }

      return null;
    } catch (error) {
      console.error('Error validating staff credentials:', error);
      return null;
    }
  }

  // AI Brief Submissions
  async createAIBriefSubmission(submission: InsertAIBriefSubmission): Promise<AIBriefSubmission> {
    const now = new Date();
    const submissionData = {
      ...submission,
      submissionId: this.generateUniqueSubmissionId(submission.staffMemberId),
      createdAt: now,
      updatedAt: now
    };
    
    const result = await this.db.insert(aiBriefSubmissions).values(submissionData).returning();
    return result[0];
  }

  async getAIBriefSubmissions(staffMemberId?: number, status?: string): Promise<(AIBriefSubmission & { emailOpened?: boolean; openedAt?: Date })[]> {
    let query = this.db.select().from(aiBriefSubmissions);
    
    const conditions: any[] = [];
    
    if (staffMemberId) {
      conditions.push(eq(aiBriefSubmissions.staffMemberId, staffMemberId));
    }
    
    if (status) {
      conditions.push(eq(aiBriefSubmissions.status, status));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : conditions.reduce((acc, cond) => acc && cond));
    }
    
    const submissions = await query.orderBy(desc(aiBriefSubmissions.createdAt));
    
    // For each submission, check if email was opened
    const submissionsWithTracking = await Promise.all(
      submissions.map(async (submission) => {
        const openEvent = await this.db.select().from(staffEmailTracking)
          .where(
            and(
              eq(staffEmailTracking.submissionId, submission.submissionId),
              eq(staffEmailTracking.eventType, 'opened')
            )
          )
          .limit(1);
        
        return {
          ...submission,
          emailOpened: openEvent.length > 0,
          openedAt: openEvent.length > 0 ? openEvent[0].timestamp : undefined
        };
      })
    );
    
    return submissionsWithTracking;
  }

  async getAIBriefSubmission(id: number): Promise<AIBriefSubmission | undefined> {
    const result = await this.db.select().from(aiBriefSubmissions).where(eq(aiBriefSubmissions.id, id));
    return result[0];
  }

  async getAIBriefSubmissionBySubmissionId(submissionId: string): Promise<AIBriefSubmission | undefined> {
    const result = await this.db.select().from(aiBriefSubmissions).where(eq(aiBriefSubmissions.submissionId, submissionId));
    return result[0];
  }

  async updateAIBriefSubmission(id: number, data: Partial<AIBriefSubmission>): Promise<AIBriefSubmission | undefined> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const result = await this.db.update(aiBriefSubmissions)
      .set(updateData)
      .where(eq(aiBriefSubmissions.id, id))
      .returning();
    
    return result[0];
  }

  async deleteAIBriefSubmission(id: number): Promise<boolean> {
    const result = await this.db.delete(aiBriefSubmissions).where(eq(aiBriefSubmissions.id, id));
    return result.count > 0;
  }

  generateUniqueSubmissionId(staffMemberId: number): string {
    const timestamp = Date.now();
    return `staff_${staffMemberId}_${timestamp}`;
  }

  // Email Tracking
  async createStaffEmailTracking(tracking: InsertStaffEmailTracking): Promise<StaffEmailTracking> {
    const trackingData = {
      ...tracking,
      timestamp: new Date()
    };
    
    const result = await this.db.insert(staffEmailTracking).values(trackingData).returning();
    return result[0];
  }

  async getStaffEmailTracking(submissionId?: string, eventType?: string): Promise<StaffEmailTracking[]> {
    let query = this.db.select().from(staffEmailTracking);
    
    const conditions: any[] = [];
    
    if (submissionId) {
      conditions.push(eq(staffEmailTracking.submissionId, submissionId));
    }
    
    if (eventType) {
      conditions.push(eq(staffEmailTracking.eventType, eventType));
    }
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : conditions.reduce((acc, cond) => acc && cond));
    }
    
    return await query.orderBy(desc(staffEmailTracking.timestamp));
  }

  async getEmailTrackingEvents(submissionId: string): Promise<StaffEmailTracking[]> {
    return await this.db.select().from(staffEmailTracking)
      .where(eq(staffEmailTracking.submissionId, submissionId))
      .orderBy(desc(staffEmailTracking.timestamp));
  }

  // Contact Page Visits
  async createContactPageVisit(visit: InsertContactPageVisit): Promise<ContactPageVisit> {
    const visitData = {
      ...visit,
      visitId: visit.visitId || this.generateUniqueVisitId(),
      visitedAt: new Date()
    };
    
    const result = await this.db.insert(contactPageVisits).values(visitData).returning();
    return result[0];
  }

  async getContactPageVisits(submissionId?: string): Promise<ContactPageVisit[]> {
    if (submissionId) {
      return await this.db.select().from(contactPageVisits)
        .where(eq(contactPageVisits.submissionId, submissionId))
        .orderBy(desc(contactPageVisits.visitedAt));
    }
    
    return await this.db.select().from(contactPageVisits)
      .orderBy(desc(contactPageVisits.visitedAt));
  }

  async updateContactPageVisit(id: number, data: Partial<ContactPageVisit>): Promise<ContactPageVisit | undefined> {
    const result = await this.db.update(contactPageVisits)
      .set(data)
      .where(eq(contactPageVisits.id, id))
      .returning();
    
    return result[0];
  }

  generateUniqueVisitId(): string {
    return `visit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Performance Analytics
  async createStaffPerformanceAnalytics(analytics: InsertStaffPerformanceAnalytics): Promise<StaffPerformanceAnalytics> {
    const analyticsData = {
      ...analytics,
      updatedAt: new Date()
    };
    
    const result = await this.db.insert(staffPerformanceAnalytics).values(analyticsData).returning();
    return result[0];
  }

  async getStaffPerformanceAnalytics(
    staffMemberId?: number, 
    period?: string, 
    startDate?: Date, 
    endDate?: Date
  ): Promise<StaffPerformanceAnalytics[]> {
    let query = this.db.select().from(staffPerformanceAnalytics);
    
    const conditions: any[] = [];
    
    if (staffMemberId) {
      conditions.push(eq(staffPerformanceAnalytics.staffMemberId, staffMemberId));
    }
    
    if (period) {
      conditions.push(eq(staffPerformanceAnalytics.period, period));
    }
    
    // Note: Date range filtering would require additional imports and logic
    // For now, basic filtering is implemented
    
    if (conditions.length > 0) {
      query = query.where(conditions.length === 1 ? conditions[0] : conditions.reduce((acc, cond) => acc && cond));
    }
    
    return await query.orderBy(desc(staffPerformanceAnalytics.periodDate));
  }

  async updateStaffPerformanceAnalytics(id: number, data: Partial<StaffPerformanceAnalytics>): Promise<StaffPerformanceAnalytics | undefined> {
    const updateData = {
      ...data,
      updatedAt: new Date()
    };
    
    const result = await this.db.update(staffPerformanceAnalytics)
      .set(updateData)
      .where(eq(staffPerformanceAnalytics.id, id))
      .returning();
    
    return result[0];
  }

  async updateDailyStaffMetrics(staffMemberId: number, date: Date): Promise<void> {
    try {
      const dateStr = date.toISOString().split('T')[0]; // Get YYYY-MM-DD format
      
      // Get metrics for the day
      const briefsCount = await this.db.select().from(aiBriefSubmissions)
        .where(eq(aiBriefSubmissions.staffMemberId, staffMemberId));
      
      // Calculate rates and other metrics
      const emailsSent = briefsCount.filter(b => b.emailSent).length;
      const totalBriefs = briefsCount.length;
      
      // Insert or update analytics record
      // This would require more complex upsert logic in a real implementation
      console.log(`Updated metrics for staff ${staffMemberId} on ${dateStr}: ${totalBriefs} briefs, ${emailsSent} emails sent`);
    } catch (error) {
      console.error('Error updating daily staff metrics:', error);
    }
  }

  async getStaffDashboardData(staffMemberId: number): Promise<{
    totalBriefs: number;
    emailsSent: number;
    emailsOpened: number;
    contactPageVisits: number;
    conversionRate: number;
    recentSubmissions: AIBriefSubmission[];
  }> {
    try {
      // Get all submissions for this staff member
      const submissions = await this.getAIBriefSubmissions(staffMemberId);
      
      // Get recent submissions (last 10)
      const recentSubmissions = submissions.slice(0, 10);
      
      // Calculate metrics
      const totalBriefs = submissions.length;
      const emailsSent = submissions.filter(s => s.emailSent).length;
      
      // Get email tracking events for opens (only for this staff member's submissions)
      const submissionIds = submissions.map(s => s.submissionId);
      const emailOpens = await this.db.select().from(staffEmailTracking)
        .where(
          and(
            eq(staffEmailTracking.eventType, 'opened'),
            inArray(staffEmailTracking.submissionId, submissionIds.length > 0 ? submissionIds : [''])
          )
        );
      
      // Get contact page visits
      const visits = await this.db.select().from(contactPageVisits);
      
      // Calculate conversion rate (simplified)
      const conversionRate = totalBriefs > 0 ? (visits.length / totalBriefs) * 100 : 0;
      
      return {
        totalBriefs,
        emailsSent,
        emailsOpened: emailOpens.length,
        contactPageVisits: visits.length,
        conversionRate: Math.round(conversionRate * 100) / 100,
        recentSubmissions
      };
    } catch (error) {
      console.error('Error getting staff dashboard data:', error);
      return {
        totalBriefs: 0,
        emailsSent: 0,
        emailsOpened: 0,
        contactPageVisits: 0,
        conversionRate: 0,
        recentSubmissions: []
      };
    }
  }

  // Email Effectiveness Tracking
  async updateEmailEffectiveness(submissionId: string, effective: number): Promise<void> {
    try {
      await this.db
        .update(aiBriefSubmissions)
        .set({ emailEffective: effective })
        .where(eq(aiBriefSubmissions.submissionId, submissionId));
      
      console.log(`Email effectiveness updated: submissionId=${submissionId}, effective=${effective}`);
    } catch (error) {
      console.error('Error updating email effectiveness:', error);
      throw error;
    }
  }

  // Find submission by unique brief ID
  async getAIBriefSubmissionByUniqueId(uniqueBriefId: string): Promise<AIBriefSubmission | undefined> {
    try {
      const [submission] = await this.db
        .select()
        .from(aiBriefSubmissions)
        .where(eq(aiBriefSubmissions.uniqueBriefId, uniqueBriefId));
      
      return submission;
    } catch (error) {
      console.error('Error finding submission by unique brief ID:', error);
      throw error;
    }
  }
}

// Uncomment to use PostgreSQL storage
export const storage = new PostgresStorage();
