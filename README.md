# Employee Wellbeing Platform

An AI-Enhanced Employee Wellbeing Platform that helps organizations monitor and promote employee wellbeing using artificial intelligence and MongoDB persistence.

## Project Overview

This platform enables organizations to foster a healthier, more productive workplace by providing tools for both employees and administrators:

### For Employees:
- Track daily mood and wellbeing metrics
- Receive AI-powered personalized recommendations to improve wellbeing
- View trends and insights about their wellbeing over time
- Seamless, intuitive UI for quick daily check-ins

### For Administrators:
- Comprehensive admin dashboard with real-time statistics
- Complete user management system with MongoDB persistence
- Role-based access control for secure administration
- System status monitoring with API connectivity indicators

## Architecture & Technology Stack

### Backend (ASP.NET Core 8.0 API)
- **Controllers**:
  - `WellbeingController`: Handles mood tracking, metrics, and recommendations
  - `UsersController`: Manages user CRUD operations with MongoDB integration
  - `AuthController`: Handles authentication and authorization
  - `DashboardController`: Provides admin dashboard statistics
  - `AIController`: AI-powered recommendation engine integration

- **Services**:
  - `WellbeingService`: Core service for wellbeing metrics and recommendations
  - `UserService`: User management with MongoDB persistence
  - `MongoDbService`: MongoDB database operations
  - `AIService`: Integration with AI recommendation systems
  - `ChatbotService`: AI-powered chat assistance for wellbeing

- **Data Persistence**:
  - MongoDB Atlas integration for storing:
    - User accounts and profiles
    - Mood entries and historical data
    - Wellbeing recommendations
  - Automatic data seeding for first-time setup
  - Real-time data synchronization

### Frontend (HTML/CSS/JavaScript)
- **Dashboard**: Real-time wellbeing metrics visualization using Chart.js
- **Admin Panel**: Complete user management interface
- **Authentication**: Secure login/registration with role-based access
- **Responsive Design**: Bootstrap-based UI that works on all devices
- **API Integration**: jQuery AJAX calls with error handling
- **AI Chatbot**: Interactive wellbeing assistant using AI technologies

## Key Features

### MongoDB Integration
- Connection to MongoDB Atlas cloud database
- Persistent storage of user data, mood records, and recommendations
- Automatic seeding of initial data when collections are empty
- Connection status monitoring in admin dashboard

### Role-Based Access Control
- Admin users can access the admin dashboard
- Regular users are restricted to their personal dashboard
- Authentication checks on both frontend and backend

### Admin Dashboard
- Real-time statistics showing total users, mood entries, and average mood
- User management interface with add/edit/delete capabilities
- System status monitoring showing MongoDB connectivity
- API status indicators with real-time updates

### Wellbeing Features
- Mood tracking with notes and timestamps
- Personalized recommendations based on mood patterns
- Historical trend visualization
- AI-enhanced suggestion system

## Implementation Notes

### Development Approach
- Focus on robust architecture and maintainability
- Emphasis on creating a smooth user experience
- MongoDB integration for reliable data persistence

### Technical Decisions
- HTML/CSS/JS frontend for optimal flexibility and performance
- Standardized API endpoints with consistent naming conventions
- MongoDB Atlas for secure and scalable data storage
- AI integration for personalized wellbeing recommendations

## Getting Started

### Prerequisites
- .NET 8.0 SDK
- MongoDB Atlas account

### Running the Application

1. **Backend API**:
   ```bash
   cd Backend/EmployeeWellbeingPlatform.Api
   dotnet run
   ```

2. **Frontend**:
   - Open `Frontend/login.html` in your browser
   - Use demo credentials:
     - Admin users: 
       - username: `admin`, password: `password@123`
       - username: `Vivek`, password: `password@123`
     - Regular users: 
       - username: `john`, password: `password@123`
       - username: `messi`, password: `password@123`

### Configuration

The MongoDB connection string can be configured in `appsettings.json`:

```json
"MongoDbSettings": {
  "ConnectionString": "mongodb+srv://Vivek123:<password>@cluster0.bcqjhjq.mongodb.net/",
  "DatabaseName": "EmployeeWellbeing"
}
```

## Future Enhancements

- Enhanced security with JWT authentication
- Proper password hashing and salting
- More sophisticated AI recommendation engine
- Team management and department-level analytics
- Mobile application integration
  - Personalized recommendations
  - Offline capability with static data fallback

## Technologies Used

- **Backend**:
  - ASP.NET Core 8.0
  - Swagger API documentation

- **Frontend**:
  - HTML5, CSS3, JavaScript
  - Bootstrap 5
  - Chart.js for data visualization
  - jQuery for DOM manipulation

## Running the Application

### Frontend

Simply open the `Frontend/index.html` file in your web browser after starting the backend API.

### Backend

1. Navigate to the backend directory:
   ```
   cd Backend/EmployeeWellbeingPlatform.Api
   ```

2. Run the application:
   ```
   dotnet run
   ```

   > **Note**: The backend must be running for the application to function properly.

3. Access the Swagger API documentation at:
   ```
   http://localhost:xxxxx/swagger
   ```
   (where xxxxx is the port number shown in the console)

## Architecture and Features

### AI Integration

This platform demonstrates how AI can be used to enhance employee wellbeing:

1. **Personalized Recommendations**: The system provides tailored wellbeing suggestions based on mood patterns.

2. **Trend Analysis**: AI analyzes mood data to identify patterns and trends in employee wellbeing.

3. **Future Integration Possibilities**:
   - Integration with Google Cloud AI services for more sophisticated recommendations
   - Use of MongoDB for efficient data storage and retrieval
   - Implementation of Datadog for monitoring and analytics

## Features

- **Mood Tracking**: Record daily mood and wellbeing metrics
- **Data Visualization**: View trends and patterns in wellbeing metrics
- **AI-Powered Recommendations**: Receive personalized suggestions to improve wellbeing
- **Responsive Design**: Access the platform from any device
- **AI Chatbot**: Interactive wellbeing assistant powered by advanced AI
- **MongoDB Integration**: Persistent storage of all user data and mood records

## Next Steps

- Enhance AI capabilities with Google Cloud AI services integration
- Implement JWT authentication for improved security
- Add Datadog for system monitoring and analytics
- Develop additional wellbeing features like meditation timers and activity tracking
- Create native mobile applications for iOS and Android
- Implement team-based analytics and wellbeing tracking

## Screenshots

(Screenshots will be added once the application is running)
