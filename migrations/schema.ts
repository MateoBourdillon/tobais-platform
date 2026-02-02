import { pgTable, foreignKey, serial, text, integer, timestamp, boolean, unique, jsonb, index, varchar, json, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"



export const projects = pgTable("projects", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        titleEs: text("title_es"),
        description: text().notNull(),
        descriptionEs: text("description_es"),
        clientId: integer("client_id"),
        status: text().default('pending'),
        startDate: timestamp("start_date", { mode: 'string' }),
        endDate: timestamp("end_date", { mode: 'string' }),
        image: text(),
        featured: boolean().default(false),
        userId: integer("user_id"),
}, (table) => [
        foreignKey({
                        columns: [table.clientId],
                        foreignColumns: [users.id],
                        name: "projects_client_id_users_id_fk"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "projects_user_id_fkey"
                }),
]);

export const contactSubmissions = pgTable("contact_submissions", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        email: text().notNull(),
        message: text().notNull(),
        serviceId: integer("service_id"),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        resolved: boolean().default(false),
        serviceType: text("service_type"),
}, (table) => [
        foreignKey({
                        columns: [table.serviceId],
                        foreignColumns: [serviceTypes.id],
                        name: "contact_submissions_service_id_service_types_id_fk"
                }),
]);

export const blogPosts = pgTable("blog_posts", {
        id: serial().primaryKey().notNull(),
        title: text().notNull(),
        titleEs: text("title_es"),
        content: text().notNull(),
        contentEs: text("content_es"),
        authorId: integer("author_id"),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        published: boolean().default(false),
        slug: text().notNull(),
        featuredImage: text("featured_image"),
}, (table) => [
        foreignKey({
                        columns: [table.authorId],
                        foreignColumns: [users.id],
                        name: "blog_posts_author_id_users_id_fk"
                }),
        unique("blog_posts_slug_unique").on(table.slug),
]);

export const testimonials = pgTable("testimonials", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        position: text(),
        company: text(),
        content: text().notNull(),
        contentEs: text("content_es"),
        rating: integer().default(5),
        image: text(),
        approved: boolean().default(false),
});

export const serviceTypes = pgTable("service_types", {
        id: serial().primaryKey().notNull(),
        name: text().notNull(),
        nameEs: text("name_es"),
        description: text().notNull(),
        descriptionEs: text("description_es"),
        price: integer().notNull(),
        features: jsonb(),
        featuresEs: jsonb("features_es"),
        icon: text(),
        sortOrder: integer("sort_order").default(0),
});

export const socialMediaContent = pgTable("social_media_content", {
        id: serial().primaryKey().notNull(),
        userId: integer("user_id"),
        platform: text().notNull(),
        content: text().notNull(),
        contentEs: text("content_es"),
        image: text(),
        scheduled: boolean().default(false),
        scheduledDate: timestamp("scheduled_date", { mode: 'string' }),
        aiGenerated: boolean("ai_generated").default(false),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        metadata: jsonb(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "social_media_content_user_id_users_id_fk"
                }),
]);

export const projectComments = pgTable("project_comments", {
        id: serial().primaryKey().notNull(),
        projectId: integer("project_id").notNull(),
        userId: integer("user_id").notNull(),
        content: text().notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        attachments: jsonb(),
}, (table) => [
        foreignKey({
                        columns: [table.projectId],
                        foreignColumns: [projects.id],
                        name: "project_comments_project_id_projects_id_fk"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "project_comments_user_id_users_id_fk"
                }),
]);

export const projectMilestones = pgTable("project_milestones", {
        id: serial().primaryKey().notNull(),
        projectId: integer("project_id").notNull(),
        title: text().notNull(),
        titleEs: text("title_es"),
        description: text(),
        descriptionEs: text("description_es"),
        dueDate: timestamp("due_date", { mode: 'string' }),
        completedAt: timestamp("completed_at", { mode: 'string' }),
        status: text().default('pending').notNull(),
        sortOrder: integer("sort_order").default(0),
}, (table) => [
        foreignKey({
                        columns: [table.projectId],
                        foreignColumns: [projects.id],
                        name: "project_milestones_project_id_projects_id_fk"
                }),
]);

export const orders = pgTable("orders", {
        id: serial().primaryKey().notNull(),
        userId: integer("user_id").notNull(),
        status: text().default('pending').notNull(),
        total: integer().notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
        stripePaymentId: text("stripe_payment_id"),
        stripeCustomerId: text("stripe_customer_id"),
        notes: text(),
        shippingAddress: jsonb("shipping_address"),
        paymentMethod: text("payment_method").default('stripe'),
        discountCode: text("discount_code"),
        discountAmount: integer("discount_amount").default(0),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "orders_user_id_users_id_fk"
                }),
]);

