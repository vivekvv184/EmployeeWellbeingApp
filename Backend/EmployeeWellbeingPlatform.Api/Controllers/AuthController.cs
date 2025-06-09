using EmployeeWellbeingPlatform.Api.Models;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly ILogger<AuthController> _logger;

        public AuthController(IUserService userService, ILogger<AuthController> logger)
        {
            _userService = userService;
            _logger = logger;
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest request)
        {
            try
            {
                _logger.LogInformation($"Login attempt for user {request.Username}");
                var user = await _userService.AuthenticateAsync(request.Username, request.Password);
                
                if (user == null)
                {
                    _logger.LogWarning($"Failed login attempt for user {request.Username}");
                    return Unauthorized(new { message = "Username or password is incorrect" });
                }

                _logger.LogInformation($"Successful login for user {request.Username}");
                
                // For simplicity, we're returning the user object
                // In a real application, you would return a JWT token
                return Ok(new 
                { 
                    id = user.Id,
                    username = user.Username,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    isAdmin = user.IsAdmin,
                    department = user.Department,
                    lastLoginAt = user.LastLoginAt
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during login for user {request.Username}");
                return StatusCode(500, new { message = "An error occurred during login", error = ex.Message });
            }
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest request)
        {
            try
            {
                _logger.LogInformation($"Registration attempt for user {request.Username}");
                
                // Check if username already exists
                var existingUser = await _userService.GetUserByUsernameAsync(request.Username);
                if (existingUser != null)
                {
                    _logger.LogWarning($"Registration failed: Username {request.Username} already exists");
                    return BadRequest(new { message = "Username already exists" });
                }
                
                var user = new User
                {
                    Name = request.Name,
                    Email = request.Email,
                    Username = request.Username,
                    Department = request.Department,
                    PasswordHash = request.Password, // In a real app, this would be hashed
                    IsAdmin = false, // Default to regular user
                    Role = "Employee",
                    JoinDate = DateTime.UtcNow,
                    LastLoginAt = DateTime.UtcNow
                };

                user = await _userService.CreateUserAsync(user);
                _logger.LogInformation($"Successfully registered user {request.Username}");

                return Ok(new 
                { 
                    id = user.Id,
                    username = user.Username,
                    name = user.Name,
                    email = user.Email,
                    role = user.Role,
                    isAdmin = user.IsAdmin,
                    department = user.Department
                });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error during registration for user {request.Username}");
                return StatusCode(500, new { message = "An error occurred during registration", error = ex.Message });
            }
        }
    }

    public class LoginRequest
    {
        public string Username { get; set; }
        public string Password { get; set; }
    }

    public class RegisterRequest
    {
        public string Name { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string Password { get; set; }
        public string Department { get; set; }
    }
}
