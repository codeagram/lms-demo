import {
  users,
  customers,
  assets,
  loans,
  emiSchedule,
  payments,
  accounts,
  journalEntries,
  journalEntryLines,
  auditLog,
  loanWorkflowSteps,
  customFieldDefinitions,
  systemConfig,
  type User,
  type InsertUser,
  type Customer,
  type InsertCustomer,
  type Asset,
  type InsertAsset,
  type Loan,
  type InsertLoan,
  type LoanWithDetails,
  type CustomerWithLoans,
  type EMISchedule,
  type Payment,
  type InsertPayment,
  type PaymentWithDetails,
  type Account,
  type JournalEntry,
  type InsertJournalEntry,
  type JournalEntryLine,
  type AuditLog,
  type LoanWorkflowStep,
  type InsertLoanWorkflowStep,
  type CustomFieldDefinition,
  type InsertCustomFieldDefinition,
  type SystemConfig,
  type InsertSystemConfig,
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, and, gte, lte, sql, or, like, inArray } from "drizzle-orm";
import { calculateEMISchedule, calculatePenalty } from "./lib/financial-calculations";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Customer operations
  getCustomers(): Promise<Customer[]>;
  getCustomerById(id: number): Promise<CustomerWithLoans | undefined>;
  createCustomer(customer: InsertCustomer): Promise<Customer>;
  updateCustomer(id: number, customer: Partial<InsertCustomer>): Promise<Customer>;
  deleteCustomer(id: number): Promise<void>;
  
  // Asset operations
  createAsset(asset: InsertAsset): Promise<Asset>;
  getAssetById(id: number): Promise<Asset | undefined>;
  
  // Loan operations
  getLoans(filters?: { status?: string; customerId?: number }): Promise<LoanWithDetails[]>;
  getLoanById(id: number): Promise<LoanWithDetails | undefined>;
  createLoan(loan: InsertLoan): Promise<Loan>;
  updateLoan(id: number, loan: Partial<InsertLoan>): Promise<Loan>;
  approveLoan(id: number, approvedBy: number): Promise<Loan>;
  rejectLoan(id: number, approvedBy: number): Promise<Loan>;
  
  // EMI operations
  generateEMISchedule(loanId: number): Promise<EMISchedule[]>;
  getEMISchedule(loanId: number): Promise<EMISchedule[]>;
  getAllEMISchedules(filters?: { status?: string; overdue?: boolean }): Promise<(EMISchedule & { loan: Loan & { customer: Customer } })[]>;
  updateEMIStatus(emiId: number, status: string, paidAmount?: string, paidDate?: Date): Promise<void>;
  calculateAndUpdatePenalties(): Promise<void>;
  
  // Payment operations
  getPayments(filters?: { loanId?: number; status?: string }): Promise<PaymentWithDetails[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  
  // Accounting operations
  getAccounts(): Promise<Account[]>;
  createJournalEntry(entry: InsertJournalEntry, lines: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[]): Promise<JournalEntry>;
  getLedgerEntries(accountId?: number, fromDate?: string, toDate?: string): Promise<any[]>;
  getAccountBalances(): Promise<{ [key: string]: number }>;
  
  // Dashboard metrics
  getDashboardMetrics(): Promise<any>;
  
  // Audit operations
  createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void>;
  
  // Initialize default data
  initializeDefaultData(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getCustomers(): Promise<Customer[]> {
    return await db.select().from(customers).where(eq(customers.isActive, true));
  }

  async getCustomerById(id: number): Promise<CustomerWithLoans | undefined> {
    const [customer] = await db.select().from(customers).where(eq(customers.id, id));
    if (!customer) return undefined;

    const customerLoans = await db.select().from(loans).where(eq(loans.customerId, id));
    
    return {
      ...customer,
      loans: customerLoans,
    };
  }

  async createCustomer(insertCustomer: InsertCustomer): Promise<Customer> {
    // Generate customer ID
    const count = await db.select({ count: sql<number>`count(*)` }).from(customers);
    const customerId = `CU${String(count[0].count + 1).padStart(3, '0')}`;

    const [customer] = await db
      .insert(customers)
      .values({ ...insertCustomer, customerId })
      .returning();
    return customer;
  }

  async updateCustomer(id: number, updateCustomer: Partial<InsertCustomer>): Promise<Customer> {
    const [customer] = await db
      .update(customers)
      .set({ ...updateCustomer, updatedAt: new Date() })
      .where(eq(customers.id, id))
      .returning();
    return customer;
  }

  async deleteCustomer(id: number): Promise<void> {
    await db
      .update(customers)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(customers.id, id));
  }

  async createAsset(insertAsset: InsertAsset): Promise<Asset> {
    const [asset] = await db
      .insert(assets)
      .values(insertAsset)
      .returning();
    return asset;
  }

  async getAssetById(id: number): Promise<Asset | undefined> {
    const [asset] = await db.select().from(assets).where(eq(assets.id, id));
    return asset;
  }

  async getLoans(filters?: { status?: string; customerId?: number }): Promise<LoanWithDetails[]> {
    let query = db
      .select({
        loan: loans,
        customer: customers,
        asset: assets,
        creator: { id: users.id, fullName: users.fullName, email: users.email },
      })
      .from(loans)
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(assets, eq(loans.assetId, assets.id))
      .innerJoin(users, eq(loans.createdBy, users.id));

    const conditions = [];
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(loans.status, filters.status));
    }
    if (filters?.customerId) {
      conditions.push(eq(loans.customerId, filters.customerId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const loansWithDetails = await query.orderBy(desc(loans.createdAt));

    // Get EMI schedules and payments for each loan
    const result = [];
    for (const row of loansWithDetails) {
      const emiScheduleData = await db.select().from(emiSchedule).where(eq(emiSchedule.loanId, row.loan.id));
      const paymentsData = await db.select().from(payments).where(eq(payments.loanId, row.loan.id));
      
      result.push({
        ...row.loan,
        customer: row.customer,
        asset: row.asset,
        creator: row.creator,
        emiSchedule: emiScheduleData,
        payments: paymentsData,
      });
    }

    return result as LoanWithDetails[];
  }

  async getLoanById(id: number): Promise<LoanWithDetails | undefined> {
    const [loanData] = await db
      .select({
        loan: loans,
        customer: customers,
        asset: assets,
        creator: { id: users.id, fullName: users.fullName, email: users.email },
      })
      .from(loans)
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(assets, eq(loans.assetId, assets.id))
      .innerJoin(users, eq(loans.createdBy, users.id))
      .where(eq(loans.id, id));

    if (!loanData) return undefined;

    const emiScheduleData = await db.select().from(emiSchedule).where(eq(emiSchedule.loanId, id));
    const paymentsData = await db.select().from(payments).where(eq(payments.loanId, id));

    return {
      ...loanData.loan,
      customer: loanData.customer,
      asset: loanData.asset,
      creator: loanData.creator,
      emiSchedule: emiScheduleData,
      payments: paymentsData,
    } as LoanWithDetails;
  }

  async createLoan(insertLoan: InsertLoan): Promise<Loan> {
    // Generate loan ID
    const count = await db.select({ count: sql<number>`count(*)` }).from(loans);
    const loanId = `LN${String(count[0].count + 1).padStart(3, '0')}`;

    const [loan] = await db
      .insert(loans)
      .values({ ...insertLoan, loanId })
      .returning();
    return loan;
  }

  async updateLoan(id: number, updateLoan: Partial<InsertLoan>): Promise<Loan> {
    const [loan] = await db
      .update(loans)
      .set({ ...updateLoan, updatedAt: new Date() })
      .where(eq(loans.id, id))
      .returning();
    return loan;
  }

  async approveLoan(id: number, approvedBy: number): Promise<Loan> {
    const [loan] = await db
      .update(loans)
      .set({
        status: 'approved',
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();

    // Generate EMI schedule
    await this.generateEMISchedule(id);

    // Create accounting entry for loan disbursement
    await this.createLoanDisbursementEntry(loan);

    return loan;
  }

  async rejectLoan(id: number, approvedBy: number): Promise<Loan> {
    const [loan] = await db
      .update(loans)
      .set({
        status: 'rejected',
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(loans.id, id))
      .returning();

    return loan;
  }

  async generateEMISchedule(loanId: number): Promise<EMISchedule[]> {
    const loan = await this.getLoanById(loanId);
    if (!loan) throw new Error('Loan not found');

    // Calculate EMI schedule using financial calculations
    const schedule = calculateEMISchedule({
      principal: parseFloat(loan.principalAmount),
      interestRate: parseFloat(loan.interestRate),
      tenure: loan.tenure,
      interestType: loan.interestType as 'flat' | 'reducing',
      startDate: loan.startDate!,
      frequency: loan.repaymentFrequency as 'monthly' | 'weekly',
    });

    // Insert EMI schedule
    const emiData = schedule.map((emi, index) => ({
      loanId,
      installmentNumber: index + 1,
      dueDate: emi.dueDate,
      emiAmount: emi.emiAmount.toString(),
      principalAmount: emi.principalAmount.toString(),
      interestAmount: emi.interestAmount.toString(),
      penaltyAmount: "0",
      totalAmount: emi.emiAmount.toString(),
      outstandingBalance: emi.outstandingBalance.toString(),
    }));

    await db.insert(emiSchedule).values(emiData);

    // Update loan with calculated totals
    const totalInterest = schedule.reduce((sum, emi) => sum + emi.interestAmount, 0);
    const totalAmount = parseFloat(loan.principalAmount) + totalInterest;
    const emiAmount = schedule[0]?.emiAmount || 0;

    await db
      .update(loans)
      .set({
        emiAmount: emiAmount.toString(),
        totalInterest: totalInterest.toString(),
        totalAmount: totalAmount.toString(),
        outstandingAmount: totalAmount.toString(),
        status: 'active',
      })
      .where(eq(loans.id, loanId));

    return await db.select().from(emiSchedule).where(eq(emiSchedule.loanId, loanId));
  }

  async getEMISchedule(loanId: number): Promise<EMISchedule[]> {
    return await db
      .select()
      .from(emiSchedule)
      .where(eq(emiSchedule.loanId, loanId))
      .orderBy(emiSchedule.installmentNumber);
  }

  async getAllEMISchedules(filters?: { status?: string; overdue?: boolean }): Promise<(EMISchedule & { loan: Loan & { customer: Customer } })[]> {
    let query = db
      .select({
        emi: emiSchedule,
        loan: loans,
        customer: customers,
      })
      .from(emiSchedule)
      .innerJoin(loans, eq(emiSchedule.loanId, loans.id))
      .innerJoin(customers, eq(loans.customerId, customers.id));

    const conditions = [];
    if (filters?.status && filters.status !== 'all') {
      conditions.push(eq(emiSchedule.status, filters.status));
    }
    if (filters?.overdue) {
      conditions.push(
        and(
          eq(emiSchedule.status, 'unpaid'),
          sql`${emiSchedule.dueDate} < current_date`
        )
      );
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query.orderBy(emiSchedule.dueDate);

    return results.map(row => ({
      ...row.emi,
      loan: { ...row.loan, customer: row.customer },
    }));
  }

  async updateEMIStatus(
    emiId: number,
    status: string,
    paidAmount?: string,
    paidDate?: Date
  ): Promise<void> {
    await db
      .update(emiSchedule)
      .set({
        status,
        paidAmount: paidAmount || "0",
        paidDate,
      })
      .where(eq(emiSchedule.id, emiId));
  }

  async calculateAndUpdatePenalties(): Promise<void> {
    // Get all unpaid EMIs that are past due
    const overdueEMIs = await db
      .select()
      .from(emiSchedule)
      .innerJoin(loans, eq(emiSchedule.loanId, loans.id))
      .where(
        and(
          eq(emiSchedule.status, 'unpaid'),
          sql`${emiSchedule.dueDate} < current_date`
        )
      );

    for (const emiRow of overdueEMIs) {
      const emi = emiRow.emi_schedule;
      const loan = emiRow.loans;
      
      const penalty = calculatePenalty(
        parseFloat(emi.emiAmount),
        emi.dueDate,
        loan.gracePeriod
      );

      if (penalty > 0) {
        await db
          .update(emiSchedule)
          .set({
            penaltyAmount: penalty.toString(),
            totalAmount: (parseFloat(emi.emiAmount) + penalty).toString(),
            status: 'overdue',
          })
          .where(eq(emiSchedule.id, emi.id));
      }
    }
  }

  async getPayments(filters?: { loanId?: number; status?: string }): Promise<PaymentWithDetails[]> {
    let query = db
      .select({
        payment: payments,
        loan: loans,
        customer: customers,
        emi: emiSchedule,
        createdBy: { id: users.id, fullName: users.fullName },
      })
      .from(payments)
      .innerJoin(loans, eq(payments.loanId, loans.id))
      .innerJoin(customers, eq(loans.customerId, customers.id))
      .leftJoin(emiSchedule, eq(payments.emiId, emiSchedule.id))
      .innerJoin(users, eq(payments.createdBy, users.id));

    const conditions = [];
    if (filters?.loanId) {
      conditions.push(eq(payments.loanId, filters.loanId));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const paymentsWithDetails = await query.orderBy(desc(payments.createdAt));

    return paymentsWithDetails.map(row => ({
      ...row.payment,
      loan: { ...row.loan, customer: row.customer },
      emi: row.emi,
      createdBy: row.createdBy,
    })) as PaymentWithDetails[];
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    // Generate payment ID
    const count = await db.select({ count: sql<number>`count(*)` }).from(payments);
    const paymentId = `PMT${String(count[0].count + 1).padStart(3, '0')}`;

    const [payment] = await db
      .insert(payments)
      .values({ ...insertPayment, paymentId })
      .returning();

    // Update EMI status if payment is for a specific EMI
    if (insertPayment.emiId) {
      const [currentEmi] = await db
        .select()
        .from(emiSchedule)
        .where(eq(emiSchedule.id, insertPayment.emiId));

      if (currentEmi) {
        const paidAmount = parseFloat(currentEmi.paidAmount) + parseFloat(insertPayment.amount);
        const totalAmount = parseFloat(currentEmi.totalAmount);
        
        let status = 'partial';
        if (paidAmount >= totalAmount) {
          status = 'paid';
        }

        await this.updateEMIStatus(
          insertPayment.emiId,
          status,
          paidAmount.toString(),
          new Date()
        );
      }
    }

    // Create accounting entries
    await this.createPaymentAccountingEntries(payment);

    return payment;
  }

  private async createLoanDisbursementEntry(loan: Loan): Promise<void> {
    const entryCount = await db.select({ count: sql<number>`count(*)` }).from(journalEntries);
    const entryNumber = `JE${String(entryCount[0].count + 1).padStart(3, '0')}`;

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        entryNumber,
        entryDate: loan.startDate || new Date().toISOString().split('T')[0],
        reference: loan.loanId,
        description: `Loan Disbursement - ${loan.loanId}`,
        totalAmount: loan.principalAmount,
        createdBy: loan.createdBy,
      })
      .returning();

    const lines = [
      {
        accountId: 2, // Loan Receivable account
        debitAmount: loan.principalAmount,
        creditAmount: "0",
        description: `Loan disbursed to customer`,
      },
      {
        accountId: 1, // Cash & Bank account
        debitAmount: "0",
        creditAmount: loan.principalAmount,
        description: `Cash disbursed for loan ${loan.loanId}`,
      },
    ];

    await db.insert(journalEntryLines).values(
      lines.map(line => ({ ...line, journalEntryId: journalEntry.id }))
    );
  }

  private async createPaymentAccountingEntries(payment: Payment): Promise<void> {
    // Create journal entry for payment
    const entryCount = await db.select({ count: sql<number>`count(*)` }).from(journalEntries);
    const entryNumber = `JE${String(entryCount[0].count + 1).padStart(3, '0')}`;

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({
        entryNumber,
        entryDate: payment.paymentDate.toISOString().split('T')[0],
        reference: payment.paymentId,
        description: `Payment received - ${payment.paymentId}`,
        totalAmount: payment.amount,
        createdBy: payment.createdBy,
      })
      .returning();

    // Get the loan details to split principal and interest
    const loan = await this.getLoanById(payment.loanId);
    if (!loan) return;

    // Get EMI details if available
    let principalSplit = 0.7; // Default split
    let interestSplit = 0.3;
    
    if (payment.emiId) {
      const [emi] = await db.select().from(emiSchedule).where(eq(emiSchedule.id, payment.emiId));
      if (emi) {
        const totalEmi = parseFloat(emi.emiAmount);
        principalSplit = parseFloat(emi.principalAmount) / totalEmi;
        interestSplit = parseFloat(emi.interestAmount) / totalEmi;
      }
    }

    const principalAmount = (parseFloat(payment.amount) * principalSplit).toString();
    const interestAmount = (parseFloat(payment.amount) * interestSplit).toString();

    const lines = [
      {
        accountId: 1, // Cash & Bank account
        debitAmount: payment.amount,
        creditAmount: "0",
        description: `Cash received from ${loan.customer.fullName}`,
      },
      {
        accountId: 2, // Loan Receivable account
        debitAmount: "0",
        creditAmount: principalAmount,
        description: `Principal payment from ${loan.customer.fullName}`,
      },
      {
        accountId: 3, // Interest Income account
        debitAmount: "0",
        creditAmount: interestAmount,
        description: `Interest payment from ${loan.customer.fullName}`,
      },
    ];

    await db.insert(journalEntryLines).values(
      lines.map(line => ({ ...line, journalEntryId: journalEntry.id }))
    );

    // Update account balances
    await this.updateAccountBalances(lines);
  }

  private async updateAccountBalances(lines: any[]): Promise<void> {
    for (const line of lines) {
      const debitAmount = parseFloat(line.debitAmount) || 0;
      const creditAmount = parseFloat(line.creditAmount) || 0;
      const netAmount = debitAmount - creditAmount;

      await db
        .update(accounts)
        .set({
          balance: sql`${accounts.balance} + ${netAmount}`,
        })
        .where(eq(accounts.id, line.accountId));
    }
  }

  async getAccounts(): Promise<Account[]> {
    return await db.select().from(accounts).where(eq(accounts.isActive, true));
  }

  async createJournalEntry(
    insertEntry: InsertJournalEntry,
    lines: Omit<JournalEntryLine, 'id' | 'journalEntryId'>[]
  ): Promise<JournalEntry> {
    const entryCount = await db.select({ count: sql<number>`count(*)` }).from(journalEntries);
    const entryNumber = `JE${String(entryCount[0].count + 1).padStart(3, '0')}`;

    const [journalEntry] = await db
      .insert(journalEntries)
      .values({ ...insertEntry, entryNumber })
      .returning();

    await db.insert(journalEntryLines).values(
      lines.map(line => ({ ...line, journalEntryId: journalEntry.id }))
    );

    // Update account balances
    await this.updateAccountBalances(lines);

    return journalEntry;
  }

  async getLedgerEntries(accountId?: number, fromDate?: string, toDate?: string): Promise<any[]> {
    let query = db
      .select({
        id: journalEntryLines.id,
        date: journalEntries.entryDate,
        reference: journalEntries.reference,
        description: journalEntryLines.description,
        account: accounts.accountName,
        accountCode: accounts.accountCode,
        debitAmount: journalEntryLines.debitAmount,
        creditAmount: journalEntryLines.creditAmount,
        entryDescription: journalEntries.description,
      })
      .from(journalEntryLines)
      .innerJoin(journalEntries, eq(journalEntryLines.journalEntryId, journalEntries.id))
      .innerJoin(accounts, eq(journalEntryLines.accountId, accounts.id));

    const conditions = [];
    if (accountId) {
      conditions.push(eq(journalEntryLines.accountId, accountId));
    }
    if (fromDate) {
      conditions.push(gte(journalEntries.entryDate, fromDate));
    }
    if (toDate) {
      conditions.push(lte(journalEntries.entryDate, toDate));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    return await query.orderBy(desc(journalEntries.entryDate));
  }

  async getAccountBalances(): Promise<{ [key: string]: number }> {
    const accountsData = await this.getAccounts();
    const balances: { [key: string]: number } = {};
    
    for (const account of accountsData) {
      balances[account.accountCode] = parseFloat(account.balance);
    }
    
    return balances;
  }

  async getDashboardMetrics(): Promise<any> {
    const activeLoansCount = await db
      .select({ count: sql<number>`count(*)` })
      .from(loans)
      .where(eq(loans.status, 'active'));

    const totalDisbursed = await db
      .select({ total: sql<number>`coalesce(sum(${loans.principalAmount}), 0)` })
      .from(loans)
      .where(inArray(loans.status, ['active', 'closed']));

    const totalCollected = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments);

    const overdueLoans = await db
      .select({ count: sql<number>`count(distinct ${emiSchedule.loanId})` })
      .from(emiSchedule)
      .where(
        and(
          inArray(emiSchedule.status, ['unpaid', 'overdue']),
          sql`${emiSchedule.dueDate} < current_date`
        )
      );

    return {
      activeLoans: activeLoansCount[0].count,
      totalDisbursed: totalDisbursed[0].total,
      totalCollected: totalCollected[0].total,
      overdueLoans: overdueLoans[0].count,
    };
  }

  async createAuditLog(log: Omit<AuditLog, 'id' | 'createdAt'>): Promise<void> {
    await db.insert(auditLog).values(log);
  }

  async initializeDefaultData(): Promise<void> {
    // Check if data already exists
    const existingUsers = await db.select().from(users).limit(1);
    if (existingUsers.length > 0) return;

    // Create default users
    const adminUser = await this.createUser({
      email: 'admin@lms.com',
      password: 'admin123', // In real app, this should be hashed
      fullName: 'Admin User',
      role: 'admin',
    });

    const staffUser = await this.createUser({
      email: 'staff@lms.com',
      password: 'staff123', // In real app, this should be hashed
      fullName: 'Staff User',
      role: 'staff',
    });

    // Create default accounts for double-entry accounting
    const defaultAccounts = [
      { accountCode: 'CA001', accountName: 'Cash & Bank', accountType: 'asset', balance: '1000000' },
      { accountCode: 'LR001', accountName: 'Loan Receivables', accountType: 'asset', balance: '0' },
      { accountCode: 'II001', accountName: 'Interest Income', accountType: 'income', balance: '0' },
      { accountCode: 'PI001', accountName: 'Penalty Income', accountType: 'income', balance: '0' },
    ];

    await db.insert(accounts).values(defaultAccounts);

    // Create comprehensive sample customers
    const customers = [
      {
        fullName: 'Rajesh Kumar Singh',
        phone: '+91 9876543210',
        email: 'rajesh.kumar@email.com',
        address: '123 Main Street, New Delhi',
        idNumber: 'ABCDE1234F',
      },
      {
        fullName: 'Priya Singh',
        phone: '+91 9123456789',
        email: 'priya.singh@email.com',
        address: '456 Park Avenue, Mumbai',
        idNumber: 'FGHIJ5678K',
      },
      {
        fullName: 'Amit Sharma',
        phone: '+91 8765432109',
        email: 'amit.sharma@email.com',
        address: '789 Business District, Bangalore',
        idNumber: 'LMNOP9012Q',
      },
      {
        fullName: 'Sunita Patel',
        phone: '+91 7654321098',
        email: 'sunita.patel@email.com',
        address: '321 Garden Road, Pune',
        idNumber: 'RSTUV3456W',
      },
      {
        fullName: 'Vikram Reddy',
        phone: '+91 6543210987',
        email: 'vikram.reddy@email.com',
        address: '654 Tech Park, Hyderabad',
        idNumber: 'XYZAB7890C',
      },
      {
        fullName: 'Neeta Agarwal',
        phone: '+91 5432109876',
        email: 'neeta.agarwal@email.com',
        address: '987 Commercial Street, Kolkata',
        idNumber: 'DEFGH2345I',
      },
      {
        fullName: 'Rahul Mehta',
        phone: '+91 4321098765',
        email: 'rahul.mehta@email.com',
        address: '654 Industrial Area, Ahmedabad',
        idNumber: 'JKLMN6789O',
      },
      {
        fullName: 'Kavita Joshi',
        phone: '+91 3210987654',
        email: 'kavita.joshi@email.com',
        address: '852 Residential Complex, Jaipur',
        idNumber: 'PQRST0123U',
      },
    ];

    for (const customer of customers) {
      await this.createCustomer(customer);
    }

    // Create diverse assets
    const sampleCustomers = await this.getCustomers();
    const assets = [];
    
    if (sampleCustomers.length >= 6) {
      assets.push(
        await this.createAsset({
          type: 'Bike',
          make: 'Honda',
          model: 'Activa',
          registrationNumber: 'DL01AB1234',
          estimatedValue: '80000',
        }),
        await this.createAsset({
          type: 'Car',
          make: 'Maruti',
          model: 'Swift',
          registrationNumber: 'MH02CD5678',
          estimatedValue: '300000',
        }),
        await this.createAsset({
          type: 'Bike',
          make: 'Yamaha',
          model: 'FZ',
          registrationNumber: 'KA03EF9012',
          estimatedValue: '95000',
        }),
        await this.createAsset({
          type: 'Car',
          make: 'Hyundai',
          model: 'i20',
          registrationNumber: 'MH12GH3456',
          estimatedValue: '450000',
        }),
        await this.createAsset({
          type: 'Truck',
          make: 'Tata',
          model: 'Ace',
          registrationNumber: 'AP09IJ7890',
          estimatedValue: '650000',
        }),
        await this.createAsset({
          type: 'Property',
          make: 'Residential',
          model: 'Apartment',
          registrationNumber: 'PROP001',
          estimatedValue: '2500000',
        }),
        await this.createAsset({
          type: 'Machinery',
          make: 'JCB',
          model: '3DX',
          registrationNumber: 'MACH001',
          estimatedValue: '1200000',
        }),
        await this.createAsset({
          type: 'Car',
          make: 'Toyota',
          model: 'Innova',
          registrationNumber: 'RJ14XY7890',
          estimatedValue: '800000',
        })
      );

      // Create comprehensive loan portfolio with different statuses
      const loans = [];
      
      // Pending loans (awaiting approval)
      loans.push(
        await this.createLoan({
          customerId: sampleCustomers[0].id,
          assetId: assets[0].id,
          principalAmount: '250000',
          interestRate: '12.00',
          interestType: 'reducing',
          tenure: 24,
          repaymentFrequency: 'monthly',
          gracePeriod: 5,
          startDate: '2024-12-01',
          status: 'pending',
          notes: 'Vehicle loan for Honda Activa - excellent credit history, regular income',
          createdBy: staffUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[1].id,
          assetId: assets[1].id,
          principalAmount: '175000',
          interestRate: '15.00',
          interestType: 'flat',
          tenure: 18,
          repaymentFrequency: 'monthly',
          gracePeriod: 3,
          startDate: '2024-11-15',
          status: 'pending',
          notes: 'Vehicle loan for Maruti Swift - first time borrower, good employment record',
          createdBy: staffUser.id,
        })
      );

      // Active loans (approved and disbursed)
      loans.push(
        await this.createLoan({
          customerId: sampleCustomers[2].id,
          assetId: assets[2].id,
          principalAmount: '85000',
          interestRate: '14.50',
          interestType: 'reducing',
          tenure: 12,
          repaymentFrequency: 'monthly',
          gracePeriod: 7,
          startDate: '2024-06-01',
          status: 'active',
          notes: 'Quick loan for Yamaha FZ - business expansion, fast approval needed',
          createdBy: staffUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[3].id,
          assetId: assets[3].id,
          principalAmount: '380000',
          interestRate: '11.50',
          interestType: 'reducing',
          tenure: 36,
          repaymentFrequency: 'monthly',
          gracePeriod: 5,
          startDate: '2024-03-15',
          status: 'active',
          notes: 'Family car loan for Hyundai i20 - premium customer, long relationship',
          createdBy: staffUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[4].id,
          assetId: assets[4].id,
          principalAmount: '550000',
          interestRate: '16.00',
          interestType: 'flat',
          tenure: 48,
          repaymentFrequency: 'monthly',
          gracePeriod: 10,
          startDate: '2024-01-01',
          status: 'active',
          notes: 'Commercial vehicle loan for Tata Ace - logistics business expansion',
          createdBy: staffUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[5].id,
          assetId: assets[5].id,
          principalAmount: '1800000',
          interestRate: '10.50',
          interestType: 'reducing',
          tenure: 180,
          repaymentFrequency: 'monthly',
          gracePeriod: 15,
          startDate: '2023-12-01',
          status: 'active',
          notes: 'Home loan for residential apartment - long term investment, stable income',
          createdBy: adminUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[6].id,
          assetId: assets[6].id,
          principalAmount: '950000',
          interestRate: '18.00',
          interestType: 'flat',
          tenure: 60,
          repaymentFrequency: 'monthly',
          gracePeriod: 5,
          startDate: '2024-02-01',
          status: 'active',
          notes: 'Heavy machinery loan for JCB 3DX - construction business',
          createdBy: staffUser.id,
        }),
        await this.createLoan({
          customerId: sampleCustomers[7].id,
          assetId: assets[7].id,
          principalAmount: '650000',
          interestRate: '13.50',
          interestType: 'reducing',
          tenure: 60,
          repaymentFrequency: 'monthly',
          gracePeriod: 7,
          startDate: '2024-04-01',
          status: 'active',
          notes: 'Family vehicle loan for Toyota Innova - excellent payment history',
          createdBy: staffUser.id,
        })
      );

      // Generate EMI schedules for active loans
      for (const loan of loans) {
        if (loan.status === 'active') {
          await this.generateEMISchedule(loan.id);
        }
      }

      // Create realistic payment records
      const activeLoans = loans.filter(loan => loan.status === 'active');
      if (activeLoans.length > 0) {
        // Payments for first active loan (multiple payments)
        await this.createPayment({
          loanId: activeLoans[0].id,
          amount: '8500.00',
          paymentDate: new Date('2024-07-01'),
          paymentMethod: 'bank_transfer',
          notes: 'First EMI payment - on time via NEFT',
          createdBy: staffUser.id,
        });
        
        await this.createPayment({
          loanId: activeLoans[0].id,
          amount: '8500.00',
          paymentDate: new Date('2024-08-01'),
          paymentMethod: 'cash',
          notes: 'Second EMI payment - cash collection at branch',
          createdBy: staffUser.id,
        });

        await this.createPayment({
          loanId: activeLoans[0].id,
          amount: '8500.00',
          paymentDate: new Date('2024-09-01'),
          paymentMethod: 'cheque',
          notes: 'Third EMI payment - cheque cleared successfully',
          createdBy: staffUser.id,
        });

        // Payments for second active loan
        if (activeLoans.length > 1) {
          await this.createPayment({
            loanId: activeLoans[1].id,
            amount: '15000.00',
            paymentDate: new Date('2024-04-15'),
            paymentMethod: 'bank_transfer',
            notes: 'Regular EMI payment - auto debit',
            createdBy: staffUser.id,
          });

          await this.createPayment({
            loanId: activeLoans[1].id,
            amount: '15000.00',
            paymentDate: new Date('2024-05-15'),
            paymentMethod: 'bank_transfer',
            notes: 'EMI payment via UPI',
            createdBy: staffUser.id,
          });

          await this.createPayment({
            loanId: activeLoans[1].id,
            amount: '15000.00',
            paymentDate: new Date('2024-06-15'),
            paymentMethod: 'online',
            notes: 'EMI payment via net banking',
            createdBy: staffUser.id,
          });
        }

        // Payments for third active loan
        if (activeLoans.length > 2) {
          await this.createPayment({
            loanId: activeLoans[2].id,
            amount: '60000.00',
            paymentDate: new Date('2024-02-01'),
            paymentMethod: 'bank_transfer',
            notes: 'Business loan EMI - regular payment',
            createdBy: staffUser.id,
          });

          await this.createPayment({
            loanId: activeLoans[2].id,
            amount: '60000.00',
            paymentDate: new Date('2024-03-01'),
            paymentMethod: 'cheque',
            notes: 'Business loan EMI - company cheque',
            createdBy: staffUser.id,
          });
        }

        // Payments for home loan (larger amounts)
        if (activeLoans.length > 3) {
          await this.createPayment({
            loanId: activeLoans[3].id,
            amount: '18500.00',
            paymentDate: new Date('2024-01-01'),
            paymentMethod: 'bank_transfer',
            notes: 'Home loan EMI - January payment',
            createdBy: staffUser.id,
          });

          await this.createPayment({
            loanId: activeLoans[3].id,
            amount: '18500.00',
            paymentDate: new Date('2024-02-01'),
            paymentMethod: 'bank_transfer',
            notes: 'Home loan EMI - February payment',
            createdBy: staffUser.id,
          });

          await this.createPayment({
            loanId: activeLoans[3].id,
            amount: '18500.00',
            paymentDate: new Date('2024-03-01'),
            paymentMethod: 'bank_transfer',
            notes: 'Home loan EMI - March payment',
            createdBy: staffUser.id,
          });
        }
      }
    }
  }
}

export const storage = new DatabaseStorage();
