# Payroll Service Design Document

## 1. Overview

This document describes the complete design for the Payroll module to be integrated into the SignSystem platform. The payroll system supports multiple contract types (full-time, hourly, freelance), maintains payment history, and integrates seamlessly with the existing document signing system.

## 2. Current System Analysis

### 2.1 Existing Database Schema

The current system uses two main schemas:
- **`ar_nomina`**: Contains employee data
- **`ar_signatures`**: Contains document signing functionality

### 2.2 Existing Tables

#### Employees Table (`ar_nomina.employees`)
```sql
CREATE TABLE ar_nomina.employees (
    id bigint PRIMARY KEY,
    name text NOT NULL,
    email text,
    identification_number text,
    identification_type text,
    active boolean DEFAULT true,
    company_id bigint,
    external_employee_id text,
    external_provider_id text,
    created_at timestamp with time zone DEFAULT now()
);
```

#### Documents Table (`ar_signatures.documents`)
```sql
CREATE TABLE ar_signatures.documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES ar_signatures.profiles(id),
    employee_id bigint NOT NULL REFERENCES ar_nomina.employees(id),
    payroll_period_start date NOT NULL,
    payroll_period_end date NOT NULL,
    pdf_original_path text NOT NULL,
    pdf_signed_path text,
    status text NOT NULL DEFAULT 'PENDING',
    original_hash text NOT NULL,
    signed_hash text,
    created_at timestamp with time zone DEFAULT now(),
    signed_at timestamp with time zone,
    superseded_by uuid REFERENCES ar_signatures.documents(id),
    is_active boolean NOT NULL DEFAULT true,
    amount numeric(12, 2) DEFAULT 0
);
```

## 3. Proposed Schema Extensions

### 3.1 New Schema: `ar_payroll`

Create a new schema for all payroll-related tables to maintain clean separation of concerns.

```sql
CREATE SCHEMA IF NOT EXISTS ar_payroll;
```

### 3.2 Employees Extension

Add payroll-specific fields to the existing employees table:

```sql
-- Add contract type and payment configuration to employees
ALTER TABLE ar_nomina.employees
ADD COLUMN contract_type VARCHAR(20) NOT NULL DEFAULT 'fulltime' 
    CHECK (contract_type IN ('fulltime', 'hourly', 'freelance')),
ADD COLUMN hourly_rate NUMERIC(10, 2),
ADD COLUMN monthly_salary NUMERIC(12, 2),
ADD COLUMN project_rate NUMERIC(12, 2),
ADD COLUMN overtime_multiplier NUMERIC(4, 2) DEFAULT 1.5,
ADD COLUMN bank_account_number TEXT,
ADD COLUMN bank_name TEXT,
ADD COLUMN payment_method VARCHAR(20) DEFAULT 'transfer' 
    CHECK (payment_method IN ('transfer', 'cash', 'check'));
```

### 3.3 Payroll Periods Table

Defines payroll periods (monthly, biweekly, weekly):

```sql
CREATE TABLE ar_payroll.payroll_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    period_type VARCHAR(20) NOT NULL 
        CHECK (period_type IN ('monthly', 'biweekly', 'weekly', 'custom')),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    payment_date DATE,
    status VARCHAR(20) NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'calculating', 'calculated', 'approved', 'closed', 'cancelled')),
    total_gross_amount NUMERIC(14, 2) DEFAULT 0,
    total_net_amount NUMERIC(14, 2) DEFAULT 0,
    total_deductions NUMERIC(14, 2) DEFAULT 0,
    total_bonuses NUMERIC(14, 2) DEFAULT 0,
    employee_count INTEGER DEFAULT 0,
    approved_by UUID REFERENCES ar_signatures.profiles(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_by UUID REFERENCES ar_signatures.profiles(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT valid_period_dates CHECK (start_date <= end_date),
    CONSTRAINT unique_period_type_dates UNIQUE (period_type, start_date, end_date)
);

-- Indexes for payroll periods
CREATE INDEX idx_payroll_periods_status ON ar_payroll.payroll_periods(status);
CREATE INDEX idx_payroll_periods_dates ON ar_payroll.payroll_periods(start_date, end_date);
CREATE INDEX idx_payroll_periods_payment_date ON ar_payroll.payroll_periods(payment_date);
```

