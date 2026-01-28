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

## Phase 2: Server-to-Server Document Upload

### Upload Endpoint Requirements
- **Endpoint**: POST /documents
- **Auth**: Internal API key (SIGNSYSTEM_INTERNAL_API_KEY)
- **Input**: multipart/form-data with pdf, user_id, employee_id, payroll_period
- **Idempotency**: Based on (user_id, payroll_period, original_hash)
- **States**: PENDING (replaceable), SIGNED (invalidate only), INVALIDATED (read-only)
- **Rollback**: Application-level transactions with GCS cleanup

### New Components
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

### Execution Steps
1. Update types and database documentation
2. Implement internal auth middleware
3. Extend GCS utilities
4. Create admin repository
5. Add upload logic to service and controller
6. Update routes
7. Add logging
8. Update environment variables
9. Test with Postman