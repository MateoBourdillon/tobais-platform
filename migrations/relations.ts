import { relations } from "drizzle-orm/relations";
import { users, projects, serviceTypes, contactSubmissions, blogPosts, socialMediaContent, projectComments, projectMilestones, orders, orderItems, projectUpdates, invoices, paymentRecords, projectUsers } from "./schema";

export const projectsRelations = relations(projects, ({one, many}) => ({
	user_clientId: one(users, {
		fields: [projects.clientId],
		references: [users.id],
		relationName: "projects_clientId_users_id"
	}),
	user_userId: one(users, {
		fields: [projects.userId],
		references: [users.id],
		relationName: "projects_userId_users_id"
	}),
	projectComments: many(projectComments),
	projectMilestones: many(projectMilestones),
	projectUpdates: many(projectUpdates),
	invoices: many(invoices),
	projectUsers: many(projectUsers),
}));

export const usersRelations = relations(users, ({many}) => ({
	projects_clientId: many(projects, {
		relationName: "projects_clientId_users_id"
	}),
	projects_userId: many(projects, {
		relationName: "projects_userId_users_id"
	}),
	blogPosts: many(blogPosts),
	socialMediaContents: many(socialMediaContent),
	projectComments: many(projectComments),
	orders: many(orders),
	projectUpdates: many(projectUpdates),
	invoices: many(invoices),
	paymentRecords: many(paymentRecords),
	projectUsers: many(projectUsers),
}));

export const contactSubmissionsRelations = relations(contactSubmissions, ({one}) => ({
	serviceType: one(serviceTypes, {
		fields: [contactSubmissions.serviceId],
		references: [serviceTypes.id]
	}),
}));

export const serviceTypesRelations = relations(serviceTypes, ({many}) => ({
	contactSubmissions: many(contactSubmissions),
	orderItems: many(orderItems),
}));

export const blogPostsRelations = relations(blogPosts, ({one}) => ({
	user: one(users, {
		fields: [blogPosts.authorId],
		references: [users.id]
	}),
}));

export const socialMediaContentRelations = relations(socialMediaContent, ({one}) => ({
	user: one(users, {
		fields: [socialMediaContent.userId],
		references: [users.id]
	}),
}));

export const projectCommentsRelations = relations(projectComments, ({one}) => ({
	project: one(projects, {
		fields: [projectComments.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectComments.userId],
		references: [users.id]
	}),
}));

export const projectMilestonesRelations = relations(projectMilestones, ({one}) => ({
	project: one(projects, {
		fields: [projectMilestones.projectId],
		references: [projects.id]
	}),
}));

export const ordersRelations = relations(orders, ({one, many}) => ({
	user: one(users, {
		fields: [orders.userId],
		references: [users.id]
	}),
	orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({one}) => ({
	order: one(orders, {
		fields: [orderItems.orderId],
		references: [orders.id]
	}),
	serviceType: one(serviceTypes, {
		fields: [orderItems.serviceId],
		references: [serviceTypes.id]
	}),
}));

export const projectUpdatesRelations = relations(projectUpdates, ({one}) => ({
	project: one(projects, {
		fields: [projectUpdates.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectUpdates.userId],
		references: [users.id]
	}),
}));

export const invoicesRelations = relations(invoices, ({one, many}) => ({
	user: one(users, {
		fields: [invoices.userId],
		references: [users.id]
	}),
	project: one(projects, {
		fields: [invoices.projectId],
		references: [projects.id]
	}),
	paymentRecords: many(paymentRecords),
}));

export const paymentRecordsRelations = relations(paymentRecords, ({one}) => ({
	invoice: one(invoices, {
		fields: [paymentRecords.invoiceId],
		references: [invoices.id]
	}),
	user: one(users, {
		fields: [paymentRecords.userId],
		references: [users.id]
	}),
}));

export const projectUsersRelations = relations(projectUsers, ({one}) => ({
	project: one(projects, {
		fields: [projectUsers.projectId],
		references: [projects.id]
	}),
	user: one(users, {
		fields: [projectUsers.userId],
		references: [users.id]
	}),
}));