### 3.4 Payroll Entries Table

Individual payroll records for each employee in a period:

```sql
CREATE TABLE ar_payroll.payroll_entries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_period_id UUID NOT NULL REFERENCES ar_payroll.payroll_periods(id) ON DELETE CASCADE,
    employee_id BIGINT NOT NULL REFERENCES ar_nomina.employees(id),
    
    -- Contract type (denormalized for historical accuracy)
    contract_type VARCHAR(20) NOT NULL,
    
    -- Base compensation fields (vary by contract type)
    base_salary NUMERIC(12, 2),              -- For fulltime: monthly salary
    hours_worked NUMERIC(6, 2),              -- For hourly: hours in period
    hourly_rate NUMERIC(10, 2),              -- For hourly: rate per hour
    project_amount NUMERIC(12, 2),           -- For freelance: agreed project amount
    delivery_count INTEGER DEFAULT 0,        -- For freelance: completed deliveries
    
    -- Overtime calculations
    overtime_hours NUMERIC(6, 2) DEFAULT 0,
    overtime_rate NUMERIC(10, 2),
    overtime_amount NUMERIC(10, 2) DEFAULT 0,
    
    -- Additional compensation
    bonuses NUMERIC(10, 2) DEFAULT 0,
    commissions NUMERIC(10, 2) DEFAULT 0,
    reimbursements NUMERIC(10, 2) DEFAULT 0,
    other_income NUMERIC(10, 2) DEFAULT 0,
    
    -- Deductions
    deductions NUMERIC(10, 2) DEFAULT 0,
    taxes_withheld NUMERIC(10, 2) DEFAULT 0,
    health_deduction NUMERIC(10, 2) DEFAULT 0,
    pension_deduction NUMERIC(10, 2) DEFAULT 0,
    other_deductions NUMERIC(10, 2) DEFAULT 0,
    
    -- Calculated totals
    gross_salary NUMERIC(12, 2) NOT NULL,
    net_salary NUMERIC(12, 2) NOT NULL,
    
    -- Status tracking
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'calculated', 'approved', 'rejected', 'paid', 'signed')),
    
    -- Payment information
    payment_date DATE,
    payment_reference VARCHAR(100),
    
    -- Metadata
    calculated_at TIMESTAMP WITH TIME ZONE,
    approved_by BIGINT,
    approved_at TIMESTAMP WITH TIME ZONE,
    paid_at TIMESTAMP WITH TIME ZONE,
    rejection_reason TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    CONSTRAINT unique_employee_period UNIQUE (employee_id, payroll_period_id)
);

-- Indexes for payroll entries
CREATE INDEX idx_payroll_entries_period ON ar_payroll.payroll_entries(payroll_period_id);
CREATE INDEX idx_payroll_entries_employee ON ar_payroll.payroll_entries(employee_id);
CREATE INDEX idx_payroll_entries_status ON ar_payroll.payroll_entries(status);
CREATE INDEX idx_payroll_entries_payment_date ON ar_payroll.payroll_entries(payment_date);
```

### 3.5 Payroll Receipts Table

Links payroll entries to signed documents:

