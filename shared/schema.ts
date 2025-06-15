import { pgTable, text, serial, integer, decimal, timestamp, boolean, uuid, varchar, date, jsonb } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication and role management
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("staff"), // 'admin' or 'staff'
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Customers table
export const customers = pgTable("customers", {
  id: serial("id").primaryKey(),
  customerId: text("customer_id").notNull().unique(), // Auto-generated like CU001
  fullName: text("full_name").notNull(),
  phone: text("phone").notNull(),
  email: text("email"),
  address: text("address"),
  idNumber: text("id_number").notNull(), // PAN, Aadhaar, etc.
  referralCode: text("referral_code"), // Optional referral code
  panNumber: text("pan_number"),
  aadhaarNumber: text("aadhaar_number"),
  kycStatus: text("kyc_status").notNull().default("pending"), // 'pending', 'verified', 'rejected'
  kycVerifiedBy: integer("kyc_verified_by").references(() => users.id),
  kycVerifiedAt: timestamp("kyc_verified_at"),
  employmentStatus: text("employment_status").notNull().default("pending"), // 'pending', 'verified', 'rejected'
  employmentVerifiedBy: integer("employment_verified_by").references(() => users.id),
  employmentVerifiedAt: timestamp("employment_verified_at"),
  documents: jsonb("documents"), // Store uploaded document info
  lastRejectedAt: timestamp("last_rejected_at"), // Track rejection for cooldown
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Assets table
export const assets = pgTable("assets", {
  id: serial("id").primaryKey(),
  type: text("type").notNull(), // Bike, Car, etc.
  make: text("make"),
  model: text("model"),
  registrationNumber: text("registration_number"),
  estimatedValue: decimal("estimated_value", { precision: 12, scale: 2 }),
  documents: jsonb("documents"), // Store document info
  createdAt: timestamp("created_at").defaultNow(),
});

// Loans table
export const loans = pgTable("loans", {
  id: serial("id").primaryKey(),
  loanId: text("loan_id").notNull().unique(), // Auto-generated like LN001
  customerId: integer("customer_id").notNull().references(() => customers.id),
  assetId: integer("asset_id").references(() => assets.id),
  principalAmount: decimal("principal_amount", { precision: 12, scale: 2 }).notNull(),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }).notNull(),
  interestType: text("interest_type").notNull(), // 'flat' or 'reducing'
  tenure: integer("tenure").notNull(), // in months
  repaymentFrequency: text("repayment_frequency").notNull().default("monthly"), // 'monthly' or 'weekly'
  gracePeriod: integer("grace_period").notNull().default(0), // in days
  startDate: date("start_date"),
  status: text("status").notNull().default("draft"), // 'draft', 'pending', 'approved', 'rejected', 'active', 'closed'
  currentStep: text("current_step").notNull().default("basic_details"), // 'basic_details', 'verification', 'approval', 'disbursement', 'completed'
  agreementSigned: boolean("agreement_signed").notNull().default(false),
  agreementSignedBy: integer("agreement_signed_by").references(() => users.id),
  agreementSignedAt: timestamp("agreement_signed_at"),
  rejectionReason: text("rejection_reason"),
  customFields: jsonb("custom_fields"), // Store dynamic field values
  notes: text("notes"),
  emiAmount: decimal("emi_amount", { precision: 12, scale: 2 }),
  totalInterest: decimal("total_interest", { precision: 12, scale: 2 }),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }),
  outstandingAmount: decimal("outstanding_amount", { precision: 12, scale: 2 }),
  createdBy: integer("created_by").notNull().references(() => users.id),
  approvedBy: integer("approved_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// EMI Schedule table
export const emiSchedule = pgTable("emi_schedule", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loans.id),
  installmentNumber: integer("installment_number").notNull(),
  dueDate: date("due_date").notNull(),
  emiAmount: decimal("emi_amount", { precision: 12, scale: 2 }).notNull(),
  principalAmount: decimal("principal_amount", { precision: 12, scale: 2 }).notNull(),
  interestAmount: decimal("interest_amount", { precision: 12, scale: 2 }).notNull(),
  penaltyAmount: decimal("penalty_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull().default("unpaid"), // 'paid', 'unpaid', 'partial', 'overdue'
  paidAmount: decimal("paid_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  paidDate: timestamp("paid_date"),
  outstandingBalance: decimal("outstanding_balance", { precision: 12, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Payments table
export const payments = pgTable("payments", {
  id: serial("id").primaryKey(),
  paymentId: text("payment_id").notNull().unique(), // Auto-generated like PMT001
  loanId: integer("loan_id").notNull().references(() => loans.id),
  emiId: integer("emi_id").references(() => emiSchedule.id),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  paymentDate: timestamp("payment_date").notNull(),
  paymentMethod: text("payment_method").notNull().default("cash"), // 'cash', 'bank', 'cheque', etc.
  reference: text("reference"), // Cheque number, transaction ID, etc.
  notes: text("notes"),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Chart of Accounts for double-entry accounting
export const accounts = pgTable("accounts", {
  id: serial("id").primaryKey(),
  accountCode: text("account_code").notNull().unique(),
  accountName: text("account_name").notNull(),
  accountType: text("account_type").notNull(), // 'asset', 'liability', 'equity', 'income', 'expense'
  parentAccountId: integer("parent_account_id").references(() => accounts.id),
  balance: decimal("balance", { precision: 12, scale: 2 }).notNull().default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal Entries for double-entry accounting
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  entryNumber: text("entry_number").notNull().unique(),
  entryDate: date("entry_date").notNull(),
  reference: text("reference"), // Loan ID, Payment ID, etc.
  description: text("description").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Journal Entry Lines for individual debit/credit entries
export const journalEntryLines = pgTable("journal_entry_lines", {
  id: serial("id").primaryKey(),
  journalEntryId: integer("journal_entry_id").notNull().references(() => journalEntries.id),
  accountId: integer("account_id").notNull().references(() => accounts.id),
  debitAmount: decimal("debit_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  creditAmount: decimal("credit_amount", { precision: 12, scale: 2 }).notNull().default("0"),
  description: text("description"),
});

// Loan Workflow Steps table
export const loanWorkflowSteps = pgTable("loan_workflow_steps", {
  id: serial("id").primaryKey(),
  loanId: integer("loan_id").notNull().references(() => loans.id),
  step: text("step").notNull(), // 'basic_details', 'verification', 'approval', 'disbursement'
  status: text("status").notNull().default("pending"), // 'pending', 'completed', 'skipped'
  assignedUserId: integer("assigned_user_id").references(() => users.id),
  completedBy: integer("completed_by").references(() => users.id),
  completedAt: timestamp("completed_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Dynamic/Custom Fields Definition table
export const customFieldDefinitions = pgTable("custom_field_definitions", {
  id: serial("id").primaryKey(),
  fieldName: text("field_name").notNull(),
  fieldLabel: text("field_label").notNull(),
  fieldType: text("field_type").notNull(), // 'text', 'number', 'dropdown', 'boolean'
  options: jsonb("options"), // For dropdown options
  isRequired: boolean("is_required").notNull().default(false),
  isActive: boolean("is_active").notNull().default(true),
  sortOrder: integer("sort_order").notNull().default(0),
  createdBy: integer("created_by").notNull().references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// System Configuration table
export const systemConfig = pgTable("system_config", {
  id: serial("id").primaryKey(),
  configKey: text("config_key").notNull().unique(),
  configValue: text("config_value").notNull(),
  description: text("description"),
  updatedBy: integer("updated_by").notNull().references(() => users.id),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Audit Log table
export const auditLog = pgTable("audit_log", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  action: text("action").notNull(),
  entityType: text("entity_type").notNull(),
  entityId: text("entity_id").notNull(),
  oldValues: jsonb("old_values"),
  newValues: jsonb("new_values"),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  createdLoans: many(loans, { relationName: "loanCreator" }),
  approvedLoans: many(loans, { relationName: "loanApprover" }),
  payments: many(payments),
  journalEntries: many(journalEntries),
  auditLogs: many(auditLog),
}));

export const customersRelations = relations(customers, ({ one, many }) => ({
  loans: many(loans),
  kycVerifier: one(users, {
    fields: [customers.kycVerifiedBy],
    references: [users.id],
    relationName: "kycVerifier",
  }),
  employmentVerifier: one(users, {
    fields: [customers.employmentVerifiedBy],
    references: [users.id],
    relationName: "employmentVerifier",
  }),
}));

export const assetsRelations = relations(assets, ({ many }) => ({
  loans: many(loans),
}));

export const loansRelations = relations(loans, ({ one, many }) => ({
  customer: one(customers, {
    fields: [loans.customerId],
    references: [customers.id],
  }),
  asset: one(assets, {
    fields: [loans.assetId],
    references: [assets.id],
  }),
  creator: one(users, {
    fields: [loans.createdBy],
    references: [users.id],
    relationName: "loanCreator",
  }),
  approver: one(users, {
    fields: [loans.approvedBy],
    references: [users.id],
    relationName: "loanApprover",
  }),
  agreementSigner: one(users, {
    fields: [loans.agreementSignedBy],
    references: [users.id],
    relationName: "agreementSigner",
  }),
  emiSchedule: many(emiSchedule),
  payments: many(payments),
  workflowSteps: many(loanWorkflowSteps),
}));

export const emiScheduleRelations = relations(emiSchedule, ({ one, many }) => ({
  loan: one(loans, {
    fields: [emiSchedule.loanId],
    references: [loans.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  loan: one(loans, {
    fields: [payments.loanId],
    references: [loans.id],
  }),
  emi: one(emiSchedule, {
    fields: [payments.emiId],
    references: [emiSchedule.id],
  }),
  createdBy: one(users, {
    fields: [payments.createdBy],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one, many }) => ({
  parentAccount: one(accounts, {
    fields: [accounts.parentAccountId],
    references: [accounts.id],
  }),
  childAccounts: many(accounts),
  journalEntryLines: many(journalEntryLines),
}));

export const journalEntriesRelations = relations(journalEntries, ({ one, many }) => ({
  createdBy: one(users, {
    fields: [journalEntries.createdBy],
    references: [users.id],
  }),
  lines: many(journalEntryLines),
}));

export const journalEntryLinesRelations = relations(journalEntryLines, ({ one }) => ({
  journalEntry: one(journalEntries, {
    fields: [journalEntryLines.journalEntryId],
    references: [journalEntries.id],
  }),
  account: one(accounts, {
    fields: [journalEntryLines.accountId],
    references: [accounts.id],
  }),
}));

export const loanWorkflowStepsRelations = relations(loanWorkflowSteps, ({ one }) => ({
  loan: one(loans, {
    fields: [loanWorkflowSteps.loanId],
    references: [loans.id],
  }),
  assignedUser: one(users, {
    fields: [loanWorkflowSteps.assignedUserId],
    references: [users.id],
    relationName: "workflowAssignedUser",
  }),
  completedByUser: one(users, {
    fields: [loanWorkflowSteps.completedBy],
    references: [users.id],
    relationName: "workflowCompletedByUser",
  }),
}));

export const customFieldDefinitionsRelations = relations(customFieldDefinitions, ({ one }) => ({
  creator: one(users, {
    fields: [customFieldDefinitions.createdBy],
    references: [users.id],
  }),
}));

export const systemConfigRelations = relations(systemConfig, ({ one }) => ({
  updatedByUser: one(users, {
    fields: [systemConfig.updatedBy],
    references: [users.id],
  }),
}));

export const auditLogRelations = relations(auditLog, ({ one }) => ({
  user: one(users, {
    fields: [auditLog.userId],
    references: [users.id],
  }),
}));

// Zod schemas for validation
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCustomerSchema = createInsertSchema(customers).omit({
  id: true,
  customerId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAssetSchema = createInsertSchema(assets).omit({
  id: true,
  createdAt: true,
});

export const insertLoanSchema = createInsertSchema(loans).omit({
  id: true,
  loanId: true,
  createdAt: true,
  updatedAt: true,
});

export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  paymentId: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  entryNumber: true,
  createdAt: true,
});

export const insertLoanWorkflowStepSchema = createInsertSchema(loanWorkflowSteps).omit({
  id: true,
  createdAt: true,
});

export const insertCustomFieldDefinitionSchema = createInsertSchema(customFieldDefinitions).omit({
  id: true,
  createdAt: true,
});

export const insertSystemConfigSchema = createInsertSchema(systemConfig).omit({
  id: true,
  updatedAt: true,
});

// Export types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Customer = typeof customers.$inferSelect;
export type InsertCustomer = z.infer<typeof insertCustomerSchema>;
export type Asset = typeof assets.$inferSelect;
export type InsertAsset = z.infer<typeof insertAssetSchema>;
export type Loan = typeof loans.$inferSelect;
export type InsertLoan = z.infer<typeof insertLoanSchema>;
export type EMISchedule = typeof emiSchedule.$inferSelect;
export type Payment = typeof payments.$inferSelect;
export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type Account = typeof accounts.$inferSelect;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type JournalEntryLine = typeof journalEntryLines.$inferSelect;
export type AuditLog = typeof auditLog.$inferSelect;

// Extended types with relations
export type LoanWithDetails = Loan & {
  customer: Customer;
  asset?: Asset;
  creator: User;
  approver?: User;
  emiSchedule: EMISchedule[];
  payments: Payment[];
};

export type CustomerWithLoans = Customer & {
  loans: Loan[];
};

export type PaymentWithDetails = Payment & {
  loan: Loan & { customer: Customer };
  emi?: EMISchedule;
  createdBy: User;
};

export type LoanWorkflowStep = typeof loanWorkflowSteps.$inferSelect;
export type InsertLoanWorkflowStep = z.infer<typeof insertLoanWorkflowStepSchema>;

export type CustomFieldDefinition = typeof customFieldDefinitions.$inferSelect;
export type InsertCustomFieldDefinition = z.infer<typeof insertCustomFieldDefinitionSchema>;

export type SystemConfig = typeof systemConfig.$inferSelect;
export type InsertSystemConfig = z.infer<typeof insertSystemConfigSchema>;
