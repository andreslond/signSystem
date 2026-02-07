-- =========================================
-- SignSystem Database Initialization Script
-- =========================================
-- This script initializes the complete database schema for the SignSystem application
-- Compatible with Supabase PostgreSQL
-- Run this script in the Supabase SQL Editor or via psql

-- =========================================
-- 1. SCHEMA CREATION
-- =========================================

-- Create the main schema for signatures functionality
CREATE SCHEMA IF NOT EXISTS ar_signatures;

-- =========================================
-- 2. EXTENSIONS
-- =========================================

-- Enable UUID extension (usually already enabled in Supabase)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable pgcrypto for cryptographic functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =========================================
-- 3. TABLES CREATION
-- =========================================

-- Table: employees
-- Stores employee information linked to external systems
CREATE TABLE ar_signatures.employees (
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

-- Table: profiles
-- Links Supabase Auth users to employees
CREATE TABLE ar_signatures.profiles (
    id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    employee_id bigint REFERENCES ar_signatures.employees(id),
    role_type text NOT NULL DEFAULT 'employee' CHECK (role_type IN ('employee', 'leader', 'support')),
    created_at timestamp with time zone DEFAULT now()
);

-- Table: documents
-- Main table for payroll documents requiring signatures
CREATE TABLE ar_signatures.documents (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id uuid NOT NULL REFERENCES ar_signatures.profiles(id) ON DELETE CASCADE,
    employee_id bigint NOT NULL REFERENCES ar_signatures.employees(id),
    payroll_period_start date NOT NULL,
    payroll_period_end date NOT NULL,
    pdf_original_path text NOT NULL,
    pdf_signed_path text,
    status text NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'SIGNED', 'INVALIDATED')),
    original_hash text NOT NULL,
    signed_hash text,
    created_at timestamp with time zone DEFAULT now(),
    signed_at timestamp with time zone,
    superseded_by uuid REFERENCES ar_signatures.documents(id),
    is_active boolean NOT NULL DEFAULT true,

    -- Constraints
    CONSTRAINT valid_date_range CHECK (payroll_period_start <= payroll_period_end),
    CONSTRAINT unique_active_document_per_period EXCLUDE (
        user_id WITH =,
        payroll_period_start WITH =,
        payroll_period_end WITH =,
        original_hash WITH =
    ) WHERE (is_active = true)
);

-- Table: signatures
-- Records signature events for audit trails
CREATE TABLE ar_signatures.signatures (
    id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id uuid NOT NULL REFERENCES ar_signatures.documents(id) ON DELETE CASCADE,
    name text NOT NULL,
    identification_number text NOT NULL,
    ip text NOT NULL,
    user_agent text NOT NULL,
    hash_sign text NOT NULL,
    signed_at timestamp with time zone DEFAULT now()
);

-- =========================================
-- 4. INDEXES
-- =========================================

-- Employees indexes
CREATE INDEX idx_employees_active ON ar_signatures.employees(active) WHERE active = true;
CREATE INDEX idx_employees_external_id ON ar_signatures.employees(external_employee_id);

-- Profiles indexes
CREATE INDEX idx_profiles_employee_id ON ar_signatures.profiles(employee_id);

-- Documents indexes
CREATE INDEX idx_documents_user_id ON ar_signatures.documents(user_id);
CREATE INDEX idx_documents_employee_id ON ar_signatures.documents(employee_id);
CREATE INDEX idx_documents_status ON ar_signatures.documents(status);
CREATE INDEX idx_documents_created_at ON ar_signatures.documents(created_at DESC);
CREATE INDEX idx_documents_active_period_range ON ar_signatures.documents(
    user_id,
    payroll_period_start,
    payroll_period_end
) WHERE is_active = true;
CREATE INDEX idx_documents_user_created_at_desc ON ar_signatures.documents (user_id, created_at DESC);

-- Signatures indexes
CREATE INDEX idx_signatures_document_id ON ar_signatures.signatures(document_id);
CREATE INDEX idx_signatures_signed_at ON ar_signatures.signatures(signed_at DESC);

-- =========================================
-- 5. ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================

-- Enable RLS on all tables
ALTER TABLE ar_signatures.employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_signatures.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_signatures.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE ar_signatures.signatures ENABLE ROW LEVEL SECURITY;

-- Employees policies (admin/service role only for writes, read access for authenticated users)
CREATE POLICY "Employees are viewable by authenticated users" ON ar_signatures.employees
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Employees are manageable by service role" ON ar_signatures.employees
    FOR ALL USING (auth.role() = 'service_role');

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON ar_signatures.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON ar_signatures.profiles
    FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Profiles are manageable by service role" ON ar_signatures.profiles
    FOR ALL USING (auth.role() = 'service_role');