```sql
CREATE TABLE ar_payroll.payroll_receipts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_entry_id UUID NOT NULL REFERENCES ar_payroll.payroll_entries(id) ON DELETE CASCADE,
    document_id UUID REFERENCES ar_signatures.documents(id) ON DELETE SET NULL,
    
    -- Receipt details
    receipt_number VARCHAR(50) NOT NULL UNIQUE,
    period_start_date DATE NOT NULL,
    period_end_date DATE NOT NULL,
    
    -- Signature information
    signed_at TIMESTAMP WITH TIME ZONE,
    signature_hash VARCHAR(255),
    signature_ip VARCHAR(45),
    signature_user_agent TEXT,
    
    -- Status
    status VARCHAR(20) NOT NULL DEFAULT 'pending' 
        CHECK (status IN ('pending', 'generated', 'sent', 'viewed', 'signed', 'rejected', 'expired')),
    
    -- Delivery tracking
    sent_at TIMESTAMP WITH TIME ZONE,
    viewed_at TIMESTAMP WITH TIME ZONE,
    delivery_method VARCHAR(20) DEFAULT 'digital',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payroll_receipts_entry ON ar_payroll.payroll_receipts(payroll_entry_id);
CREATE INDEX idx_payroll_receipts_document ON ar_payroll.payroll_receipts(document_id);
CREATE INDEX idx_payroll_receipts_status ON ar_payroll.payroll_receipts(status);
```

### 3.6 Payroll Adjustments Table

For corrections to previously processed payroll:

```sql
CREATE TABLE ar_payroll.payroll_adjustments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    payroll_entry_id UUID NOT NULL REFERENCES ar_payroll.payroll_entries(id),
    
    -- Adjustment details
    adjustment_type VARCHAR(20) NOT NULL 
        CHECK (adjustment_type IN ('correction', 'bonus', 'deduction', 'reimbursement')),
    description TEXT NOT NULL,
    amount NUMERIC(10, 2) NOT NULL,
    is_credit BOOLEAN NOT NULL DEFAULT true,
    
    -- Processing
    period_id UUID REFERENCES ar_payroll.payroll_periods(id),
    processed_at TIMESTAMP WITH TIME ZONE,
    processed_by BIGINT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_payroll_adjustments_entry ON ar_payroll.payroll_adjustments(payroll_entry_id);
```

### 3.7 Payroll Configuration Table

System-wide payroll settings:

```sql
CREATE TABLE ar_payroll.payroll_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) NOT NULL UNIQUE,
    config_value TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Default configurations
INSERT INTO ar_payroll.payroll_config (config_key, config_value, description) VALUES
    ('default_overtime_multiplier', '1.5', 'Default overtime pay multiplier'),
    ('default_period_type', 'monthly', 'Default payroll period type'),
    ('max_overtime_hours', '48', 'Maximum overtime hours per period'),
    ('default_currency', 'COP', 'Default currency code'),
    ('receipt_validity_days', '30', 'Days until receipt expires');
```

## 4. TypeScript Type Definitions

### 4.1 Payroll Types

