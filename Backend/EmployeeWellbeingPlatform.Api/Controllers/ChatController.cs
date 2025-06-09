using EmployeeWellbeingPlatform.Api.Models;
using EmployeeWellbeingPlatform.Api.Services;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ChatController : ControllerBase
    {
        private readonly IChatbotService _chatbotService;
        private readonly ILogger<ChatController> _logger;

        public ChatController(IChatbotService chatbotService, ILogger<ChatController> logger)
        {
            _chatbotService = chatbotService;
            _logger = logger;
        }

        [HttpPost("message")]
        public async Task<IActionResult> GetResponse([FromBody] ChatRequest request)
        {
            try
            {
                _logger.LogInformation($"Received chat message: {request.Message}");
                var response = await _chatbotService.GetResponseAsync(request.Message, request.History);
                return Ok(new { message = response });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error processing chat message");
                return StatusCode(500, new { message = "I'm having trouble connecting right now. Please try again in a moment." });
            }
        }

        [HttpGet("status")]
        public IActionResult GetStatus()
        {
            try
            {
                bool isAvailable = _chatbotService.IsAvailable();
                return Ok(new { status = isAvailable ? "online" : "offline" });
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error checking chatbot status");
                return StatusCode(500, new { status = "error" });
            }
        }
    }

    public class ChatRequest
    {
        public string Message { get; set; } = string.Empty;
        public List<ChatMessage>? History { get; set; }
    }

    public class ChatMessage
    {
        public string Role { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
    }
}
