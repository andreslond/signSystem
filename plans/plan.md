# SignSystem Backend Phase 1 Plan

## PLANNING Section

### Overall Backend Architecture
The backend follows a layered architecture to ensure separation of concerns, maintainability, and scalability. The layers are:
- **Presentation Layer (Controllers)**: Handles HTTP requests and responses, input validation, and delegates to the service layer.
- **Business Logic Layer (Services)**: Contains business logic, orchestrates data operations via repositories, and prepares data for controllers.
- **Data Access Layer (Repositories)**: Manages database interactions, queries, and data transformations using the Supabase client.

This architecture promotes clean code, easy testing, and future extensibility (e.g., for Phase 2 PDF signing logic).

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
│   │   └── authMiddleware.ts
│   ├── routes/
│   │   └── documentRoutes.ts
│   ├── config/
│   │   └── supabase.ts
│   ├── app.ts
│   └── server.ts
├── package.json
├── tsconfig.json
├── .env.example
└── DATABASE_MODEL.md
```

- `src/`: Main source code directory.
- `controllers/`: HTTP request handlers.
- `services/`: Business logic implementations.
- `repositories/`: Database access logic.
- `middleware/`: Custom middleware, including JWT validation.
- `routes/`: Route definitions.
- `config/`: Configuration files, e.g., Supabase client setup.
- `app.ts`: Express app configuration.
- `server.ts`: Server startup script.
- Root files: Package management, TypeScript config, environment example, and database documentation.

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
  - Placeholder for Phase 2 logic (e.g., PDF signing).
- **Repositories**:
  - Execute database queries using Supabase client.
  - Handle data mapping and basic transformations.
  - Enforce RLS via Supabase (no custom security logic).
  - Prepared for Phase 2 queries.

### How Supabase Auth JWT Validation Works
- Authentication is handled entirely by Supabase Auth; the backend only validates incoming JWTs.
- Middleware (`authMiddleware.ts`) checks for the `Authorization: Bearer <token>` header.
- Uses Supabase's `supabase.auth.getUser(token)` or similar to verify the token and extract user info (e.g., `auth.uid()` equivalent).
- If valid, attaches user context (e.g., user ID) to the request object.
- If invalid, returns 401 Unauthorized.
- Assumes RLS is enabled on database tables, so queries are automatically filtered by user.

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
3. **Error Handling**: Basic try-catch in controllers; services and repositories throw errors that bubble up.

## EXECUTION Section

### 1. Project Folder Structure
As outlined in the PLANNING section. Create directories and files as needed.

### 2. Express App Bootstrap Code
- `app.ts`: Configure Express app with middleware (CORS, JSON parsing, auth middleware), routes, and error handling.
- `server.ts`: Start the server on a port (e.g., 3000), listen for connections.

### 3. Supabase Client Initialization
- `config/supabase.ts`: Initialize Supabase client with URL and anon key from environment variables. Export the client instance.

### 4. JWT Validation Middleware
- `middleware/authMiddleware.ts`: Function to verify JWT using Supabase auth. Attach user ID to req.user.

### 5. DocumentController
- `controllers/DocumentController.ts`: Class with methods:
  - `getDocuments(req, res)`: Call service, return list.
  - `getDocumentById(req, res)`: Call service with ID, return document.
  - `signDocument(req, res)`: Placeholder, call service (empty in Phase 1).

### 6. DocumentService
- `services/DocumentService.ts`: Class with methods:
  - `getDocuments(userId)`: Call repository, return data.
  - `getDocumentById(userId, id)`: Call repository, return data.
  - `signDocument(userId, id)`: TODO for Phase 2, placeholder return.

### 7. DocumentRepository
- `repositories/DocumentRepository.ts`: Class with methods:
  - `findAll(userId)`: Query `ar_nomina.documents` with RLS.
  - `findById(userId, id)`: Query specific document.
  - `updateSignature(userId, id, signatureData)`: TODO for Phase 2.

### 8. Routing Setup
- `routes/documentRoutes.ts`: Define routes for /documents, /documents/:id, /documents/:id/sign, map to controller methods. Apply auth middleware to routes.

### 9. Environment Variables Example
- `.env.example`: SUPABASE_URL, SUPABASE_ANON_KEY, PORT.

### 10. DATABASE_MODEL.md
Document the schema as provided in the task. Include table descriptions, columns, types, and relationships.