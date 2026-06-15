# DevPulse 

A collaborative platform for software teams to report bugs, suggest features, and coordinate resolutions.

## Live URL

```
https://l2-assignment-2-alpha.vercel.app/
```

## Features

- JWT Authentication with role-based access control
- Two roles: **contributor** and **maintainer**
- Create and manage bug reports & feature requests
- Filter & sort issues by type, status, and date
- Secure password hashing with bcrypt
- PostgreSQL with raw SQL (no ORM/JOINs)

## Tech Stack

| Technology | Usage |
|---|---|
| Node.js (24.x LTS) | Runtime |
| TypeScript | Type safety |
| Express.js | Web framework |
| PostgreSQL | Database |
| pg (native driver) | DB client |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT tokens |
| http-status-codes | HTTP status constants |

## Project Structure

```
src/
├── config/
│   ├── database.ts       # PostgreSQL connection pool
│   └── types.ts          # All TypeScript interfaces
├── middleware/
│   ├── auth.middleware.ts  # JWT verify + role check
│   └── error.middleware.ts # Global error & 404 handler
├── modules/
│   ├── auth/
│   │   ├── auth.controller.ts
│   │   └── auth.routes.ts
│   └── issues/
│       ├── issues.controller.ts
│       └── issues.routes.ts
├── utils/
│   ├── jwt.util.ts       # Sign & verify tokens
│   ├── query.util.ts     # Reusable SQL helpers
│   └── response.util.ts  # Standard response format
├── app.ts                # Express app setup
└── server.ts             # Entry point
```

## Setup & Installation

### 1. Clone the repository
### 2. Install dependencies
### 3. Configure environment variables
### 4. Set up the database
### 5. Run the server

## API Endpoints

### Authentication

| Method | Endpoint | Access | Description |
|---|---|---|---|
| POST | `/api/auth/signup` | Public | Register new user |
| POST | `/api/auth/login` | Public | Login & get JWT |

### Issues

| Method | Endpoint | Access | Description |
|---|---|---|---|
| GET | `/api/issues` | Public | Get all issues (filter/sort) |
| GET | `/api/issues/:id` | Public | Get single issue |
| POST | `/api/issues` | Authenticated | Create new issue |
| PATCH | `/api/issues/:id` | Authenticated | Update issue |
| DELETE | `/api/issues/:id` | Maintainer only | Delete issue |

### Query Parameters for GET /api/issues

| Param | Values | Default |
|---|---|---|
| `sort` | `newest`, `oldest` | `newest` |
| `type` | `bug`, `feature_request` | (none) |
| `status` | `open`, `in_progress`, `resolved` | (none) |

### Authorization Header

```
Authorization: <JWT_TOKEN>
```

## Database Schema

### users

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| name | VARCHAR(255) | NOT NULL |
| email | VARCHAR(255) | NOT NULL, UNIQUE |
| password | VARCHAR(255) | NOT NULL |
| role | VARCHAR(20) | DEFAULT 'contributor', CHECK IN ('contributor','maintainer') |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

### issues

| Column | Type | Constraints |
|---|---|---|
| id | SERIAL | PRIMARY KEY |
| title | VARCHAR(150) | NOT NULL |
| description | TEXT | NOT NULL, MIN LENGTH 20 |
| type | VARCHAR(20) | CHECK IN ('bug','feature_request') |
| status | VARCHAR(20) | DEFAULT 'open', CHECK IN ('open','in_progress','resolved') |
| reporter_id | INTEGER | NOT NULL (app-level validation) |
| created_at | TIMESTAMPTZ | DEFAULT NOW() |
| updated_at | TIMESTAMPTZ | DEFAULT NOW() |

## Response Format

### Success

```json
{
  "success": true,
  "message": "Operation description",
  "data": {}
}
```

### Error

```json
{
  "success": false,
  "message": "Error description",
  "errors": "Error details"
}
```
