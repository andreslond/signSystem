# Database Model Documentation

This document describes the existing database schema for the SignSystem project, located in Supabase under the `ar_nomina` schema. The schema is read-only and must not be altered. Row Level Security (RLS) is enabled and enforced by Supabase.

## Tables

### employees
Stores employee information.

- **id** (bigint, Primary Key): Unique identifier for the employee.
- **name** (text): Full name of the employee.
- **email** (text): Email address.
- **identification_number** (text): Identification number (e.g., ID card number).
- **identification_type** (text): Type of identification (e.g., passport, driver's license).
- **active** (boolean): Whether the employee is active.
- **company_id** (bigint): Identifier for the company (foreign key to another table, assumed).
- **external_employee_id** (text): External system employee ID.
- **external_provider_id** (text): External provider identifier.
- **created_at** (timestamp): Record creation timestamp.

### profiles
Links to Supabase Auth users and associates with employees.

- **id** (uuid, Primary Key, Foreign Key to auth.users): Matches the Supabase auth user ID.
- **employee_id** (bigint, Foreign Key to employees.id): Links to the employee record.
- **role_type** (text): Role of the user (e.g., 'employee', 'leader', 'support').
- **created_at** (timestamp): Record creation timestamp.

### documents
Stores payroll documents for signing.

- **id** (uuid, Primary Key): Unique identifier for the document.
- **user_id** (uuid, Foreign Key to profiles.id): The user who owns the document.
- **employee_id** (bigint, Foreign Key to employees.id): The employee associated with the document.
- **payroll_period** (text): Period of the payroll (e.g., '2023-10').
- **pdf_original_path** (text): Path to the original PDF file.
- **pdf_signed_path** (text): Path to the signed PDF file (null if not signed).
- **status** (text): Status of the document ('PENDING' or 'SIGNED').
- **original_hash** (text): Hash of the original PDF.
- **signed_hash** (text): Hash of the signed PDF (null if not signed).
- **created_at** (timestamp): Record creation timestamp.
- **signed_at** (timestamp): Timestamp when signed (null if not signed).

### signatures
Records signature events for documents.

- **id** (uuid, Primary Key): Unique identifier for the signature.
- **document_id** (uuid, Foreign Key to documents.id): The document being signed.
- **name** (text): Name of the signer.
- **identification_number** (text): Identification number of the signer.
- **ip** (text): IP address of the signer.
- **user_agent** (text): User agent string from the browser/device.
- **hash_sign** (text): Hash of the signature.
- **signed_at** (timestamp): Timestamp of the signature.

## Relationships
- `profiles.id` → `auth.users.id` (Supabase Auth users).
- `profiles.employee_id` → `employees.id`.
- `documents.user_id` → `profiles.id`.
- `documents.employee_id` → `employees.id`.
- `signatures.document_id` → `documents.id`.

## Notes
- All tables use the `ar_nomina` schema.
- RLS is enabled; queries must respect user permissions.
- The authenticated user ID is available via JWT (`auth.uid()` in Supabase).
- No changes to the schema are allowed; integration must work with the existing structure.