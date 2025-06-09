using System;
using System.Threading.Tasks;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AIController : ControllerBase
    {
        private readonly AIService _aiService;
        private readonly ILogger<AIController> _logger;

        public AIController(AIService aiService, ILogger<AIController> logger)
        {
            _aiService = aiService;
            _logger = logger;
        }

        /// <summary>
        /// Analyzes a mood entry using AI
        /// </summary>
        [HttpGet("analyze/{moodId}")]
        public async Task<IActionResult> AnalyzeMood(int moodId)
        {
            try
            {
                _logger.LogInformation($"Analyzing mood with ID {moodId}");
                var analysis = await _aiService.AnalyzeMoodAsync(moodId);
                return Ok(analysis);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error analyzing mood with ID {moodId}");
                
                // Return a more detailed error for debugging during hackathon
                return StatusCode(500, new { 
                    error = "An error occurred while analyzing the mood",
                    message = ex.Message,
                    moodId = moodId 
                });
            }
        }

        /// <summary>
        /// Gets a personalized wellbeing recommendation for a user
        /// </summary>
        [HttpGet("recommendation/{userId}")]
        public async Task<IActionResult> GetRecommendation(int userId)
        {
            try
            {
                _logger.LogInformation($"Getting recommendation for user {userId}");
                var recommendation = await _aiService.GetPersonalizedRecommendationAsync(userId);
                return Ok(new { recommendation });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error getting recommendation for user {userId}");
                
                // Return a more detailed error for debugging during hackathon
                return StatusCode(500, new { 
                    error = "An error occurred while generating the recommendation",
                    message = ex.Message,
                    userId = userId 
                });
            }
        }

        /// <summary>
        /// Checks if the AI service is online and accessible
        /// </summary>
        [HttpGet("status")]
        public async Task<IActionResult> GetAIStatus()
        {
            try
            {
                _logger.LogInformation("Checking AI service status");
                var status = await _aiService.CheckAIServiceStatusAsync();
                return Ok(status);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking AI service status");
                return StatusCode(500, new { 
                    status = "error", 
                    message = "Error checking AI service status",
                    error = ex.Message
                });
            }
        }
    }
}
