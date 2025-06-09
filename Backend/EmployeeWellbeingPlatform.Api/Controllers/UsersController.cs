using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using EmployeeWellbeingPlatform.Api.Models;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class UsersController : ControllerBase
    {
        private readonly ILogger<UsersController> _logger;
        private readonly IUserService _userService;

        public UsersController(ILogger<UsersController> logger, IUserService userService)
        {
            _logger = logger;
            _userService = userService;
        }

        /// <summary>
        /// Get all users
        /// </summary>
        [HttpGet]
        public async Task<IActionResult> GetUsers()
        {
            try
            {
                _logger.LogInformation("Getting all users");
                var result = await _userService.GetUsersWithSourceAsync();
                var users = result.Users;
                var dataSource = result.DataSource;
                
                // Remove sensitive data
                foreach (var user in users)
                {
                    user.PasswordHash = null;
                }
                
                return Ok(new { users, dataSource });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting users");
                return StatusCode(500, new { error = "An error occurred while retrieving users", message = ex.Message });
            }
        }

        /// <summary>
        /// Get user by ID
        /// </summary>
        [HttpGet("{id}")]
        public async Task<IActionResult> GetUser(int id)
        {
            try
            {
                _logger.LogInformation($"Getting user with ID {id}");
                var user = await _userService.GetUserByIdAsync(id);
                
                if (user == null)
                {
                    return NotFound(new { error = $"User with ID {id} not found" });
                }
                
                // Remove sensitive data
                user.PasswordHash = null;
                
                return Ok(user);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting user with ID {id}");
                return StatusCode(500, new { error = "An error occurred while retrieving the user", message = ex.Message });
            }
        }

        /// <summary>
        /// Create a new user
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateModel model)
        {
            try
            {
                // Validate model
                if (model == null)
                {
                    _logger.LogWarning("Invalid user creation model: null");
                    return BadRequest(new { error = "Invalid user data" });
                }
                
                // Ensure required fields have values
                model.Name = string.IsNullOrWhiteSpace(model.Name) ? "New User" : model.Name.Trim();
                model.Username = string.IsNullOrWhiteSpace(model.Username) ? 
                    model.Name.ToLower().Replace(" ", ".") : model.Username.Trim();
                model.Email = string.IsNullOrWhiteSpace(model.Email) ? 
                    $"{model.Username}@company.com" : model.Email.Trim();
                model.Department = string.IsNullOrWhiteSpace(model.Department) ? "General" : model.Department.Trim();
                model.Password = string.IsNullOrWhiteSpace(model.Password) ? "Password123" : model.Password;
                
                _logger.LogInformation($"Creating new user with username {model.Username}");
                
                // Check if username already exists
                var existingUser = await _userService.GetUserByUsernameAsync(model.Username);
                if (existingUser != null)
                {
                    _logger.LogWarning($"Username {model.Username} already exists");
                    return BadRequest(new { error = "Username already exists" });
                }
                
                // Create new user
                var newUser = new User
                {
                    Name = model.Name,
                    Email = model.Email,
                    Username = model.Username,
                    // In a real app, this would be properly hashed
                    PasswordHash = model.Password, 
                    Department = model.Department,
                    IsAdmin = model.IsAdmin,
                    Role = model.IsAdmin ? "Administrator" : "Employee",
                    JoinDate = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };
                
                _logger.LogInformation($"Sending user to database: {newUser.Name}, {newUser.Email}, {newUser.Department}");
                var createdUser = await _userService.CreateUserAsync(newUser);
                
                // Remove sensitive data
                createdUser.PasswordHash = null;
                
                return CreatedAtAction(nameof(GetUser), new { id = createdUser.Id }, createdUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error creating user: {ex.Message}");
                return StatusCode(500, new { error = "An error occurred while creating the user", message = ex.Message });
            }
        }

        /// <summary>
        /// Update an existing user
        /// </summary>
        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateModel model)
        {
            try
            {
                _logger.LogInformation($"Updating user with ID {id}");
                
                // Check if user exists
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound(new { error = $"User with ID {id} not found" });
                }
                
                // Update user fields
                existingUser.Name = model.Name ?? existingUser.Name;
                existingUser.Email = model.Email ?? existingUser.Email;
                existingUser.Department = model.Department ?? existingUser.Department;
                
                // Only update password if provided
                if (!string.IsNullOrEmpty(model.Password))
                {
                    // In a real app, this would be properly hashed
                    existingUser.PasswordHash = model.Password;
                }
                
                // Update admin status if specified
                if (model.IsAdmin.HasValue)
                {
                    existingUser.IsAdmin = model.IsAdmin.Value;
                    existingUser.Role = model.IsAdmin.Value ? "Administrator" : "Employee";
                }
                
                var updatedUser = await _userService.UpdateUserAsync(existingUser);
                
                // Remove sensitive data
                updatedUser.PasswordHash = null;
                
                return Ok(updatedUser);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error updating user with ID {id}");
                return StatusCode(500, new { error = "An error occurred while updating the user", message = ex.Message });
            }
        }

        /// <summary>
        /// Delete a user
        /// </summary>
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            try
            {
                _logger.LogInformation($"Deleting user with ID {id}");
                
                // Check if user exists
                var existingUser = await _userService.GetUserByIdAsync(id);
                if (existingUser == null)
                {
                    return NotFound(new { error = $"User with ID {id} not found" });
                }
                
                var success = await _userService.DeleteUserAsync(id);
                
                if (success)
                {
                    return NoContent();
                }
                else
                {
                    return StatusCode(500, new { error = "Failed to delete user" });
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error deleting user with ID {id}");
                return StatusCode(500, new { error = "An error occurred while deleting the user", message = ex.Message });
            }
        }

        /// <summary>
        /// Get user count
        /// </summary>
        [HttpGet("count")]
        public async Task<IActionResult> GetUserCount()
        {
            try
            {
                _logger.LogInformation("Getting user count");
                var count = await _userService.GetUserCountAsync();
                return Ok(new { count });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting user count");
                return StatusCode(500, new { error = "An error occurred while retrieving user count", message = ex.Message });
            }
        }
    }

    // Models for API requests
    public class UserCreateModel
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Department { get; set; }
        public bool IsAdmin { get; set; } = false;
    }

    public class UserUpdateModel
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Password { get; set; }
        public string Department { get; set; }
        public bool? IsAdmin { get; set; }
    }
}
