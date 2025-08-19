# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev          # Start development server with hot reload
npm run build        # Compile TypeScript to JavaScript
npm start            # Run production build
npm run lint         # Lint TypeScript files
npm run lint:fix     # Fix linting issues automatically
npm test             # Run tests with Vitest
npm test:ui          # Run tests with UI interface
```

## Architecture Overview

This is a **Hono.js-based API** migrated from Sails.js, designed as a transition step before moving to PocketBase. The codebase uses a **Repository pattern** with **no ORM** for easy data source migration.

### Key Architectural Patterns

**Repository Pattern with Interface Segregation**
- All data access goes through Repository interfaces (`src/repositories/interfaces/`)
- Current implementations are in `src/repositories/sqlite/`
- Future PocketBase implementations will share the same interfaces
- Repository Factory (`src/repositories/factory.ts`) switches between implementations via `APP_CONFIG.database.type`

**Middleware Policy System**
- Policy combinations in `src/middleware/policies.ts`:
  - `policies.normal()`: System maintenance + user auth + status check
  - `policies.admin()`: Normal policies + admin role check  
  - `policies.public()`: Only system maintenance check
  - `policies.pointOperation()`: Normal + anti-spam measures
- Signature validation automatically enabled in production via `APP_CONFIG.system.requireSignature`

**Database Layer**
- SQLite with 33 tables defined in `src/database/schema/tables.sql`
- BaseRepository provides common CRUD operations via prepared statements
- Unix timestamps used throughout (not ISO strings)
- Foreign key constraints enabled, WAL mode for performance

### Data Models & Relationships

The system manages a points/rewards platform with these core entities:
- **Users**: Auth, profiles, points balances, roles (normal/advance/admin)
- **Stories**: User-generated content with voting (ups/downs) and moderation
- **Transactions**: Point transfers between users with status workflow
- **Pointracks**: Point transaction history with different earning channels
- **Configuration tables**: System settings for rewards, finance, lottery

### Authentication System

Custom token-based auth using `shareMethod` service:
- HMAC-SHA1 password hashing with fixed salt `HNs.Twq8QrR=UAcGe6Nj` 
- Token format: `userId|timestamp|hmac_hash` encrypted with Base64+reverse (temporary implementation)
- Token passed in `utoken` header, validated by `checkUserToken` middleware
- User context available as `c.user` after authentication

### Response Patterns

Standardized via `responseHelpers` middleware:
- `c.quickError(statusCode, message)` for errors
- `c.ok(data)` for success responses
- Error format: `{success: false, error: string, statusCode: number}`

### Development Patterns

**Adding New Business Logic**:
1. Define TypeScript model in `src/models/`
2. Create Repository interface in `src/repositories/interfaces/`
3. Implement SQLite version in `src/repositories/sqlite/`
4. Add to Repository Factory
5. Create Controller with Zod validation schemas
6. Define routes with appropriate policy middleware

**Controller Pattern**:
- Use getter for Repository access (lazy loading): `private get userRepo() { return getUserRepository() }`
- Validate inputs with Zod schemas defined at file top
- Use try/catch with `shareMethod.analyzeError()` for consistent error handling

**Database Queries**:
- Inherit from `BaseRepository` for common operations
- Use prepared statements via `this.db.prepare()`
- Transaction wrapper: `this.executeTransaction(() => { /* operations */ })`
- Avoid method name conflicts by using `super.updateTable()` and `super.deleteTable()`

### Migration Context

This codebase serves as a migration bridge:
- `pointstorm.sails/` contains the original Sails.js implementation for reference
- Current SQLite schema mirrors original MySQL structure
- All business logic being ported incrementally (currently only User module complete)
- PocketBase migration planned via Repository pattern interface swapping