```typescript
// backend/src/types/payroll.ts

// =========================================
// Payroll Period Types
// =========================================

export type PayrollPeriodStatus = 'draft' | 'calculating' | 'calculated' | 'approved' | 'closed' | 'cancelled';
export type PayrollPeriodType = 'monthly' | 'biweekly' | 'weekly' | 'custom';
export type ContractType = 'fulltime' | 'hourly' | 'freelance';
export type PaymentMethod = 'transfer' | 'cash' | 'check';
export type PayrollEntryStatus = 'pending' | 'calculated' | 'approved' | 'rejected' | 'paid' | 'signed';
export type PayrollReceiptStatus = 'pending' | 'generated' | 'sent' | 'viewed' | 'signed' | 'rejected' | 'expired';
export type AdjustmentType = 'correction' | 'bonus' | 'deduction' | 'reimbursement';

export interface PayrollPeriod {
  id: string;
  name: string;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  paymentDate: string | null;
  status: PayrollPeriodStatus;
  totalGrossAmount: number;
  totalNetAmount: number;
  totalDeductions: number;
  totalBonuses: number;
  employeeCount: number;
  approvedBy: string | null;
  approvedAt: string | null;
  notes: string | null;
  createdBy: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PayrollPeriodInsert {
  name: string;
  periodType: PayrollPeriodType;
  startDate: string;
  endDate: string;
  paymentDate?: string;
  notes?: string;
}

export interface PayrollPeriodUpdate {
  name?: string;
  paymentDate?: string;
  status?: PayrollPeriodStatus;
  notes?: string;
}

// =========================================
// Employee Payroll Configuration
// =========================================

export interface EmployeePayrollConfig {
  employeeId: number;
  contractType: ContractType;
  hourlyRate: number | null;
  monthlySalary: number | null;
  projectRate: number | null;
  overtimeMultiplier: number;
  bankAccountNumber: string | null;
  bankName: string | null;
  paymentMethod: PaymentMethod;
}

// =========================================
// Payroll Entry Types
// =========================================

export interface PayrollEntry {
  id: string;
  payrollPeriodId: string;
  employeeId: number;
  contractType: ContractType;
  
  // Base compensation
  baseSalary: number | null;
  hoursWorked: number | null;
  hourlyRate: number | null;
  projectAmount: number | null;
  deliveryCount: number | null;
  
  // Overtime
  overtimeHours: number;
  overtimeRate: number | null;
  overtimeAmount: number;
  
  // Additional compensation
  bonuses: number;
  commissions: number;
  reimbursements: number;
  otherIncome: number;
  
  // Deductions
  deductions: number;
  taxesWithheld: number;
  healthDeduction: number;
  pensionDeduction: number;
  otherDeductions: number;
  
  // Totals
  grossSalary: number;
  netSalary: number;
  
  // Status
  status: PayrollEntryStatus;
  paymentDate: string | null;
  paymentReference: string | null;
  
  // Metadata
  calculatedAt: string | null;
  approvedBy: number | null;
  approvedAt: string | null;
  paidAt: string | null;
  rejectionReason: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  employeeName?: string;
  employeeEmail?: string;
  employeeIdentificationNumber?: string;
}

export interface PayrollEntryInsert {
  payrollPeriodId: string;
  employeeId: number;
  contractType: ContractType;
  
  // Base compensation
  baseSalary?: number;
  hoursWorked?: number;
  hourlyRate?: number;
  projectAmount?: number;
  deliveryCount?: number;
  
  // Overtime
  overtimeHours?: number;
  overtimeRate?: number;
  
  // Additional compensation
  bonuses?: number;
  commissions?: number;
  reimbursements?: number;
  otherIncome?: number;
  
  // Deductions
  deductions?: number;
  taxesWithheld?: number;
  healthDeduction?: number;
  pensionDeduction?: number;
  otherDeductions?: number;
  
  notes?: string;
}

export interface PayrollEntryUpdate {
  // Base compensation
  baseSalary?: number;
  hoursWorked?: number;
  hourlyRate?: number;
  projectAmount?: number;
  deliveryCount?: number;
  
  // Overtime
  overtimeHours?: number;
  overtimeRate?: number;
  
  // Additional compensation
  bonuses?: number;
  commissions?: number;
  reimbursements?: number;
  otherIncome?: number;
  
  // Deductions
  deductions?: number;
  taxesWithheld?: number;
  healthDeduction?: number;
  pensionDeduction?: number;
  otherDeductions?: number;
  
  // Status
  status?: PayrollEntryStatus;
  paymentDate?: string;
  paymentReference?: string;
  rejectionReason?: string;
  notes?: string;
}

// =========================================
// Payroll Receipt Types
// =========================================

export interface PayrollReceipt {
  id: string;
  payrollEntryId: string;
  documentId: string | null;
  receiptNumber: string;
  periodStartDate: string;
  periodEndDate: string;
  signedAt: string | null;
  signatureHash: string | null;
  signatureIp: string | null;
  signatureUserAgent: string | null;
  status: PayrollReceiptStatus;
  sentAt: string | null;
  viewedAt: string | null;
  deliveryMethod: string;
  createdAt: string;
  updatedAt: string;
  
  // Joined data
  employeeName?: string;
  employeeEmail?: string;
  netSalary?: number;
  grossSalary?: number;
}

// =========================================
// Payroll Adjustment Types
// =========================================

export interface PayrollAdjustment {
  id: string;
  payrollEntryId: string;
  adjustmentType: AdjustmentType;
  description: string;
  amount: number;
  isCredit: boolean;
  periodId: string | null;
  processedAt: string | null;
  processedBy: number | null;
  createdAt: string;
}

export interface PayrollAdjustmentInsert {
  payrollEntryId: string;
  adjustmentType: AdjustmentType;
  description: string;
  amount: number;
  isCredit?: boolean;
  periodId?: string;
}

// =========================================
// Payroll Configuration Types
// =========================================

export interface PayrollConfig {
  id: string;
  configKey: string;
  configValue: string;
  description: string | null;
  isActive: boolean;
}

// =========================================
// API Response Types
// =========================================

export interface PayrollDashboardSummary {
  currentPeriod: PayrollPeriod | null;
  totalEmployees: number;
  totalPayroll: number;
  pendingSignatures: number;
  signedReceipts: number;
  averageSalary: number;
}

export interface PayrollPeriodWithEntries extends PayrollPeriod {
  entries: PayrollEntry[];
}

export interface PayrollEmployeeHistory {
  employee: {
    id: number;
    name: string;
    email: string;
    contractType: ContractType;
  };
  entries: PayrollEntry[];
  totalEarned: number;
  totalDeductions: number;
}

export interface PaginatedPayrollPeriodsResponse {
  data: PayrollPeriod[];
  pagination: PaginationMeta;
}

export interface PaginatedPayrollEntriesResponse {
  data: PayrollEntry[];
  pagination: PaginationMeta;
}
```

