# Loan Management System (LMS)

## Overview

This is a comprehensive Loan Management System built for financial institutions to handle customer loans, asset management, payment tracking, and accounting operations. The system provides role-based access control with admin and staff roles, complete financial calculations for EMI schedules, and real-time tracking of loan performance.

## System Architecture

The application follows a full-stack architecture with clear separation between client and server:

### Frontend Architecture
- **Framework**: React 18 with TypeScript
- **UI Library**: Shadcn/ui components built on Radix UI primitives
- **Styling**: Tailwind CSS with custom design system
- **State Management**: TanStack Query for server state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js
- **Language**: TypeScript with ES modules
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Session Management**: Express sessions with PostgreSQL store
- **Development**: Vite for development server and HMR

## Key Components

### Authentication & Authorization
- **Session-based authentication** using express-session
- **Role-based access control** (admin/staff roles)
- **Permission system** for different operations (loan approval, record deletion, etc.)
- **Middleware protection** for sensitive routes

### Database Layer
- **PostgreSQL** as primary database
- **Drizzle ORM** for type-safe database operations
- **Schema definitions** in TypeScript with validation
- **Migration system** using drizzle-kit

### Core Business Logic
- **Customer management** with unique ID generation
- **Asset tracking** for collateral management
- **Loan lifecycle** from application to closure
- **EMI calculations** supporting both flat and reducing rate methods
- **Payment processing** with penalty calculations
- **Accounting system** with double-entry bookkeeping

### Financial Calculations
- **EMI computation** for different interest types
- **Payment schedules** with automatic date calculations
- **Penalty calculations** for overdue payments
- **Outstanding balance tracking**

## Data Flow

1. **User Authentication**: Session-based login with role validation
2. **Customer Onboarding**: Customer creation with document management
3. **Loan Processing**: Application → Approval → Disbursement → Repayment
4. **Payment Collection**: EMI tracking with penalty calculations
5. **Accounting Integration**: Automatic journal entries for all transactions
6. **Reporting**: Real-time dashboard metrics and detailed reports

## External Dependencies

### Database
- **Neon PostgreSQL** as the database provider
- **Connection pooling** for efficient database connections

### UI Framework
- **Radix UI** for accessible component primitives
- **Lucide React** for consistent iconography
- **Date-fns** for date manipulation

### Development Tools
- **Vite** for fast development and building
- **ESBuild** for server-side bundling
- **TypeScript** for type safety across the stack

## Deployment Strategy

### Development Environment
- **Replit integration** with automatic environment setup
- **Hot module replacement** for rapid development
- **PostgreSQL module** provisioned automatically

### Production Build
- **Client build**: Vite bundles React app to static assets
- **Server build**: ESBuild creates optimized Node.js bundle
- **Asset serving**: Express serves static files in production

### Environment Configuration
- **Database URL** from environment variables
- **Session secrets** for secure authentication
- **Port configuration** for deployment flexibility

## Changelog

```
Changelog:
- June 15, 2025. Initial setup
```

## User Preferences

```
Preferred communication style: Simple, everyday language.
```