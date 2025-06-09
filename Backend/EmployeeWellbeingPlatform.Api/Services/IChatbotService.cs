using EmployeeWellbeingPlatform.Api.Controllers;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public interface IChatbotService
    {
        /// <summary>
        /// Get a response from the chatbot based on the user's message and conversation history
        /// </summary>
        Task<string> GetResponseAsync(string message, List<ChatMessage>? history = null);
        
        /// <summary>
        /// Check if the chatbot service is available
        /// </summary>
        bool IsAvailable();
    }
}
