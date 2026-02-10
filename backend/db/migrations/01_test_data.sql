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

select *
from auth.users
;
select *
from ar_nomina.employees
;


DO $$
DECLARE
    test_user_1_id uuid := '74d91117-42c1-43eb-8023-6b910df464ff'; -- Replace with actual user ID andrestor2@gmail.com
    test_user_2_id uuid := 'add51c0d-abbd-40cb-8d5d-5699084675e2'; -- Replace with actual user ID areparojanominas@gmail.com
    test_user_3_id uuid := 'c47f681c-751b-47a9-a019-66e6e69da15f'; -- Test user 3 UUID aftorresl01@gmail.com
    test_user_4_id uuid := 'ff75c89d-98ae-4bb0-9f47-ba3054e777ea'; -- Test user 4 UUID felilond93@gmail.com
BEGIN

    -- -- Insert test employees
    -- INSERT INTO ar_nomina.employees (id, name, email, identification_number, active) VALUES
    -- (20, 'John Doe', 'john.doe@example.com', '123456789', true),
    -- (21, 'Jane Smith', 'jane.smith@example.com', '987654321', true),
    -- (22, 'Bob Johnson', 'bob.johnson@example.com', '456789123', true),
    -- (23,'Alice Williams', 'alice.williams@test.example.com', '321654987', true)
    --ON CONFLICT (id) DO NOTHING;

    -- Insert test profiles (only if users exist in auth.users)
    -- Uncomment and modify the UUIDs below with actual user IDs from Supabase Auth

    
    -- INSERT INTO ar_signatures.profiles (id, employee_id, role_type) VALUES
    -- (test_user_1_id, 20, 'employee'),
    -- (test_user_2_id, 21, 'employee'),
    -- (test_user_3_id, 22, 'leader'),
    -- (test_user_4_id, 23, 'employee')
    -- ON CONFLICT (id) DO NOTHING;
    

    -- Insert test documents (only if profiles exist)
    -- Uncomment after creating the profiles above

    
    INSERT INTO ar_signatures.documents (
        user_id, employee_id, payroll_period_start, payroll_period_end,
        pdf_original_path, status, original_hash, is_active
    ) VALUES
    (
        test_user_1_id, 1, '01-04-2025'::date, '01-10-2025'::date,
        'original/test-doc-1/test-doc-1.pdf',
        'PENDING', 'test_hash_1234567890123456789012345678901234567890', true
    ),
    (
        test_user_1_id, 1, '01-11-2025'::date, '01-17-2025'::date,
        'original/test-doc-2/test-doc-2.pdf',
        'SIGNED', 'test_hash_abcdef1234567890123456789012345678901234', true
    ),
    (
        test_user_2_id, 2, '01-04-2025'::date, '01-10-2025'::date,
        'original/test-doc-3/test-doc-3.pdf',
        'PENDING', 'test_hash_9876543210987654321098765432109876543210', true
    ),
    (
        test_user_3_id, 3, '01-25-2025'::date, '01-31-2025'::date,
        'original/test-doc-4/test-doc-4.pdf',
        'PENDING', 'test_hash_1111222233334444555566667777888999000000', true
    ),
    (
        test_user_4_id, 4, '01-25-2025'::date, '01-31-2025'::date,
        'original/test-doc-5/test-doc-5.pdf',
        'SIGNED', 'test_hash_aaaaabbbbbccccddddeeeeffff0000111122223333', true
    )
    ON CONFLICT DO NOTHING;
    

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
--DELETE FROM ar_signatures.employees;
*/

-- =========================================
-- END OF TEST DATA MIGRATION
-- =========================================