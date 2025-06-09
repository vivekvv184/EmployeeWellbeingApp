using EmployeeWellbeingPlatform.Api.Models;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class WellbeingController : ControllerBase
    {
        private readonly IWellbeingService _wellbeingService;

        public WellbeingController(IWellbeingService wellbeingService)
        {
            _wellbeingService = wellbeingService;
        }

        [HttpGet]
        public IActionResult GetWellbeingMetrics()
        {
            var metrics = _wellbeingService.GetWellbeingMetrics();
            return Ok(metrics);
        }
        
        [HttpGet("metrics")]
        public async Task<IActionResult> GetMetrics()
        {
            try
            {
                // Get all mood records for statistics
                var moodRecords = await _wellbeingService.GetAllMoodRecordsAsync();
                
                // Calculate metrics
                var totalEntries = moodRecords.Count;
                var averageMood = totalEntries > 0 ? Math.Round(moodRecords.Average(m => m.MoodScore), 1) : 0;
                
                // Set data source
                string dataSource = "MongoDB Atlas";
                
                // Return the metrics
                return Ok(new
                {
                    totalEntries,
                    averageMood,
                    dataSource,
                    lastUpdated = DateTime.UtcNow
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error getting metrics: {ex}");
                return StatusCode(500, "An error occurred while retrieving metrics");
            }
        }

        [HttpPost("mood")]
        public IActionResult RecordMood([FromBody] MoodRecord moodRecord)
        {
            _wellbeingService.RecordMood(moodRecord);
            return Ok();
        }

        [HttpGet("recommendations")]
        public IActionResult GetRecommendations()
        {
            var recommendations = _wellbeingService.GetPersonalizedRecommendations();
            return Ok(recommendations);
        }
        
        [HttpGet("mood/{userId}")]
        public async Task<IActionResult> GetMoodRecords(int userId)
        {
            try
            {
                // Check if we can cast to access async method
                if (_wellbeingService is WellbeingService wellbeingService)
                {
                    // Use the MongoDB service to get mood records
                    var moodRecords = await wellbeingService.GetMoodRecordsAsync(userId);
                    return Ok(moodRecords);
                }
                
                // Fallback to static data if needed
                return Ok(new List<MoodRecord>
                {
                    new MoodRecord { Id = 1, UserId = userId, MoodScore = 3, Notes = "Feeling okay", RecordedAt = DateTime.Now.AddDays(-6) },
                    new MoodRecord { Id = 2, UserId = userId, MoodScore = 4, Notes = "Good progress", RecordedAt = DateTime.Now.AddDays(-5) },
                    new MoodRecord { Id = 3, UserId = userId, MoodScore = 2, Notes = "Stressed", RecordedAt = DateTime.Now.AddDays(-4) },
                    new MoodRecord { Id = 4, UserId = userId, MoodScore = 3, Notes = "Better today", RecordedAt = DateTime.Now.AddDays(-3) },
                    new MoodRecord { Id = 5, UserId = userId, MoodScore = 5, Notes = "Great day", RecordedAt = DateTime.Now.AddDays(-2) },
                    new MoodRecord { Id = 6, UserId = userId, MoodScore = 4, Notes = "Still good", RecordedAt = DateTime.Now.AddDays(-1) }
                });
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error getting mood records: {ex}");
                return StatusCode(500, "An error occurred while retrieving mood records");
            }
        }
    }
}
