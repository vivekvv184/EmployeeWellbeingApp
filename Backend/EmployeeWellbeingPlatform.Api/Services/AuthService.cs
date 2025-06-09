using EmployeeWellbeingPlatform.Api.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public class AuthService
    {
        private readonly IMongoCollection<User> _users;
        
        public AuthService(MongoDbService mongoDbService)
        {
            _users = mongoDbService.GetCollection<User>("Users");
            
            // Seed users if empty
            SeedUsersIfEmpty().Wait();
        }
        
        public async Task<User> AuthenticateAsync(string username, string password)
        {
            // Get user by username
            var user = await _users.Find(u => u.Username == username).FirstOrDefaultAsync();
            
            if (user == null)
            {
                return null; // User not found
            }
            
            // Verify password
            if (VerifyPassword(password, user.PasswordHash))
            {
                // Update last login time
                var update = Builders<User>.Update.Set(u => u.LastLoginAt, DateTime.UtcNow);
                await _users.UpdateOneAsync(u => u.Id == user.Id, update);
                
                return user;
            }
            
            return null; // Password incorrect
        }
        
        public async Task<User> RegisterAsync(User user, string password)
        {
            // Check if username already exists
            if (await _users.Find(u => u.Username == user.Username).AnyAsync())
            {
                throw new InvalidOperationException("Username already exists");
            }
            
            // Hash password
            user.PasswordHash = HashPassword(password);
            user.JoinDate = DateTime.UtcNow;
            user.LastLoginAt = DateTime.UtcNow;
            
            // Get max ID or start at 1
            var maxIdUser = await _users.Find(_ => true)
                .SortByDescending(u => u.Id)
                .FirstOrDefaultAsync();
                
            user.Id = (maxIdUser?.Id ?? 0) + 1;
            
            // Insert new user
            await _users.InsertOneAsync(user);
            
            return user;
        }
        
        private string HashPassword(string password)
        {
            using var sha256 = SHA256.Create();
            var hashedBytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password));
            return Convert.ToBase64String(hashedBytes);
        }
        
        private bool VerifyPassword(string password, string passwordHash)
        {
            return HashPassword(password) == passwordHash;
        }
        
        private async Task SeedUsersIfEmpty()
        {
            if (await _users.CountDocumentsAsync(FilterDefinition<User>.Empty) == 0)
            {
                var defaultUsers = new[]
                {
                    new User
                    {
                        Id = 1,
                        Name = "Ronaldo",
                        Email = "Ronaldo@ukg.com",
                        Username = "john",
                        PasswordHash = HashPassword("password@123"),
                        Department = "Marketing",
                        TeamId = 1,
                        IsAdmin = false,
                        Role = "Employee",
                        JoinDate = new DateTime(2023, 5, 31, 6, 12, 11, 79, DateTimeKind.Utc),
                        LastLoginAt = new DateTime(2025, 5, 31, 15, 32, 52, 322, DateTimeKind.Utc),
                        MoodRecords = new List<MoodRecord>()
                    },
                    new User
                    {
                        Id = 4,
                        Name = "Messi",
                        Email = "Messi@ukg.com",
                        Username = "messi",
                        PasswordHash = HashPassword("password@123"),
                        Department = "Operations",
                        TeamId = null,
                        IsAdmin = false,
                        Role = "Employee",
                        JoinDate = new DateTime(2025, 5, 31, 17, 18, 31, 356, DateTimeKind.Utc),
                        LastLoginAt = new DateTime(2025, 5, 31, 17, 18, 31, 356, DateTimeKind.Utc),
                        MoodRecords = new List<MoodRecord>()
                    },
                    new User
                    {
                        Id = 2,
                        Name = "Vivek Sharma",
                        Email = "Vivek@ukg.com",
                        Username = "Vivek",
                        PasswordHash = HashPassword("password@123"),
                        Department = "IT",
                        TeamId = 2,
                        IsAdmin = true,
                        Role = "Admin",
                        JoinDate = new DateTime(2022, 5, 31, 6, 12, 11, 79, DateTimeKind.Utc),
                        LastLoginAt = new DateTime(2025, 6, 1, 4, 47, 17, 200, DateTimeKind.Utc),
                        MoodRecords = new List<MoodRecord>()
                    },
                    new User
                    {
                        Id = 3,
                        Name = "Admin User",
                        Email = "admin@ukg.com",
                        Username = "admin",
                        PasswordHash = HashPassword("password@123"),
                        Department = "IT",
                        TeamId = null,
                        IsAdmin = true,
                        Role = "Admin",
                        JoinDate = new DateTime(2020, 5, 31, 6, 12, 11, 79, DateTimeKind.Utc),
                        LastLoginAt = new DateTime(2025, 5, 31, 16, 31, 14, 32, DateTimeKind.Utc),
                        MoodRecords = new List<MoodRecord>()
                    }
                };
                
                await _users.InsertManyAsync(defaultUsers);
            }
        }
    }
}
