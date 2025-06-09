using EmployeeWellbeingPlatform.Api.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    /// <summary>
    /// Interface for user management operations
    /// </summary>
    public interface IUserService
    {
        /// <summary>
        /// Response with users and data source information
        /// </summary>
        public class UsersResponse
        {
            public List<User> Users { get; set; }
            public string DataSource { get; set; }
        }
        
        /// <summary>
        /// Get all users
        /// </summary>
        Task<List<User>> GetUsersAsync();
        
        /// <summary>
        /// Get all users with data source information
        /// </summary>
        Task<UsersResponse> GetUsersWithSourceAsync();
        
        /// <summary>
        /// Get user by ID
        /// </summary>
        Task<User> GetUserByIdAsync(int id);
        
        /// <summary>
        /// Get user by username
        /// </summary>
        Task<User> GetUserByUsernameAsync(string username);
        
        /// <summary>
        /// Create a new user
        /// </summary>
        Task<User> CreateUserAsync(User user);
        
        /// <summary>
        /// Update an existing user
        /// </summary>
        Task<User> UpdateUserAsync(User user);
        
        /// <summary>
        /// Delete a user
        /// </summary>
        Task<bool> DeleteUserAsync(int id);
        
        /// <summary>
        /// Get total user count
        /// </summary>
        Task<int> GetUserCountAsync();
        
        /// <summary>
        /// Authenticate a user
        /// </summary>
        Task<User> AuthenticateAsync(string username, string password);
    }
}