export const orderItems = pgTable("order_items", {
        id: serial().primaryKey().notNull(),
        orderId: integer("order_id").notNull(),
        serviceId: integer("service_id").notNull(),
        quantity: integer().default(1).notNull(),
        price: integer().notNull(),
        name: text().notNull(),
        description: text(),
}, (table) => [
        foreignKey({
                        columns: [table.orderId],
                        foreignColumns: [orders.id],
                        name: "order_items_order_id_orders_id_fk"
                }),
        foreignKey({
                        columns: [table.serviceId],
                        foreignColumns: [serviceTypes.id],
                        name: "order_items_service_id_service_types_id_fk"
                }),
]);

export const projectUpdates = pgTable("project_updates", {
        id: serial().primaryKey().notNull(),
        projectId: integer("project_id").notNull(),
        userId: integer("user_id").notNull(),
        content: text().notNull(),
        contentEs: text("content_es"),
        attachments: jsonb(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        isPublic: boolean("is_public").default(true),
}, (table) => [
        foreignKey({
                        columns: [table.projectId],
                        foreignColumns: [projects.id],
                        name: "project_updates_project_id_projects_id_fk"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "project_updates_user_id_users_id_fk"
                }),
]);

export const session = pgTable("session", {
        sid: varchar().primaryKey().notNull(),
        sess: json().notNull(),
        expire: timestamp({ precision: 6, mode: 'string' }).notNull(),
}, (table) => [
        index("IDX_session_expire").using("btree", table.expire.asc().nullsLast().op("timestamp_ops")),
]);

export const invoices = pgTable("invoices", {
        id: serial().primaryKey().notNull(),
        userId: integer("user_id").notNull(),
        projectId: integer("project_id"),
        number: varchar({ length: 50 }).notNull(),
        description: text().notNull(),
        status: text().default('pending').notNull(),
        issueDate: timestamp("issue_date", { mode: 'string' }).defaultNow().notNull(),
        dueDate: timestamp("due_date", { mode: 'string' }).notNull(),
        total: numeric({ precision: 10, scale:  2 }).notNull(),
        notes: text(),
        paymentMethod: text("payment_method").default(''),
        paymentDate: timestamp("payment_date", { mode: 'string' }),
        stripeInvoiceId: text("stripe_invoice_id"),
        stripePaymentIntentId: text("stripe_payment_intent_id"),
        paypalOrderId: text("paypal_order_id"),
        items: jsonb(),
        metadata: jsonb(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        updatedAt: timestamp("updated_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "invoices_user_id_fkey"
                }),
        foreignKey({
                        columns: [table.projectId],
                        foreignColumns: [projects.id],
                        name: "invoices_project_id_fkey"
                }),
        unique("invoices_number_key").on(table.number),
]);

export const paymentRecords = pgTable("payment_records", {
        id: serial().primaryKey().notNull(),
        invoiceId: integer("invoice_id").notNull(),
        userId: integer("user_id").notNull(),
        amount: numeric({ precision: 10, scale:  2 }).notNull(),
        paymentMethod: text("payment_method").notNull(),
        paymentDate: timestamp("payment_date", { mode: 'string' }).defaultNow().notNull(),
        status: text().default('completed').notNull(),
        transactionId: text("transaction_id"),
        metadata: jsonb(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
}, (table) => [
        foreignKey({
                        columns: [table.invoiceId],
                        foreignColumns: [invoices.id],
                        name: "payment_records_invoice_id_fkey"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "payment_records_user_id_fkey"
                }),
]);

export const users = pgTable("users", {
        id: serial().primaryKey().notNull(),
        username: text().notNull(),
        password: text().notNull(),
        email: text().notNull(),
        role: text().default('user').notNull(),
        language: text().default('en').notNull(),
        isActive: boolean("is_active").default(true).notNull(),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow().notNull(),
        emailVerified: boolean("email_verified").default(false),
        verificationToken: text("verification_token"),
        verificationTokenExpiry: timestamp("verification_token_expiry", { mode: 'string' }),
        resetPasswordToken: text("reset_password_token"),
        resetPasswordTokenExpiry: timestamp("reset_password_token_expiry", { mode: 'string' }),
        firstName: varchar("first_name", { length: 255 }).notNull(),
        lastName: varchar("last_name", { length: 255 }).notNull(),
        phone: varchar({ length: 20 }),
        adminLevel: integer("admin_level").default(0),
        permissions: jsonb().default({}),
}, (table) => [
        unique("users_username_unique").on(table.username),
        unique("users_email_unique").on(table.email),
]);

export const projectUsers = pgTable("project_users", {
        id: serial().primaryKey().notNull(),
        projectId: integer("project_id").notNull(),
        userId: integer("user_id").notNull(),
        role: text().default('member'),
        createdAt: timestamp("created_at", { mode: 'string' }).defaultNow(),
}, (table) => [
        foreignKey({
                        columns: [table.projectId],
                        foreignColumns: [projects.id],
                        name: "project_users_project_id_fkey"
                }),
        foreignKey({
                        columns: [table.userId],
                        foreignColumns: [users.id],
                        name: "project_users_user_id_fkey"
                }),
        unique("project_users_project_id_user_id_key").on(table.projectId, table.userId),
]);
