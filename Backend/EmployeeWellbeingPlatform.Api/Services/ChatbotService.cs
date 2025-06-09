using EmployeeWellbeingPlatform.Api.Controllers;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Configuration;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public class ChatbotService : IChatbotService
    {
        private readonly IWellbeingService _wellbeingService;
        private readonly AIService _aiService;
        private readonly ILogger<ChatbotService> _logger;
        private readonly IConfiguration _configuration;
        private readonly bool _useAI;

        // Dictionary for wellbeing responses
        private readonly Dictionary<string, List<string>> _responses;

        public ChatbotService(IWellbeingService wellbeingService, AIService aiService, ILogger<ChatbotService> logger, IConfiguration configuration)
        {
            _wellbeingService = wellbeingService;
            _aiService = aiService;
            _logger = logger;
            _configuration = configuration;
            
            // Check if AI should be used (default to true)
            _useAI = _configuration.GetValue<bool>("FeatureFlags:AIEnabled", true);

            // Initialize responses
            _responses = new Dictionary<string, List<string>>
            {
                { "greeting", new List<string> {
                    "Hello! I'm your wellbeing assistant. How are you feeling today?",
                    "Hi there! I'm here to support your wellbeing journey. How can I help?",
                    "Welcome! I'm your AI wellbeing companion. What's on your mind today?"
                }},
                { "feelingGood", new List<string> {
                    "That's wonderful to hear! What's contributing to your positive mood today?",
                    "Great! It's important to recognize what makes us feel good. Anything specific you'd like to share?",
                    "Excellent! Would you like some tips to maintain this positive energy?"
                }},
                { "feelingBad", new List<string> {
                    "I'm sorry to hear that. Would you like to talk about what's bothering you?",
                    "Thank you for sharing. Sometimes acknowledging our feelings is the first step. What do you think might help?",
                    "I understand. Would you like me to suggest some simple wellbeing exercises that might help?"
                }},
                { "stress", new List<string> {
                    "Stress can be challenging. Have you tried any relaxation techniques recently?",
                    "Managing stress is important. Deep breathing, short walks, or even stretching can help in the moment.",
                    "I understand. The 5-5-5 technique might help: breathe in for 5 seconds, hold for 5, exhale for 5. Would you like more techniques?"
                }},
                { "recommendations", new List<string> {
                    "I can suggest some wellbeing activities based on your mood. Would you like to hear them?",
                    "There are several evidence-based practices that might help. Would you like me to share some?",
                    "I have some recommendations that might be beneficial for your wellbeing. Would you like to explore them?"
                }},
                { "thankYou", new List<string> {
                    "You're welcome! I'm here anytime you need support.",
                    "Happy to help! Remember, taking care of your wellbeing is important.",
                    "Anytime! Don't hesitate to reach out whenever you need assistance."
                }},
                { "default", new List<string> {
                    "I'm still learning about wellbeing. Could you tell me more about what you're looking for?",
                    "That's an interesting point. Would you like me to find some wellbeing resources related to this topic?",
                    "I appreciate you sharing that. How else can I support your wellbeing today?"
                }}
            };
        }

        /// <summary>
        /// Get a response from the chatbot based on the user's message and conversation history
        /// </summary>
        public async Task<string> GetResponseAsync(string message, List<ChatMessage>? history = null)
        {
            try
            {
                _logger.LogInformation($"Processing message: {message}");
                
                // Check if AI service is available and enabled
                if (_useAI)
                {
                    try
                    {
                        // Build context from history if available
                        var contextBuilder = new StringBuilder();
                        if (history != null && history.Count > 0)
                        {
                            contextBuilder.AppendLine("Previous conversation:");
                            foreach (var item in history)
                            {
                                contextBuilder.AppendLine($"{item.Role}: {item.Content}");
                            }
                        }
                        
                        // Define system prompt for the wellbeing assistant
                        string systemPrompt = @"You are a helpful wellbeing assistant for employees. 
                        Your primary goal is to support the user's mental and emotional wellbeing. 
                        Keep responses concise, empathetic, and evidence-based. 
                        When appropriate, suggest specific wellbeing activities or practices. 
                        If the user mentions stress, anxiety, or negative emotions, provide supportive responses. 
                        Do not diagnose medical conditions or provide medical advice. 
                        If the user asks about tracking their mood, suggest using the application's mood tracker feature. 
                        Your responses should be conversational but professional.";
                        
                        // Build the user prompt with context
                        string userPrompt = $"{contextBuilder}\n\nUser message: {message}";
                        
                        // Get AI response using AIService via reflection since it doesn't have a public method
                        var getAIResponseMethod = typeof(AIService).GetMethod("GetAIResponseAsync", 
                            System.Reflection.BindingFlags.NonPublic | System.Reflection.BindingFlags.Instance);
                        
                        if (getAIResponseMethod != null)
                        {
                            // Invoke the private method
                            var task = (Task<string>)getAIResponseMethod.Invoke(_aiService, new object[] { userPrompt, systemPrompt });
                            string aiResponse = await task;
                            
                            if (!string.IsNullOrEmpty(aiResponse))
                            {
                                _logger.LogInformation("Successfully received AI response");
                                return aiResponse;
                            }
                        }
                        else
                        {
                            _logger.LogWarning("GetAIResponseAsync method not found in AIService");
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogError(ex, "Error getting AI response, falling back to rule-based responses");
                    }
                }
                
                // If we reach here, use rule-based responses as fallback
                _logger.LogInformation("Using rule-based responses as fallback");
                
                // Try to get personalized content if possible
                if (message.ToLower().Contains("recommend") || 
                    message.ToLower().Contains("suggest") || 
                    message.ToLower().Contains("advice"))
                {
                    try
                    {
                        var recommendations = await _wellbeingService.GetRecommendationsAsync();
                        if (recommendations != null && recommendations.Any())
                        {
                            // Pick a random recommendation
                            var recommendation = recommendations[new Random().Next(recommendations.Count)];
                            return $"Here's a wellbeing recommendation for you: \"{recommendation.Title}\" - {recommendation.Description}";
                        }
                    }
                    catch (Exception ex)
                    {
                        _logger.LogWarning(ex, "Error getting recommendations, falling back to static response");
                    }
                }
                
                // If it's about mood tracking, suggest using the mood tracker
                if (message.ToLower().Contains("mood") || 
                    message.ToLower().Contains("feeling") || 
                    message.ToLower().Contains("emotion"))
                {
                    return "Would you like to track your mood? You can use our mood tracker feature to record how you're feeling today.";
                }
                
                // Use keyword-based response as final fallback
                return GetKeywordResponse(message);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating chatbot response");
                return "I'm having some trouble processing your request. Please try again later.";
            }
        }
        
        /// <summary>
        /// Check if the chatbot service is available
        /// </summary>
        public bool IsAvailable()
        {
            // Always available since it's using local responses
            return true;
        }
        
        /// <summary>
        /// Get a response based on keywords in the message
        /// </summary>
        private string GetKeywordResponse(string message)
        {
            string lowerMessage = message.ToLower();
            
            // Simple keyword matching
            if (lowerMessage.Contains("hello") || lowerMessage.Contains("hi") || lowerMessage.Contains("hey"))
            {
                return GetRandomResponse("greeting");
            }
            else if (lowerMessage.Contains("good") || lowerMessage.Contains("great") || lowerMessage.Contains("happy") || lowerMessage.Contains("positive"))
            {
                return GetRandomResponse("feelingGood");
            }
            else if (lowerMessage.Contains("bad") || lowerMessage.Contains("sad") || lowerMessage.Contains("depressed") || lowerMessage.Contains("unhappy") || lowerMessage.Contains("negative"))
            {
                return GetRandomResponse("feelingBad");
            }
            else if (lowerMessage.Contains("stress") || lowerMessage.Contains("anxious") || lowerMessage.Contains("overwhelm") || lowerMessage.Contains("worry"))
            {
                return GetRandomResponse("stress");
            }
            else if (lowerMessage.Contains("recommend") || lowerMessage.Contains("suggest") || lowerMessage.Contains("advice"))
            {
                return GetRandomResponse("recommendations");
            }
            else if (lowerMessage.Contains("thank"))
            {
                return GetRandomResponse("thankYou");
            }
            else
            {
                return GetRandomResponse("default");
            }
        }
        
        /// <summary>
        /// Get a random response from the specified category
        /// </summary>
        private string GetRandomResponse(string category)
        {
            if (!_responses.ContainsKey(category))
            {
                category = "default";
            }
            
            var responses = _responses[category];
            return responses[new Random().Next(responses.Count)];
        }
    }
}