## 5. Calculation Logic

### 5.1 Full-Time Employee Calculation

```
grossSalary = baseSalary + overtimeAmount + bonuses + commissions + reimbursements + otherIncome
netSalary = grossSalary - deductions - taxesWithheld - healthDeduction - pensionDeduction - otherDeductions
```

### 5.2 Hourly Employee Calculation

```
grossSalary = (hoursWorked * hourlyRate) + overtimeAmount + bonuses + commissions + reimbursements + otherIncome
netSalary = grossSalary - deductions - taxesWithheld - healthDeduction - pensionDeduction - otherDeductions
```

### 5.3 Freelancer Calculation

```
grossSalary = (projectAmount * deliveryCount) + bonuses + reimbursements + otherIncome
netSalary = grossSalary - deductions - otherDeductions
-- Note: Freelancers typically don't have taxes withheld as they're responsible for their own tax declarations
```

### 5.4 Overtime Calculation

```
overtimeAmount = overtimeHours * (hourlyRate * overtimeMultiplier)
```

## 6. API Endpoints

### 6.1 Payroll Periods

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/periods` | List all payroll periods (paginated) |
| GET | `/api/payroll/periods/:id` | Get period details with entries |
| POST | `/api/payroll/periods` | Create new payroll period |
| PUT | `/api/payroll/periods/:id` | Update period details |
| DELETE | `/api/payroll/periods/:id` | Cancel/delete period |
| POST | `/api/payroll/periods/:id/calculate` | Calculate payroll for period |
| POST | `/api/payroll/periods/:id/approve` | Approve payroll period |
| POST | `/api/payroll/periods/:id/close` | Close payroll period |

### 6.2 Payroll Entries

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/periods/:periodId/entries` | List entries for period |
| GET | `/api/payroll/entries/:id` | Get entry details |
| POST | `/api/payroll/entries` | Create manual entry |
| PUT | `/api/payroll/entries/:id` | Update entry |
| POST | `/api/payroll/entries/:id/approve` | Approve single entry |
| POST | `/api/payroll/entries/:id/reject` | Reject single entry |
| POST | `/api/payroll/entries/:id/mark-paid` | Mark as paid |

