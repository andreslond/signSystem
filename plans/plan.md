# SignSystem Backend Plan

## Phase 1: User-Facing Document Management (Completed)

### Overall Backend Architecture
The backend follows a layered architecture to ensure separation of concerns, maintainability, and scalability. The layers are:
- **Presentation Layer (Controllers)**: Handles HTTP requests and responses, input validation, and delegates to the service layer.
- **Business Logic Layer (Services)**: Contains business logic, orchestrates data operations via repositories, and prepares data for controllers.
- **Data Access Layer (Repositories)**: Manages database interactions, queries, and data transformations using the Supabase client.

This architecture promotes clean code, easy testing, and future extensibility.

### Folder Structure
```
backend/
├── src/
│   ├── controllers/
│   │   └── DocumentController.ts
│   ├── services/
│   │   └── DocumentService.ts
│   ├── repositories/
│   │   └── DocumentRepository.ts
│   ├── middleware/
│   │   ├── authMiddleware.ts
│   │   └── internalAuthMiddleware.ts
│   ├── routes/
│   │   └── documentRoutes.ts
│   ├── config/
│   │   └── supabase.ts
│   ├── types/
│   │   └── index.ts
│   ├── utils/
│   │   ├── gcs.ts
│   │   ├── hash.ts
│   │   ├── pdf.ts
│   │   ├── logger.js
│   │   └── requestLogger.js
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
├── .env.example
├── DATABASE_MODEL.md
└── collections/
    └── SignSystem_Postman.postman_collection.json
```

### Responsibility of Each Layer
- **Controllers**:
  - Receive HTTP requests.
  - Validate request data (basic validation).
  - Call appropriate service methods.
  - Format and return HTTP responses.
  - No business logic or data access.
- **Services**:
  - Implement business rules.
  - Coordinate between multiple repositories if needed.
  - Transform data for controllers.
- **Repositories**:
  - Execute database queries using Supabase client.
  - Handle data mapping and basic transformations.

### How Controllers, Services, and Repositories Interact
1. **Request Flow**:
   - HTTP request → Controller method.
   - Controller validates input → Calls Service method.
   - Service applies business logic → Calls Repository method(s).
   - Repository queries database → Returns data to Service.
   - Service processes data → Returns to Controller.
   - Controller formats response → Sends HTTP response.
2. **Dependencies**:
   - Controllers inject Services.
   - Services inject Repositories.
   - All layers use async/await for asynchronous operations.
3. **Error Handling**: Try-catch in controllers; services and repositories throw errors that bubble up.

## Phase 2: Server-to-Server Document Upload (Completed)

### Upload Endpoint Requirements
- **Endpoint**: POST /documents
- **Auth**: Internal API key (SIGNSYSTEM_INTERNAL_API_KEY)
- **Input**: multipart/form-data with pdf, user_id, employee_id, payroll_period_start, payroll_period_end
- **Idempotency**: Based on (user_id, payroll_period_start, payroll_period_end, original_hash)
- **States**: PENDING (replaceable), SIGNED (invalidate only), INVALIDATED (read-only)
- **Rollback**: Application-level transactions with GCS cleanup

### Completed Components
- **internalAuthMiddleware.ts**: Validates SIGNSYSTEM_INTERNAL_API_KEY
- **DocumentAdminRepository.ts**: Admin operations with service_role client
- **uploadDocument** methods in Controller and Service
- **Updated types**: Include superseded_by, is_active fields

### Database Schema Updates
```sql
ALTER TABLE ar_signatures.documents
ADD COLUMN superseded_by uuid,
ADD COLUMN is_active boolean NOT NULL DEFAULT true;
```

### Completed Execution Steps
1. ✅ Update types and database documentation
2. ✅ Implement internal auth middleware
3. ✅ Extend GCS utilities
4. ✅ Create admin repository
5. ✅ Add upload logic to service and controller
6. ✅ Update routes
7. ✅ Add logging
8. ✅ Update environment variables
9. ✅ Test with Postman

## Current Project Status

### Phase 1: User-Facing Document Management (Completed)
- ✅ List user documents
- ✅ Get document by ID
- ✅ Sign documents with authentication
- ✅ View signatures for documents

### Phase 2: Server-to-Server Document Upload (Completed)
- ✅ Upload documents using internal API key
- ✅ Idempotent document upload
- ✅ Automatic validation of user and employee ID
- ✅ GCS integration for file storage
- ✅ Application-level transaction rollback

### Phase 3: Additional Features (In Progress)
- ⚠️ Audit logging for signature operations
- ⚠️ Document download/streaming endpoints
- ⚠️ Document status change notifications
- ⚠️ Enhanced user profile validation

### Technical Stack
- Node.js + TypeScript
- Express.js framework
- Supabase for database and authentication
- Google Cloud Storage (GCS) for file storage
- Jest for testing

### Current Status

The core functionality is complete and production-ready. The backend supports both user-facing document management and server-to-server document upload with comprehensive testing. Phase 3 features are partially implemented with TODOs in the codebase for future enhancement.

### Next Steps
- Implement audit logging for all signature operations
- Add document download/streaming endpoints
- Implement document status change notifications
- Add integration tests
- Set up CI/CD pipeline
- Add comprehensive error handling and monitoring