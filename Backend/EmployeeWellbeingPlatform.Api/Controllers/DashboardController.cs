using EmployeeWellbeingPlatform.Api.Models;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System;
using System.Linq;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class DashboardController : ControllerBase
    {
        private readonly IUserService _userService;
        private readonly IWellbeingService _wellbeingService;
        private readonly MongoDbService _mongoDbService;
        private readonly ILogger<DashboardController> _logger;

        public DashboardController(
            IUserService userService, 
            IWellbeingService wellbeingService,
            MongoDbService mongoDbService,
            ILogger<DashboardController> logger)
        {
            _userService = userService;
            _wellbeingService = wellbeingService;
            _mongoDbService = mongoDbService;
            _logger = logger;
        }

        /// <summary>
        /// Get dashboard stats
        /// </summary>
        [HttpGet("stats")]
        public async Task<IActionResult> GetDashboardStats()
        {
            try
            {
                _logger.LogInformation("Getting dashboard statistics");
                
                // Collect all stats
                var userCount = await _userService.GetUserCountAsync();
                var users = await _userService.GetUsersAsync();
                
                var moodRecords = await _wellbeingService.GetAllMoodRecordsAsync();
                var moodCount = moodRecords.Count;
                
                // Calculate average mood
                double averageMood = 0;
                if (moodCount > 0)
                {
                    averageMood = moodRecords.Average(m => m.MoodScore);
                }
                
                // Get recommendations count
                var recommendations = await _wellbeingService.GetRecommendationsAsync();
                var recommendationsCount = recommendations.Count;
                
                // Get database status
                bool isDatabaseConnected = _mongoDbService.IsDatabaseConnected();
                
                // Get active users (logged in within last 7 days)
                var sevenDaysAgo = DateTime.UtcNow.AddDays(-7);
                var activeUserCount = users.Count(u => u.LastLoginAt >= sevenDaysAgo);
                
                // Build stats object
                var stats = new
                {
                    totalUsers = userCount,
                    activeUsers = activeUserCount,
                    totalMoodEntries = moodCount,
                    averageMood = Math.Round(averageMood, 1),
                    totalRecommendations = recommendationsCount,
                    databaseStatus = isDatabaseConnected ? "Connected" : "Disconnected",
                    dataSource = isDatabaseConnected ? "MongoDB Atlas" : "Static Data",
                    lastUpdated = DateTime.UtcNow
                };
                
                return Ok(stats);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error getting dashboard stats");
                return StatusCode(500, new { error = "An error occurred while retrieving dashboard statistics", message = ex.Message });
            }
        }
    }
}