### 6.3 Payroll Receipts

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/receipts/:id` | Get receipt details |
| POST | `/api/payroll/entries/:id/generate-receipt` | Generate receipt PDF |
| POST | `/api/payroll/receipts/:id/send` | Send receipt to employee |
| GET | `/api/payroll/receipts/:id/pdf` | Get receipt PDF URL |

### 6.4 Employee History

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/employees/:id/history` | Get employee's payroll history |
| GET | `/api/payroll/employees/:id/summary` | Get employee's payroll summary |

### 6.5 Adjustments

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/entries/:id/adjustments` | List adjustments for entry |
| POST | `/api/payroll/adjustments` | Create adjustment |

### 6.6 Configuration

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/payroll/config` | Get all configurations |
| PUT | `/api/payroll/config/:key` | Update configuration |

## 7. Integration with Document Signing System

### 7.1 Architecture

The payroll system integrates with the existing document signing system to enable digital signature of payroll receipts.

```
┌─────────────────────────────────────────────────────────────────┐
│                      Payroll Service                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Payroll    │  │  Payroll    │  │  Document Integration   │ │
│  │  Periods    │  │  Entries    │  │  Service                 │ │
│  └─────────────┘  └─────────────┘  └───────────┬─────────────┘ │
└─────────────────────────────────────────────────┼───────────────┘
                                                  │
                                                  ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Document Signing System                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  Documents  │  │ Signatures  │  │  PDF Generation         │ │
│  │  Table      │  │  Table      │  │  Service                 │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### 7.2 Receipt Generation Flow

1. **Payroll Calculation Complete**
   - Payroll administrator reviews and approves the payroll period
   - System calculates net salaries for all employees

2. **Receipt Generation**
   - For each employee in the period:
     a. Generate PDF receipt with payment details
     b. Store PDF in GCS/Supabase Storage
     c. Create document record in `ar_signatures.documents`
     d. Create payroll receipt record in `ar_payroll.payroll_receipts`

3. **Employee Notification**
   - Employee receives notification (email/in-app)
   - Receipt appears in employee's pending documents

4. **Digital Signature**
   - Employee views and signs the receipt
   - System updates:
     - `ar_signatures.documents.status` = 'SIGNED'
     - `ar_signatures.documents.signed_hash` = hash
     - `ar_payroll.payroll_entries.status` = 'signed'
     - `ar_payroll.payroll_receipts.status` = 'signed'
     - `ar_payroll.payroll_receipts.signed_at` = timestamp

### 7.3 Document Linking

```sql
-- When generating receipt, create document link
INSERT INTO ar_signatures.documents (
    user_id,
    employee_id,
    payroll_period_start,
    payroll_period_end,
    pdf_original_path,
    status,
    original_hash,
    amount
) VALUES (
    (SELECT user_id FROM ar_signatures.profiles WHERE employee_id = $employeeId),
    $employeeId,
    $periodStartDate,
    $periodEndDate,
    $pdfPath,
    'PENDING',
    $pdfHash,
    $netSalary
);

