import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertUserSchema, insertCustomerSchema, insertAssetSchema, insertLoanSchema, insertPaymentSchema } from "@shared/schema";
import { z } from "zod";
import session from "express-session";

// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session?.user) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

// Admin only middleware
const isAdmin = (req: any, res: any, next: any) => {
  if (req.session?.user?.role === 'admin') {
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize session
  app.use(session({
    secret: process.env.SESSION_SECRET || 'lms-secret-key',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: false, // Set to true in production with HTTPS
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Initialize default data
  await storage.initializeDefaultData();

  // Authentication routes
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // In a real app, use bcrypt.compare
      if (password !== user.password) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.user = {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
      };

      // Create audit log
      await storage.createAuditLog({
        userId: user.id,
        action: 'LOGIN',
        entityType: 'USER',
        entityId: user.id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ user: req.session.user });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get('/api/auth/user', isAuthenticated, (req: any, res) => {
    res.json({ user: req.session.user });
  });

  // Dashboard routes
  app.get('/api/dashboard/metrics', isAuthenticated, async (req, res) => {
    try {
      const metrics = await storage.getDashboardMetrics();
      res.json(metrics);
    } catch (error) {
      console.error('Dashboard metrics error:', error);
      res.status(500).json({ message: "Failed to fetch dashboard metrics" });
    }
  });

  // Customer routes
  app.get('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      res.json(customers);
    } catch (error) {
      console.error('Get customers error:', error);
      res.status(500).json({ message: "Failed to fetch customers" });
    }
  });

  app.get('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customer = await storage.getCustomerById(id);
      if (!customer) {
        return res.status(404).json({ message: "Customer not found" });
      }
      res.json(customer);
    } catch (error) {
      console.error('Get customer error:', error);
      res.status(500).json({ message: "Failed to fetch customer" });
    }
  });

  app.post('/api/customers', isAuthenticated, async (req, res) => {
    try {
      const customerData = insertCustomerSchema.parse(req.body);
      const customer = await storage.createCustomer(customerData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'CREATE',
        entityType: 'CUSTOMER',
        entityId: customer.id.toString(),
        newValues: customerData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(customer);
    } catch (error) {
      console.error('Create customer error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create customer" });
    }
  });

  app.put('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const customerData = insertCustomerSchema.partial().parse(req.body);
      
      const oldCustomer = await storage.getCustomerById(id);
      const customer = await storage.updateCustomer(id, customerData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'UPDATE',
        entityType: 'CUSTOMER',
        entityId: customer.id.toString(),
        oldValues: oldCustomer,
        newValues: customerData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(customer);
    } catch (error) {
      console.error('Update customer error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update customer" });
    }
  });

  app.delete('/api/customers/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteCustomer(id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'DELETE',
        entityType: 'CUSTOMER',
        entityId: id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json({ message: "Customer deleted successfully" });
    } catch (error) {
      console.error('Delete customer error:', error);
      res.status(500).json({ message: "Failed to delete customer" });
    }
  });

  // Loan routes
  app.get('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const { status, customerId } = req.query;
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (customerId) filters.customerId = parseInt(customerId as string);
      
      const loans = await storage.getLoans(filters);
      res.json(loans);
    } catch (error) {
      console.error('Get loans error:', error);
      res.status(500).json({ message: "Failed to fetch loans" });
    }
  });

  app.get('/api/loans/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loan = await storage.getLoanById(id);
      if (!loan) {
        return res.status(404).json({ message: "Loan not found" });
      }
      res.json(loan);
    } catch (error) {
      console.error('Get loan error:', error);
      res.status(500).json({ message: "Failed to fetch loan" });
    }
  });

  app.post('/api/loans', isAuthenticated, async (req, res) => {
    try {
      const loanData = insertLoanSchema.parse({
        ...req.body,
        createdBy: req.session.user.id,
      });
      
      // Create asset if provided
      let assetId = loanData.assetId;
      if (req.body.asset && !assetId) {
        const assetData = insertAssetSchema.parse(req.body.asset);
        const asset = await storage.createAsset(assetData);
        assetId = asset.id;
      }

      const loan = await storage.createLoan({ ...loanData, assetId });
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'CREATE',
        entityType: 'LOAN',
        entityId: loan.id.toString(),
        newValues: loanData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(loan);
    } catch (error) {
      console.error('Create loan error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create loan" });
    }
  });

  app.put('/api/loans/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loanData = insertLoanSchema.partial().parse(req.body);
      
      const loan = await storage.updateLoan(id, loanData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'UPDATE',
        entityType: 'LOAN',
        entityId: loan.id.toString(),
        newValues: loanData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(loan);
    } catch (error) {
      console.error('Update loan error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update loan" });
    }
  });

  app.post('/api/loans/:id/approve', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loan = await storage.approveLoan(id, req.session.user.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'APPROVE',
        entityType: 'LOAN',
        entityId: loan.id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(loan);
    } catch (error) {
      console.error('Approve loan error:', error);
      res.status(500).json({ message: "Failed to approve loan" });
    }
  });

  app.post('/api/loans/:id/reject', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const loan = await storage.rejectLoan(id, req.session.user.id);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'REJECT',
        entityType: 'LOAN',
        entityId: loan.id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.json(loan);
    } catch (error) {
      console.error('Reject loan error:', error);
      res.status(500).json({ message: "Failed to reject loan" });
    }
  });

  app.get('/api/loans/:id/emi-schedule', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schedule = await storage.getEMISchedule(id);
      res.json(schedule);
    } catch (error) {
      console.error('Get EMI schedule error:', error);
      res.status(500).json({ message: "Failed to fetch EMI schedule" });
    }
  });

  // EMI Schedule routes
  app.get('/api/emi-schedules', isAuthenticated, async (req, res) => {
    try {
      const { status, overdue } = req.query;
      const filters: any = {};
      if (status && status !== 'all') filters.status = status as string;
      if (overdue === 'true') filters.overdue = true;
      
      const schedules = await storage.getAllEMISchedules(filters);
      res.json(schedules);
    } catch (error) {
      console.error('Get EMI schedules error:', error);
      res.status(500).json({ message: "Failed to fetch EMI schedules" });
    }
  });

  // Payment routes
  app.get('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const { loanId, status } = req.query;
      const filters: any = {};
      if (loanId) filters.loanId = parseInt(loanId as string);
      if (status && status !== 'all') filters.status = status as string;
      
      const payments = await storage.getPayments(filters);
      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ message: "Failed to fetch payments" });
    }
  });

  app.post('/api/payments', isAuthenticated, async (req, res) => {
    try {
      const paymentData = insertPaymentSchema.parse({
        ...req.body,
        createdBy: req.session.user.id,
        paymentDate: new Date(req.body.paymentDate),
      });
      
      const payment = await storage.createPayment(paymentData);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'CREATE',
        entityType: 'PAYMENT',
        entityId: payment.id.toString(),
        newValues: paymentData,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(payment);
    } catch (error) {
      console.error('Create payment error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create payment" });
    }
  });

  // Accounting routes
  app.get('/api/accounts', isAuthenticated, async (req, res) => {
    try {
      const accounts = await storage.getAccounts();
      res.json(accounts);
    } catch (error) {
      console.error('Get accounts error:', error);
      res.status(500).json({ message: "Failed to fetch accounts" });
    }
  });

  app.get('/api/ledger', isAuthenticated, async (req, res) => {
    try {
      const { accountId, fromDate, toDate } = req.query;
      const entries = await storage.getLedgerEntries(
        accountId ? parseInt(accountId as string) : undefined,
        fromDate as string,
        toDate as string
      );
      res.json(entries);
    } catch (error) {
      console.error('Get ledger entries error:', error);
      res.status(500).json({ message: "Failed to fetch ledger entries" });
    }
  });

  app.get('/api/account-balances', isAuthenticated, async (req, res) => {
    try {
      const balances = await storage.getAccountBalances();
      res.json(balances);
    } catch (error) {
      console.error('Get account balances error:', error);
      res.status(500).json({ message: "Failed to fetch account balances" });
    }
  });

  app.post('/api/journal-entries', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { entryDate, description, lines } = req.body;
      
      const entryData = {
        entryDate,
        description,
        totalAmount: lines.reduce((sum: number, line: any) => 
          sum + Math.max(parseFloat(line.debitAmount) || 0, parseFloat(line.creditAmount) || 0), 0
        ).toString(),
        createdBy: req.session.user.id,
      };
      
      const journalEntry = await storage.createJournalEntry(entryData, lines);
      
      // Create audit log
      await storage.createAuditLog({
        userId: req.session.user.id,
        action: 'CREATE',
        entityType: 'JOURNAL_ENTRY',
        entityId: journalEntry.id.toString(),
        newValues: { entryData, lines },
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      res.status(201).json(journalEntry);
    } catch (error) {
      console.error('Create journal entry error:', error);
      res.status(500).json({ message: "Failed to create journal entry" });
    }
  });

  // Penalty calculation job (would typically be run as a cron job)
  app.post('/api/calculate-penalties', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.calculateAndUpdatePenalties();
      res.json({ message: "Penalties calculated and updated successfully" });
    } catch (error) {
      console.error('Calculate penalties error:', error);
      res.status(500).json({ message: "Failed to calculate penalties" });
    }
  });

  // Reports routes (basic implementation)
  app.get('/api/reports/portfolio', isAuthenticated, async (req, res) => {
    try {
      const loans = await storage.getLoans();
      const metrics = await storage.getDashboardMetrics();
      
      const report = {
        summary: metrics,
        loans: loans.map(loan => ({
          loanId: loan.loanId,
          customerName: loan.customer.fullName,
          principalAmount: loan.principalAmount,
          interestRate: loan.interestRate,
          status: loan.status,
          disbursedDate: loan.startDate,
          outstandingAmount: loan.outstandingAmount,
        })),
        generatedAt: new Date().toISOString(),
        generatedBy: req.session.user.fullName,
      };
      
      res.json(report);
    } catch (error) {
      console.error('Portfolio report error:', error);
      res.status(500).json({ message: "Failed to generate portfolio report" });
    }
  });

  app.get('/api/reports/customer-ledger', isAuthenticated, async (req, res) => {
    try {
      const customers = await storage.getCustomers();
      const customerLedgers = [];
      
      for (const customer of customers) {
        const customerWithLoans = await storage.getCustomerById(customer.id);
        if (customerWithLoans) {
          customerLedgers.push({
            customerId: customer.customerId,
            customerName: customer.fullName,
            activeLoans: customerWithLoans.loans.length,
            totalOutstanding: customerWithLoans.loans.reduce((sum, loan) => 
              sum + parseFloat(loan.outstandingAmount || loan.principalAmount), 0
            ),
            loans: customerWithLoans.loans,
          });
        }
      }
      
      const report = {
        customerLedgers,
        generatedAt: new Date().toISOString(),
        generatedBy: req.session.user.fullName,
      };
      
      res.json(report);
    } catch (error) {
      console.error('Customer ledger report error:', error);
      res.status(500).json({ message: "Failed to generate customer ledger report" });
    }
  });

  app.get('/api/reports/collection', isAuthenticated, async (req, res) => {
    try {
      const payments = await storage.getPayments();
      const emiSchedules = await storage.getAllEMISchedules();
      
      const today = new Date().toISOString().split('T')[0];
      const thisMonth = new Date().getMonth();
      const thisYear = new Date().getFullYear();
      
      const report = {
        summary: {
          totalCollectedToday: payments
            .filter(p => p.paymentDate.toISOString().split('T')[0] === today)
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
          totalCollectedThisMonth: payments
            .filter(p => {
              const paymentDate = new Date(p.paymentDate);
              return paymentDate.getMonth() === thisMonth && paymentDate.getFullYear() === thisYear;
            })
            .reduce((sum, p) => sum + parseFloat(p.amount), 0),
          overdueCount: emiSchedules.filter(emi => 
            emi.status === 'overdue' || (emi.status === 'unpaid' && new Date(emi.dueDate) < new Date())
          ).length,
          collectionEfficiency: 85.2, // Would calculate based on actual data
        },
        payments: payments.slice(0, 100), // Limit for performance
        generatedAt: new Date().toISOString(),
        generatedBy: req.session.user.fullName,
      };
      
      res.json(report);
    } catch (error) {
      console.error('Collection report error:', error);
      res.status(500).json({ message: "Failed to generate collection report" });
    }
  });

  // Audit log route
  app.get('/api/audit-logs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Would implement audit log retrieval
      res.json({ message: "Audit log retrieval not fully implemented yet" });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({ message: "Failed to fetch audit logs" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