-- Documents policies (users can only see their own documents)
CREATE POLICY "Users can view their own documents" ON ar_signatures.documents
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Documents are manageable by service role" ON ar_signatures.documents
    FOR ALL USING (auth.role() = 'service_role');

-- Signatures policies (users can only see signatures for their documents)
CREATE POLICY "Users can view signatures for their documents" ON ar_signatures.signatures
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM ar_signatures.documents
            WHERE documents.id = signatures.document_id
            AND documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Signatures are manageable by service role" ON ar_signatures.signatures
    FOR ALL USING (auth.role() = 'service_role');



-- View for active documents with user and employee information
CREATE VIEW ar_signatures.active_documents_view AS
SELECT
    d.id,
    d.user_id,
    d.employee_id,
    d.payroll_period_start,
    d.payroll_period_end,
    d.pdf_original_path,
    d.pdf_signed_path,
    d.status,
    d.original_hash,
    d.signed_hash,
    d.created_at,
    d.signed_at,
    p.role_type,
    e.name as employee_name,
    e.email as employee_email
FROM ar_signatures.documents d
JOIN ar_signatures.profiles p ON d.user_id = p.id
JOIN ar_signatures.employees e ON d.employee_id = e.id
WHERE d.is_active = true;

-- =========================================
-- 8. GRANTS AND PERMISSIONS
-- =========================================

-- Grant usage on schema
GRANT USAGE ON SCHEMA ar_signatures TO authenticated, service_role;

-- Grant permissions on tables
GRANT SELECT ON ar_signatures.employees TO authenticated;
GRANT ALL ON ar_signatures.employees TO service_role;

GRANT SELECT ON ar_signatures.documents TO authenticated;
GRANT SELECT ON ar_signatures.signatures TO authenticated;
GRANT SELECT ON ar_signatures.profiles TO authenticated;

GRANT INSERT ON ar_signatures.documents TO authenticated;
GRANT INSERT ON ar_signatures.signatures TO authenticated;
GRANT INSERT ON ar_signatures.profiles TO authenticated;

GRANT UPDATE ON ar_signatures.documents TO authenticated;
GRANT UPDATE ON ar_signatures.profiles TO authenticated;

-- Grant permissions on views
GRANT SELECT ON ar_signatures.active_documents_view TO authenticated, service_role;

-- =========================================
-- 9. MIGRATION HELPERS
-- =========================================

-- Function to migrate old payroll_period format (if needed)
-- CREATE OR REPLACE FUNCTION ar_signatures.migrate_payroll_period(
--     old_period text
-- ) RETURNS TABLE(start_date date, end_date date) AS $$
-- DECLARE
--     year_part text;
--     month_part text;
--     start_date_val date;
--     end_date_val date;
-- BEGIN
--     -- Extract year and month from "YYYY-MM" format
--     year_part := split_part(old_period, '-', 1);
--     month_part := split_part(old_period, '-', 2);

--     -- Create start date (first day of month)
--     start_date_val := make_date(year_part::integer, month_part::integer, 1);

--     -- Create end date (last day of month)
--     end_date_val := (start_date_val + interval '1 month' - interval '1 day')::date;

--     RETURN QUERY SELECT start_date_val, end_date_val;
-- END;
-- $$ LANGUAGE plpgsql;

-- =========================================
-- 10. COMMENTS AND DOCUMENTATION
-- =========================================

COMMENT ON SCHEMA ar_signatures IS 'Schema containing all tables and functions for the SignSystem document signing functionality';

COMMENT ON TABLE ar_signatures.employees IS 'Employee information synchronized from external HR systems';
COMMENT ON TABLE ar_signatures.profiles IS 'Links Supabase auth users to employee records';
COMMENT ON TABLE ar_signatures.documents IS 'Payroll documents requiring electronic signatures';
COMMENT ON TABLE ar_signatures.signatures IS 'Audit trail of signature events';

COMMENT ON COLUMN ar_signatures.documents.payroll_period_start IS 'Start date of payroll period in DD-MM-YYYY format';
COMMENT ON COLUMN ar_signatures.documents.payroll_period_end IS 'End date of payroll period in DD-MM-YYYY format';
COMMENT ON COLUMN ar_signatures.documents.status IS 'Document status: PENDING (can be signed), SIGNED (completed), INVALIDATED (superseded)';
COMMENT ON COLUMN ar_signatures.documents.is_active IS 'Whether this document is the current active version';

-- =========================================
-- END OF INITIALIZATION SCRIPT
-- =========================================