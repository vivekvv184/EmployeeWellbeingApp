using EmployeeWellbeingPlatform.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public class UserService : IUserService
    {
        private readonly ILogger<UserService> _logger;
        private readonly IConfiguration _configuration;
        private readonly IMongoCollection<User> _usersCollection;
        private readonly bool _useMongoDb;
        private int _nextUserId = 100; // For static data

        // Static data for fallback when MongoDB is unavailable
        private static List<User> _staticUsers = new List<User>
        {
            new User
            {
                Id = 1,
                Name = "Admin User",
                Email = "admin@example.com",
                Username = "admin",
                PasswordHash = "Password@123", // In a real app, this would be hashed
                Department = "IT",
                IsAdmin = true,
                Role = "Administrator",
                JoinDate = DateTime.UtcNow.AddDays(-30),
                LastLoginAt = DateTime.UtcNow
            },
            new User
            {
                Id = 2,
                Name = "John Smith",
                Email = "john.smith@example.com",
                Username = "john",
                PasswordHash = "Password@123", // In a real app, this would be hashed
                Department = "Marketing",
                IsAdmin = false,
                Role = "Employee",
                JoinDate = DateTime.UtcNow.AddDays(-20),
                LastLoginAt = DateTime.UtcNow.AddDays(-1)
            },
            new User
            {
                Id = 3,
                Name = "Emily Johnson",
                Email = "emily.johnson@example.com",
                Username = "emily",
                PasswordHash = "Password@123", // In a real app, this would be hashed
                Department = "HR",
                IsAdmin = false,
                Role = "Employee",
                JoinDate = DateTime.UtcNow.AddDays(-15),
                LastLoginAt = DateTime.UtcNow.AddDays(-2)
            }
        };

        public UserService(ILogger<UserService> logger, IConfiguration configuration)
        {
            _logger = logger;
            _configuration = configuration;

            // Initialize MongoDB client if enabled
            try
            {
                var mongoConnectionString = _configuration.GetSection("MongoDbSettings:ConnectionString").Value;
                var databaseName = _configuration.GetSection("MongoDbSettings:DatabaseName").Value;
                
                if (!string.IsNullOrEmpty(mongoConnectionString) && !string.IsNullOrEmpty(databaseName))
                {
                    var client = new MongoClient(mongoConnectionString);
                    var database = client.GetDatabase(databaseName);
                    _usersCollection = database.GetCollection<User>("Users");
                    _useMongoDb = true;
                    
                    // Seed initial users if collection is empty
                    SeedInitialUsers().Wait();
                    
                    _logger.LogInformation("MongoDB connection established for user service");
                }
                else
                {
                    _logger.LogWarning("MongoDB connection string or database name not configured, using static data");
                    _useMongoDb = false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Failed to connect to MongoDB, falling back to static data");
                _useMongoDb = false;
            }
        }

        /// <summary>
        /// Get all users
        /// </summary>
        public async Task<List<User>> GetUsersAsync()
        {
            try
            {
                if (_useMongoDb)
                {
                    var users = await _usersCollection.Find(_ => true).ToListAsync();
                    return users;
                }
                else
                {
                    // Use static data as fallback
                    return _staticUsers.ToList();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users from MongoDB, falling back to static data");
                return _staticUsers.ToList();
            }
        }
        
        /// <summary>
        /// Get all users with data source information
        /// </summary>
        public async Task<IUserService.UsersResponse> GetUsersWithSourceAsync()
        {
            string dataSource = "Unknown";
            List<User> users;
            
            try
            {
                if (_useMongoDb)
                {
                    try
                    {
                        // Test MongoDB connection with a simple count operation with timeout
                        var count = await _usersCollection.CountDocumentsAsync(FilterDefinition<User>.Empty, 
                            new CountOptions { MaxTime = TimeSpan.FromSeconds(3) });
                        
                        // If we get here, MongoDB is available
                        users = await _usersCollection.Find(_ => true).ToListAsync();
                        dataSource = "MongoDB Atlas";
                        _logger.LogInformation("Successfully retrieved {Count} users from MongoDB", users.Count);
                    }
                    catch (Exception ex)
                    {
                        // MongoDB query failed, fallback to static
                        _logger.LogWarning(ex, "MongoDB connection failed, falling back to static data");
                        users = _staticUsers.ToList();
                        dataSource = "Static Data (MongoDB Unavailable)";
                    }
                }
                else
                {
                    // MongoDB not configured, using static data
                    users = _staticUsers.ToList();
                    dataSource = "Static Data (MongoDB Not Configured)";
                    _logger.LogInformation("MongoDB not configured, using static data");
                }
            }
            catch (Exception ex)
            {
                // Handle any unexpected errors
                _logger.LogError(ex, "Error in GetUsersWithSourceAsync, falling back to static data");
                users = _staticUsers.ToList();
                dataSource = "Static Data (Error)";
            }
            
            return new IUserService.UsersResponse
            {
                Users = users,
                DataSource = dataSource
            };
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        public async Task<User> GetUserByIdAsync(int id)
        {
            try
            {
                if (_useMongoDb)
                {
                    var filter = Builders<User>.Filter.Eq(u => u.Id, id);
                    return await _usersCollection.Find(filter).FirstOrDefaultAsync();
                }
                else
                {
                    // Use static data as fallback
                    return _staticUsers.FirstOrDefault(u => u.Id == id);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user with ID {id} from MongoDB, falling back to static data");
                return _staticUsers.FirstOrDefault(u => u.Id == id);
            }
        }

        /// <summary>
        /// Get user by username
        /// </summary>
        public async Task<User> GetUserByUsernameAsync(string username)
        {
            try
            {
                if (_useMongoDb)
                {
                    var filter = Builders<User>.Filter.Eq(u => u.Username, username);
                    return await _usersCollection.Find(filter).FirstOrDefaultAsync();
                }
                else
                {
                    // Use static data as fallback
                    return _staticUsers.FirstOrDefault(u => u.Username == username);
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user with username {username} from MongoDB, falling back to static data");
                return _staticUsers.FirstOrDefault(u => u.Username == username);
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        public async Task<User> CreateUserAsync(User user)
        {
            try
            {
                if (_useMongoDb)
                {
                    // Ensure unique ID
                    if (user.Id <= 0)
                    {
                        // Find the highest user ID and increment by 1
                        var highestIdUser = await _usersCollection.Find(_ => true)
                            .SortByDescending(u => u.Id)
                            .FirstOrDefaultAsync();
                            
                        user.Id = (highestIdUser?.Id ?? 0) + 1;
                    }
                    
                    await _usersCollection.InsertOneAsync(user);
                    return user;
                }
                else
                {
                    // Use static data as fallback
                    user.Id = _staticUsers.Count > 0 ? _staticUsers.Max(u => u.Id) + 1 : 1;
                    _staticUsers.Add(user);
                    return user;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error creating user in MongoDB, falling back to static data");
                
                // Fallback to static data
                user.Id = _staticUsers.Count > 0 ? _staticUsers.Max(u => u.Id) + 1 : 1;
                _staticUsers.Add(user);
                return user;
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        public async Task<User> UpdateUserAsync(User user)
        {
            try
            {
                if (_useMongoDb)
                {
                    var filter = Builders<User>.Filter.Eq(u => u.Id, user.Id);
                    await _usersCollection.ReplaceOneAsync(filter, user);
                    return user;
                }
                else
                {
                    // Use static data as fallback
                    var index = _staticUsers.FindIndex(u => u.Id == user.Id);
                    if (index >= 0)
                    {
                        _staticUsers[index] = user;
                    }
                    return user;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user with ID {user.Id} in MongoDB, falling back to static data");
                
                // Fallback to static data
                var index = _staticUsers.FindIndex(u => u.Id == user.Id);
                if (index >= 0)
                {
                    _staticUsers[index] = user;
                }
                return user;
            }
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        public async Task<bool> DeleteUserAsync(int id)
        {
            try
            {
                if (_useMongoDb)
                {
                    var filter = Builders<User>.Filter.Eq(u => u.Id, id);
                    var result = await _usersCollection.DeleteOneAsync(filter);
                    return result.DeletedCount > 0;
                }
                else
                {
                    // Use static data as fallback
                    var index = _staticUsers.FindIndex(u => u.Id == id);
                    if (index >= 0)
                    {
                        _staticUsers.RemoveAt(index);
                        return true;
                    }
                    return false;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user with ID {id} from MongoDB, falling back to static data");
                
                // Fallback to static data
                var index = _staticUsers.FindIndex(u => u.Id == id);
                if (index >= 0)
                {
                    _staticUsers.RemoveAt(index);
                    return true;
                }
                return false;
            }
        }

        /// <summary>
        /// Get total user count
        /// </summary>
        public async Task<int> GetUserCountAsync()
        {
            try
            {
                if (_useMongoDb)
                {
                    return (int)await _usersCollection.CountDocumentsAsync(_ => true);
                }
                else
                {
                    // Use static data as fallback
                    return _staticUsers.Count;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user count from MongoDB, falling back to static data");
                return _staticUsers.Count;
            }
        }

        /// <summary>
        /// Authenticate a user
        /// </summary>
        public async Task<User> AuthenticateAsync(string username, string password)
        {
            try
            {
                if (_useMongoDb)
                {
                    // In a real app, we would hash the password and compare the hashes
                    var filter = Builders<User>.Filter.Eq(u => u.Username, username) & 
                                 Builders<User>.Filter.Eq(u => u.PasswordHash, password);
                    
                    var user = await _usersCollection.Find(filter).FirstOrDefaultAsync();
                    
                    if (user != null)
                    {
                        // Update last login time
                        user.LastLoginAt = DateTime.UtcNow;
                        await UpdateUserAsync(user);
                    }
                    
                    return user;
                }
                else
                {
                    // Use static data as fallback
                    var user = _staticUsers.FirstOrDefault(u => 
                        u.Username == username && u.PasswordHash == password);
                    
                    if (user != null)
                    {
                        user.LastLoginAt = DateTime.UtcNow;
                    }
                    
                    return user;
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error authenticating user {username} with MongoDB, falling back to static data");
                
                // Fallback to static data
                return _staticUsers.FirstOrDefault(u => 
                    u.Username == username && u.PasswordHash == password);
            }
        }

        /// <summary>
        /// Seed initial users if collection is empty
        /// </summary>
        private async Task SeedInitialUsers()
        {
            if (_useMongoDb)
            {
                var count = await _usersCollection.CountDocumentsAsync(_ => true);
                
                if (count == 0)
                {
                    _logger.LogInformation("Seeding initial users to MongoDB");
                    await _usersCollection.InsertManyAsync(_staticUsers);
                }
            }
        }
    }
}
