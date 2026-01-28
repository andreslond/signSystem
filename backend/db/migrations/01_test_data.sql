-- =========================================
-- SignSystem Test Data Migration
-- =========================================
-- This script inserts test data for manual testing in Supabase
-- Run this after the schema initialization script
-- WARNING: Only run in development/testing environments

-- =========================================
-- TEST DATA INSERTION
-- =========================================

-- Note: This script assumes you have created test users in Supabase Auth first
-- The UUIDs below are examples - replace with actual user IDs from your Supabase Auth

DO $$
DECLARE
    test_user_1_id uuid := 'ff75c89d-98ae-4bb0-9f47-ba3054e777ea'; -- Replace with actual user ID
    test_user_2_id uuid := '550e8400-e29b-41d4-a716-446655440000'; -- Replace with actual user ID
BEGIN

    -- Insert test employees
    INSERT INTO ar_signatures.employees (id, name, email, identification_number, active) VALUES
    (1, 'John Doe', 'john.doe@example.com', '123456789', true),
    (2, 'Jane Smith', 'jane.smith@example.com', '987654321', true),
    (3, 'Bob Johnson', 'bob.johnson@example.com', '456789123', true)
    ON CONFLICT (id) DO NOTHING;

    -- Insert test profiles (only if users exist in auth.users)
    -- Uncomment and modify the UUIDs below with actual user IDs from Supabase Auth

    /*
    INSERT INTO ar_signatures.profiles (id, employee_id, role_type) VALUES
    (test_user_1_id, 1, 'employee'),
    (test_user_2_id, 2, 'employee')
    ON CONFLICT (id) DO NOTHING;
    */

    -- Insert test documents (only if profiles exist)
    -- Uncomment after creating the profiles above

    /*
    INSERT INTO ar_signatures.documents (
        user_id, employee_id, payroll_period_start, payroll_period_end,
        pdf_original_path, status, original_hash, is_active
    ) VALUES
    (
        test_user_1_id, 1, '01-01-2025'::date, '31-01-2025'::date,
        'original/ff75c89d-98ae-4bb0-9f47-ba3054e777ea/test-doc-1.pdf',
        'PENDING', 'test_hash_1234567890123456789012345678901234567890', true
    ),
    (
        test_user_1_id, 1, '01-02-2025'::date, '28-02-2025'::date,
        'original/ff75c89d-98ae-4bb0-9f47-ba3054e777ea/test-doc-2.pdf',
        'SIGNED', 'test_hash_abcdef1234567890123456789012345678901234', true
    ),
    (
        test_user_2_id, 2, '15-01-2025'::date, '14-02-2025'::date,
        'original/550e8400-e29b-41d4-a716-446655440000/test-doc-3.pdf',
        'PENDING', 'test_hash_9876543210987654321098765432109876543210', true
    )
    ON CONFLICT DO NOTHING;
    */

    RAISE NOTICE 'Test data migration completed. Please manually create user profiles and documents as needed.';

END $$;

-- =========================================
-- MANUAL STEPS FOR TESTING
-- =========================================

-- 1. Create test users in Supabase Auth Dashboard
-- 2. Note their UUIDs
-- 3. Update the test_user_1_id and test_user_2_id variables above
-- 4. Uncomment and run the profile and document insertions
-- 5. Test the API endpoints using the Postman collection

-- =========================================
-- VERIFICATION QUERIES
-- =========================================

-- Check if data was inserted correctly:
-- SELECT * FROM ar_signatures.employees ORDER BY id;
-- SELECT * FROM ar_signatures.profiles ORDER BY created_at DESC;
-- SELECT * FROM ar_signatures.documents ORDER BY created_at DESC;
-- SELECT * FROM ar_signatures.signatures ORDER BY signed_at DESC;

-- =========================================
-- CLEANUP (if needed)
-- =========================================

-- To remove all test data:
/*
DELETE FROM ar_signatures.signatures;
DELETE FROM ar_signatures.documents;
DELETE FROM ar_signatures.profiles;
DELETE FROM ar_signatures.employees;
*/

-- =========================================
-- END OF TEST DATA MIGRATION
-- =========================================