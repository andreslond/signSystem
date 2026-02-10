// Jest setup file
import dotenv from 'dotenv'

// Load test environment variables
dotenv.config({ path: '.env.test' })

// Mock environment variables for tests
process.env.SUPABASE_URL = process.env.SUPABASE_URL || 'https://test.supabase.co'
process.env.SUPABASE_SECRET_KEY = process.env.SUPABASE_SECRET_KEY || 'test_secret_key'
process.env.SUPABASE_PUBLISHABLE_KEY = process.env.SUPABASE_PUBLISHABLE_KEY || 'test_publishable_key'
process.env.GCS_BUCKET = process.env.GCS_BUCKET || 'test-bucket'
process.env.SIGNSYSTEM_INTERNAL_API_KEY = process.env.SIGNSYSTEM_INTERNAL_API_KEY || 'test_internal_key'