-- Link receipt to document
INSERT INTO ar_payroll.payroll_receipts (
    payroll_entry_id,
    document_id,
    receipt_number,
    period_start_date,
    period_end_date,
    status
) VALUES (
    $payrollEntryId,
    $documentId,
    $receiptNumber,
    $periodStartDate,
    $periodEndDate,
    'generated'
);
```

## 8. Frontend Architecture

### 8.1 Page Structure

```
/payroll
├── /                           → PayrollDashboard.jsx
├── /periods                    → PayrollPeriodList.jsx
├── /periods/new                → PayrollPeriodForm.jsx
├── /periods/:id                → PayrollPeriodDetail.jsx
├── /periods/:id/edit           → PayrollPeriodForm.jsx
├── /entries/:id                → PayrollEntryDetail.jsx
├── /employees/:id/history     → PayrollEmployeeHistory.jsx
├── /receipts/:id               → PayrollReceiptViewer.jsx
└── /config                     → PayrollConfig.jsx
```

### 8.2 Component Hierarchy

```
PayrollLayout
├── Sidebar
│   ├── Dashboard Link
│   ├── Periods Link
│   ├── Employees Link
│   └── Configuration Link
├── Header
│   ├── Period Selector
│   └── User Menu
└── Content Area
    ├── PayrollDashboard
    │   ├── SummaryCards
    │   │   ├── TotalPayrollCard
    │   │   ├── PendingSignaturesCard
    │   │   ├── SignedReceiptsCard
    │   │   └── EmployeeCountCard
    │   ├── RecentPeriodsTable
    │   └── QuickActions
    ├── PayrollPeriodList
    │   ├── PeriodFilters
    │   ├── PeriodsTable
    │   └── Pagination
    ├── PayrollPeriodDetail
    │   ├── PeriodInfoCard
    │   ├── EntriesTable
    │   │   ├── PayrollEntryRow (by contract type)
    │   │   ├── BulkActions
    │   │   └── EntryDetailModal
    │   └── PeriodActions
    ├── PayrollEmployeeHistory
    │   ├── EmployeeInfoCard
    │   ├── PayrollHistoryTable
    │   └── ExportButton
    └── PayrollReceiptViewer (reuses PDFViewer)
        ├── ReceiptHeader
        ├── PaymentDetails
        ├── EarningsBreakdown
        ├── DeductionsBreakdown
        └── SignatureSection
```

### 8.3 State Management

Using React Query for server state and local state for UI:

```typescript
// usePayroll.ts - Main hook for payroll operations
export function usePayroll() {
  // Periods
  const periods = useQuery(['payroll', 'periods'], () => payrollApi.getPeriods());
  const period = useQuery(['payroll', 'periods', id], () => payrollApi.getPeriod(id));
  
  // Entries
  const entries = useQuery(['payroll', 'periods', periodId, 'entries'], 
    () => payrollApi.getEntries(periodId));
  
  // Receipts
  const receipt = useQuery(['payroll', 'receipts', id], 
    () => payrollApi.getReceipt(id));
  
  // Mutations
  const createPeriod = useMutation(payrollApi.createPeriod);
  const calculatePeriod = useMutation(payrollApi.calculatePeriod);
  const approveEntry = useMutation(payrollApi.approveEntry);
  
  return {
    // Queries
    periods,
    period,
    entries,
    receipt,
    // Mutations
    createPeriod,
    calculatePeriod,
    approveEntry,
  };
}
```

## 9. Security Considerations

### 9.1 Access Control

- **Admin/HR**: Full access to create periods, calculate, approve, view all
- **Manager**: View periods, approve entries for their team
- **Employee**: View own receipt history, sign receipts

### 9.2 Data Protection

- Salary data is sensitive - implement field-level encryption for salary amounts
- Bank account numbers should be encrypted at rest
- PDF receipts should be served via signed URLs with expiration

### 9.3 Audit Trail

All payroll actions are logged:
- Period created, calculated, approved, closed
- Entry created, modified, approved, rejected, paid
- Receipt generated, sent, viewed, signed

## 10. Testing Strategy

### 10.1 Unit Tests

- Payroll calculation logic for each contract type
- Overtime calculations
- Deduction calculations
- Date handling for periods

### 10.2 Integration Tests

- API endpoints
- Database operations
- Document generation flow

### 10.3 E2E Tests

- Complete payroll workflow
- Receipt signing flow
- Employee history access

## 11. Future Enhancements

Consider these for future phases:

- **Multi-company support**: Handle payroll for multiple legal entities
- **Multi-currency support**: Process payments in different currencies
- **Tax calculation integration**: Connect to tax calculation services
- **Direct deposit integration**: Bank API integration for automatic transfers
- **Advanced reporting**: Custom reports, export to Excel/PDF
- **Payroll analytics**: Charts, trends, comparisons
- **Approval workflows**: Multi-level approval chains
- **Notification preferences**: Employee-configurable notifications
- **Mobile app**: View payslips on mobile
- **Annual statements**: Generate year-end tax statements (certificado de ingresos)
