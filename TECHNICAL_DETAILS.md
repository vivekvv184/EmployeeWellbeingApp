# Employee Wellbeing Platform - Technical Documentation

This document provides detailed technical information about the Employee Wellbeing Platform's architecture, application flow, and implementation details.

## Table of Contents

1. [Application Flow](#application-flow)
2. [Technical Architecture](#technical-architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Frontend Components](#frontend-components)
6. [Authentication & Authorization](#authentication--authorization)
7. [MongoDB Integration](#mongodb-integration)
8. [Code Organization](#code-organization)

## Application Flow

### Authentication Flow

1. **Login Process**:
   ```
   User → login.html → auth.js → /api/Auth/login → AuthController → UserService → MongoDB
                                ↓
                    Check role (admin/regular user)
                                ↓
          If admin → admin.html | If regular → index.html
   ```

2. **Registration Process**:
   ```
   User → login.html (Registration Tab) → auth.js → /api/Auth/register → AuthController
                                                           ↓
                                      UserService.CreateUserAsync() → MongoDB
                                                           ↓
                                                    Redirect to Login
   ```

### User Dashboard Flow

```
User → index.html → script.js → /api/Wellbeing → WellbeingController → WellbeingService
                                      ↓
                        Display mood metrics, charts, recommendations
                                      ↓
              User enters mood → /api/Wellbeing/mood → MongoDB
```

### Admin Dashboard Flow

```
Admin → admin.html → admin.js, admin-dashboard.js → Multiple API endpoints:
                                      ↓
          ┌─────────────────┬────────┴──────────┬────────────────┐
/api/Users (CRUD)    /api/Wellbeing/metrics    /api/Dashboard    /api/AI/status
      ↓                     ↓                        ↓                 ↓
UserService         WellbeingService           DashboardController    AIService
      ↓                     ↓                        ↓                 ↓
   MongoDB              MongoDB                  Aggregated Stats     Status Check
                                                     ↓                 ↓
                                              Display in Dashboard   Display Status
```

## Technical Architecture

### High-Level Architecture

```
┌────────────┐       ┌───────────┐       ┌────────────────┐      ┌────────────┐
│  Frontend  │──────▶│ ASP.NET API │──────▶│ Service Layer    │─────▶│ MongoDB Atlas│
│ HTML/JS/CSS│◄──────│ Controllers │◄──────│ Business Logic   │◄─────│    Database  │
└────────────┘       └───────────┘       └────────────────┘      └────────────┘
                                                                             │
                                                                             │
                                                                             ┃
                                                                      ┌─────────────┐
                                                                      │ Data Seeding  │
                                                                      │ Mechanisms    │
                                                                      └─────────────┘
```

### Component Interaction Diagram

```
Frontend                          Backend                            Data Storage
┌────────────┐                 ┌────────────┐                     ┌────────────┐
│ Login/Auth │◀───────────────▶│AuthController│◀───────────────────▶│           │
└────────────┘                 └────────────┘                     │           │
      ▲                               ▲                           │           │
      │                               │                           │           │
      ▼                               ▼                           │           │
┌────────────┐                 ┌────────────┐                     │  MongoDB  │
│ User       │◀───────────────▶│UsersController│◀─────────────────▶│  Atlas    │
│ Dashboard  │                 └────────────┘                     │           │
└────────────┘                        ▲                           │           │
      ▲                               │                           │           │
      │                               │                           │           │
      ▼                               ▼                           │           │
┌────────────┐                 ┌────────────┐                     │           │
│ Admin      │◀───────────────▶│WellbeingController│◀─────────────▶│           │
│ Dashboard  │                 └────────────┘                     └────────────┘
```

## Database Schema

### MongoDB Collections

1. **Users Collection**:
   ```json
   {
     "Id": int,
     "Name": string,
     "Email": string,
     "Username": string,
     "PasswordHash": string,
     "Department": string,
     "TeamId": int?,
     "IsAdmin": bool,
     "Role": string,
     "JoinDate": DateTime,
     "LastLoginAt": DateTime,
     "MoodRecords": []
   }
   ```

2. **MoodRecords Collection**:
   ```json
   {
     "Id": int,
     "UserId": int,
     "MoodScore": int,
     "Notes": string,
     "RecordedAt": DateTime
   }
   ```

3. **Recommendations Collection**:
   ```json
   {
     "Id": int,
     "Title": string,
     "Description": string,
     "Category": string
   }
   ```

### Relationships

- Users have many MoodRecords (1:N)
- Recommendations are standalone and assigned to users based on mood patterns

## API Endpoints

### Authentication

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/Auth/login` | POST | Authenticate user | `{ username, password }` | User object with token |
| `/api/Auth/register` | POST | Register new user | User info | Created user |

### Users

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/Users` | GET | Get all users | - | Array of users |
| `/api/Users/{id}` | GET | Get user by ID | - | Single user |
| `/api/Users` | POST | Create user | User info | Created user |
| `/api/Users/{id}` | PUT | Update user | User updates | Updated user |
| `/api/Users/{id}` | DELETE | Delete user | - | Success message |
| `/api/Users/count` | GET | Get user count | - | Count value |

### Wellbeing

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/Wellbeing` | GET | Get wellbeing metrics | - | Metrics object |
| `/api/Wellbeing/metrics` | GET | Get detailed metrics | - | Metrics with data source |
| `/api/Wellbeing/mood` | POST | Record mood | Mood record | Success |
| `/api/Wellbeing/mood/{userId}` | GET | Get user's mood records | - | Array of records |
| `/api/Wellbeing/recommendations` | GET | Get recommendations | - | Array of recommendations |

### Dashboard (Admin)

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/Dashboard/stats` | GET | Get dashboard statistics | - | Stats object |

### AI

| Endpoint | Method | Description | Request Body | Response |
|----------|--------|-------------|--------------|----------|
| `/api/AI/status` | GET | Get AI service status | - | Status object |

## Frontend Components

### Core Pages

1. **login.html**: Authentication portal with login and registration tabs
2. **index.html**: Main user dashboard for mood tracking and recommendations
3. **admin.html**: Admin dashboard for user management and system monitoring

### JavaScript Modules

1. **auth.js**: Handles authentication, session management, and redirection
2. **script.js**: Main dashboard functionality for regular users
3. **admin.js**: Admin dashboard functionality for user management
4. **admin-dashboard.js**: Real-time statistics and monitoring for admin dashboard
5. **chart-utils.js**: Chart rendering utilities using Chart.js

## Authentication & Authorization

### Authentication Mechanism

1. **Login Flow**:
   - Client sends credentials to `/api/Auth/login`
   - Server validates against MongoDB database
   - On success, user object is returned
   - Client stores user object in localStorage for session persistence

2. **Session Management**:
   - User session is maintained in browser localStorage
   - Each protected page checks for valid session on load
   - Session includes user role for access control

### Role-Based Access Control

1. **User Roles**:
   - `Administrator`: Full access to all features including admin dashboard
   - `Employee`: Access to personal dashboard only

2. **Access Control Implementation**:
   - Frontend: Checks user.isAdmin before allowing access to admin pages
   - Backend: Some endpoints could implement role checks (future enhancement)

## MongoDB Integration

### Connection Setup

1. **Configuration**:
   - Connection string and database name defined in `appsettings.json`
   - MongoDB Atlas cloud-hosted instance for production
   - Connection options include retry writes and majority write concern

2. **MongoDbService**:
   - Central service for all MongoDB operations
   - Singleton service registered in DI container
   - Provides typed collections for Users, MoodRecords, and Recommendations

### Data Operations

1. **Repository Pattern**:
   - Each domain service (UserService, WellbeingService) uses MongoDbService
   - CRUD operations defined in service interfaces
   - Asynchronous methods using Task-based API

2. **Data Seeding**:
   - Automatic seeding on first startup if collections are empty
   - 25 wellbeing recommendations pre-populated
   - Default admin user created if none exists

## Resilience Strategy

1. **Frontend Resilience**:
   - Multiple API endpoint attempts
   - Graceful degradation with meaningful user feedback
   - Cached data display when possible

2. **Backend Resilience**:
   - Try/catch blocks around database operations
   - Consistent service interfaces for database operations
   - Comprehensive error logging and monitoring
   - Proper exception handling throughout the application

## Code Organization

### Backend Structure

```
Backend/
├── EmployeeWellbeingPlatform.Api/
│   ├── Controllers/
│   │   ├── AuthController.cs
│   │   ├── UsersController.cs
│   │   ├── WellbeingController.cs
│   │   ├── DashboardController.cs
│   │   └── AIController.cs
│   ├── Models/
│   │   ├── User.cs
│   │   ├── MoodRecord.cs
│   │   └── Recommendation.cs
│   ├── Services/
│   │   ├── Interfaces/
│   │   │   ├── IUserService.cs
│   │   │   └── IWellbeingService.cs
│   │   ├── UserService.cs
│   │   ├── WellbeingService.cs
│   │   ├── MongoDbService.cs
│   │   └── AIService.cs
│   ├── appsettings.json
│   └── Program.cs
```

### Frontend Structure

```
Frontend/
├── admin.html
├── index.html
├── login.html
├── css/
│   ├── style.css
│   └── admin.css
├── js/
│   ├── auth.js
│   ├── script.js
│   ├── admin.js
│   ├── admin-dashboard.js
│   └── chart-utils.js
└── assets/
    └── images/
```

## Performance Considerations

### Backend Optimizations

1. **Async/Await Pattern**:
   - Non-blocking I/O for database operations
   - Task-based parallel processing where appropriate

2. **MongoDB Optimization**:
   - Appropriate indexes on frequently queried fields
   - Projection to limit returned fields when possible

### Frontend Optimizations

1. **Resource Loading**:
   - Minified CSS and JavaScript (future enhancement)
   - Efficient DOM manipulation with jQuery

2. **API Communication**:
   - Timeout settings for all AJAX calls
   - Retry logic for transient failures
   - Optimistic UI updates before confirmation

## Deployment Considerations

### Development Environment

- Local .NET Core development server on port 5000
- Local frontend files served directly from filesystem

### Production Options (Future)

1. **Backend**:
   - Azure App Service
   - Docker containers on Kubernetes
   - Google Cloud Run

2. **Frontend**:
   - Static file hosting (Azure Blob Storage, Google Cloud Storage)
   - CDN for improved global performance

3. **Database**:
   - MongoDB Atlas with appropriate instance sizing
   - Backup and restore procedures
   - Monitoring and alerting

---

This technical documentation provides a comprehensive overview of the Employee Wellbeing Platform's internal architecture and implementation details. It's designed to help developers understand the system's components, data flow, and technical decisions for future maintenance and enhancement.
