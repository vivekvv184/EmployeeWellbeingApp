using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using EmployeeWellbeingPlatform.Api.Models;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace EmployeeWellbeingPlatform.Api.Services
{
    /// <summary>
    /// Service for integrating with UKG's internal AI services
    /// </summary>
    public class AIService
    {
        private readonly HttpClient _httpClient;
        private readonly IConfiguration _configuration;
        private readonly ILogger<AIService> _logger;
        private readonly IWellbeingService _wellbeingService;
        private readonly WellbeingService _wellbeingServiceImpl; // Direct access to implementation
        private readonly bool _aiEnabled;
        private bool _lastKnownAIStatus = false;
        private DateTime _lastStatusCheck = DateTime.MinValue;
        
        // UKG AI service configuration
        private readonly string _apiKey = "sk-1234";
        private readonly string _apiUrl = "http://10.209.43.196:4000/chat/completions";
        private readonly string _defaultModel = "gpt-4o";
        
        // Available AI models
        private readonly string[] _availableModels = new[] {
            "gpt-4o",             // OpenAI's latest model
            "gpt-4o-mini",        // Smaller, faster version
            "claude-3-opus",      // Anthropic's most capable model
            "claude-3-5-sonnet",  // Good balance of capability and speed
            "gemini-2.0-pro",     // Google's advanced model
            "gemini-1.5-flash"    // Google's faster model
        };
        
        /// <summary>
        /// Constructor for AIService
        /// </summary>
        public AIService(IConfiguration configuration, ILogger<AIService> logger, IWellbeingService wellbeingService)
        {
            _configuration = configuration;
            _logger = logger;
            _wellbeingService = wellbeingService;
            _wellbeingServiceImpl = wellbeingService as WellbeingService; // Cast to implementation
            
            if (_wellbeingServiceImpl == null)
            {
                _logger.LogWarning("WellbeingService could not be cast to its implementation type. Some AI features may be limited.");
            }
            
            // Read settings from configuration if available
            _apiKey = _configuration["AI:ApiKey"] ?? _apiKey;
            _apiUrl = _configuration["AI:ApiUrl"] ?? _apiUrl;
            _defaultModel = _configuration["AI:DefaultModel"] ?? _defaultModel;
            
            // Check if AI is enabled
            _aiEnabled = _configuration.GetValue<bool>("FeatureFlags:AIEnabled", true);
            
            // Set up HTTP client
            _httpClient = new HttpClient();
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
            
            _logger.LogInformation($"AIService initialized. AI Enabled: {_aiEnabled}, Default Model: {_defaultModel}");
        }
        
        /// <summary>
        /// Analyzes a mood entry using AI
        /// </summary>
        public async Task<MoodAnalysis> AnalyzeMoodAsync(int moodId)
        {
            try
            {
                if (!_aiEnabled)
                {
                    _logger.LogInformation("AI features are disabled. Returning rule-based analysis.");
                    return GenerateRuleBasedAnalysis(moodId);
                }
                
                // Get the mood record (using implementation if available)
                List<MoodRecord> moodRecords;
                
                if (_wellbeingServiceImpl != null)
                {
                    // Call the implementation directly
                    moodRecords = await _wellbeingServiceImpl.GetMoodRecordsAsync(1); // Using userId 1 for demo
                }
                else
                {
                    // Fallback to static data if implementation not available
                    moodRecords = GetStaticMoodRecords(1);
                    _logger.LogWarning("Using static mood data because WellbeingService implementation is not available.");
                }
                
                var moodRecord = moodRecords.FirstOrDefault(m => m.Id == moodId);
                
                if (moodRecord == null)
                {
                    _logger.LogWarning($"Mood record with ID {moodId} not found");
                    return new MoodAnalysis
                    {
                        Sentiment = "neutral",
                        MainThemes = new[] { "general wellbeing" },
                        Insights = "No mood data available for analysis.",
                        SuggestedActivities = new[] { "Try recording your mood regularly." }
                    };
                }
                
                // Prepare prompt for AI
                string prompt = $"Analyze this mood entry - Rating: {moodRecord.MoodScore}/5, Notes: '{moodRecord.Notes ?? "No notes provided"}'";
                
                // Call UKG AI
                string aiResponse = await GetAIResponseAsync(prompt, "You are an empathetic AI assistant specializing in workplace wellbeing analysis. Analyze the user's mood entry and provide insights in JSON format with these fields: sentiment (positive, neutral, or negative), mainThemes (array of 1-3 themes), insights (brief analysis, max 2 sentences), and suggestedActivities (array of 1-3 specific activities).");
                
                // Parse JSON response
                try
                {
                    // Check if response is already in JSON format
                    MoodAnalysis analysis;
                    if (aiResponse.TrimStart().StartsWith("{"))
                    {
                        analysis = JsonSerializer.Deserialize<MoodAnalysis>(aiResponse) ?? FallbackAnalysis();
                    }
                    else
                    {
                        // Extract JSON from text response if needed (sometimes AI wraps JSON in text)
                        int jsonStart = aiResponse.IndexOf('{');
                        int jsonEnd = aiResponse.LastIndexOf('}');
                        
                        if (jsonStart >= 0 && jsonEnd > jsonStart)
                        {
                            string jsonPart = aiResponse.Substring(jsonStart, jsonEnd - jsonStart + 1);
                            analysis = JsonSerializer.Deserialize<MoodAnalysis>(jsonPart) ?? FallbackAnalysis();
                        }
                        else
                        {
                            // If we can't parse the JSON, create a simple analysis from the text
                            analysis = new MoodAnalysis
                            {
                                Sentiment = DetermineSentiment(moodRecord.MoodScore),
                                MainThemes = new[] { "general wellbeing" },
                                Insights = aiResponse.Length > 100 ? aiResponse.Substring(0, 100) + "..." : aiResponse,
                                SuggestedActivities = new[] { "Take a short break", "Practice mindfulness", "Stay hydrated" }
                            };
                        }
                    }
                    
                    // Sanitize the analysis to ensure no null values
                    return SanitizeAnalysis(analysis);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Error parsing AI response for mood analysis");
                    return FallbackAnalysis();
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error analyzing mood with ID {moodId}");
                return FallbackAnalysis();
            }
        }
        
        /// <summary>
        /// Generates a personalized recommendation using AI
        /// </summary>
        public async Task<string> GetPersonalizedRecommendationAsync(int userId)
        {
            try
            {
                if (!_aiEnabled)
                {
                    _logger.LogInformation("AI features are disabled. Returning standard recommendation.");
                    return "Take regular breaks during work. Consider a 5-minute walk every hour to boost energy and focus.";
                }
                
                // Get user's mood history
                List<MoodRecord> moodHistory;
                
                if (_wellbeingServiceImpl != null)
                {
                    // Call the implementation directly
                    moodHistory = await _wellbeingServiceImpl.GetMoodRecordsAsync(userId);
                }
                else
                {
                    // Fallback to static data if implementation not available
                    moodHistory = GetStaticMoodRecords(userId);
                    _logger.LogWarning("Using static mood data because WellbeingService implementation is not available.");
                }
                
                if (moodHistory == null || !moodHistory.Any())
                {
                    return "Start tracking your mood regularly to receive personalized recommendations.";
                }
                
                // Get recent mood records (last 3)
                var recentMoods = moodHistory
                    .OrderByDescending(m => m.RecordedAt)
                    .Take(3)
                    .ToList();
                
                // Create context from mood history
                string context = "Recent mood entries:\n";
                foreach (var mood in recentMoods)
                {
                    context += $"- Date: {mood.RecordedAt}, Score: {mood.MoodScore}/5, Notes: '{mood.Notes ?? "No notes provided"}'\n";
                }
                
                // Add average mood
                double avgMood = recentMoods.Average(m => m.MoodScore);
                context += $"\nAverage mood score: {avgMood:F1}/5";
                
                // Call UKG AI
                string recommendation = await GetAIResponseAsync(
                    context,
                    "You are an expert in workplace wellbeing and employee mental health. Based on the user's mood history, provide ONE specific, practical recommendation they could implement today or this week to improve their wellbeing. Keep it under 2 sentences."
                );
                
                return recommendation;
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, $"Error generating recommendation for user {userId}");
                
                // Provide varied fallback recommendations based on time of day
                int hour = DateTime.Now.Hour;
                int minute = DateTime.Now.Minute;
                int combined = hour * 100 + minute; // Creates a time-based seed
                
                // Use time to select a somewhat random recommendation
                string[] fallbackRecommendations = new[]
                {
                    "Consider taking short breaks throughout your workday to recharge. Even a five-minute break every hour can significantly improve your focus and wellbeing.",
                    "Try the 20-20-20 rule when working at your computer: every 20 minutes, look at something 20 feet away for 20 seconds to reduce eye strain and mental fatigue.",
                    "Schedule focused work blocks of 25-30 minutes with short breaks in between to maintain high productivity and mental clarity throughout your day.",
                    "Consider keeping a gratitude journal by writing down three things you're thankful for each day, which research shows can significantly improve wellbeing over time.",
                    "Start your workday with a quick 2-minute planning session to identify your top priorities, which can reduce stress and increase productivity.",
                    "Try a 5-minute desk stretching routine to release tension in your neck, shoulders, and back—areas that commonly hold stress during the workday.",
                    "For better work-life balance, establish clear boundaries like setting specific end times for your workday and taking a full lunch break away from your desk.",
                    "Practice a brief mindfulness exercise before important meetings or challenging tasks to improve focus and reduce stress response.",
                    "Stay hydrated throughout your workday by keeping a water bottle at your desk. Even mild dehydration can affect concentration and energy levels.",
                    "Incorporate a short walk into your day, even just 10 minutes, which can boost mood, creativity, and help manage stress."
                };
                
                int index = combined % fallbackRecommendations.Length;
                return fallbackRecommendations[index];
            }
        }
        
        /// <summary>
        /// Get response from UKG AI service
        /// </summary>
        private async Task<string> GetAIResponseAsync(string prompt, string systemPrompt)
        {
            try
            {
                // Prepare request
                var request = new
                {
                    model = _defaultModel,
                    messages = new[]
                    {
                        new { role = "system", content = systemPrompt },
                        new { role = "user", content = prompt }
                    },
                    temperature = 0.3,
                    max_tokens = 500
                };
                
                // Log request information
                _logger.LogInformation($"Sending request to UKG AI service using model {_defaultModel}");
                
                // Send request
                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await _httpClient.PostAsync(_apiUrl, content);
                
                // Check response
                if (response.IsSuccessStatusCode)
                {
                    var responseBody = await response.Content.ReadAsStringAsync();
                    using var document = JsonDocument.Parse(responseBody);
                    
                    // Extract content
                    var messagePath = document.RootElement.GetProperty("choices")[0].GetProperty("message").GetProperty("content");
                    return messagePath.GetString() ?? "No response content";
                }
                else
                {
                    var errorText = await response.Content.ReadAsStringAsync();
                    _logger.LogError($"AI API error: {response.StatusCode}, {errorText}");
                    throw new Exception($"AI API error: {response.StatusCode}");
                }
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error calling UKG AI service");
                throw;
            }
        }
        
        /// <summary>
        /// Generate a rule-based analysis when AI is not available
        /// </summary>
        private MoodAnalysis GenerateRuleBasedAnalysis(int moodId)
        {
            try
            {
                // Get the mood record
                List<MoodRecord> moodRecords;
                
                if (_wellbeingServiceImpl != null)
                {
                    // Try to get records from implementation (synchronously for fallback)
                    moodRecords = _wellbeingServiceImpl.GetMoodRecordsAsync(1).Result;
                }
                else
                {
                    // Use static test data if implementation isn't available
                    moodRecords = GetStaticMoodRecords(1);
                }
                
                var moodRecord = moodRecords.FirstOrDefault(m => m.Id == moodId);
                
                if (moodRecord == null)
                {
                    return FallbackAnalysis();
                }
                
                // Determine sentiment based on mood score
                string sentiment = DetermineSentiment(moodRecord.MoodScore);
                
                // Default values
                var themes = new List<string> { "general wellbeing" };
                var activities = new List<string>();
                string insights = "";
                
                // Provide specific insights based on mood score
                switch (moodRecord.MoodScore)
                {
                    case 1: // Very negative
                        insights = $"Your mood score of {moodRecord.MoodScore}/5 suggests you're having a difficult day. Consider reaching out to a colleague or taking a mental health break.";
                        activities.Add("Take a mental health break");
                        activities.Add("Practice self-compassion exercises");
                        activities.Add("Connect with a supportive colleague");
                        themes.Add("emotional wellbeing");
                        break;
                        
                    case 2: // Negative
                        insights = $"Your mood score of {moodRecord.MoodScore}/5 indicates some challenges today. Small breaks and mindfulness can help improve your outlook.";
                        activities.Add("Try a 5-minute mindfulness exercise");
                        activities.Add("Take a short walk outside");
                        activities.Add("Listen to calming music");
                        themes.Add("stress management");
                        break;
                        
                    case 3: // Neutral
                        insights = $"Your neutral mood score of {moodRecord.MoodScore}/5 suggests a balanced day. This is a good time to focus on maintenance activities for wellbeing.";
                        activities.Add("Do a quick desk stretch routine");
                        activities.Add("Drink a glass of water");
                        activities.Add("Prioritize your tasks for the day");
                        themes.Add("balance");
                        break;
                        
                    case 4: // Positive
                        insights = $"Your positive mood score of {moodRecord.MoodScore}/5 shows you're having a good day. This is an excellent time to tackle challenging tasks or help others.";
                        activities.Add("Take on a challenging task");
                        activities.Add("Share your positivity with colleagues");
                        activities.Add("Document what's working well");
                        themes.Add("productivity");
                        break;
                        
                    case 5: // Very positive
                        insights = $"Your excellent mood score of {moodRecord.MoodScore}/5 indicates you're at your best today. Harness this energy for creative work and challenging tasks.";
                        activities.Add("Work on creative projects");
                        activities.Add("Mentor or help a colleague");
                        activities.Add("Set ambitious goals while motivation is high");
                        themes.Add("peak performance");
                        break;
                        
                    default:
                        insights = "Your mood tracking helps build awareness of wellbeing patterns. Regular entries provide better insights over time.";
                        activities.Add("Take a short break");
                        activities.Add("Practice deep breathing");
                        activities.Add("Go for a walk");
                        break;
                }
                
                // Check for patterns in notes to add more personalization
                if (!string.IsNullOrEmpty(moodRecord.Notes))
                {
                    string notes = moodRecord.Notes.ToLower();
                    string timestamp = $" (noted at {moodRecord.RecordedAt.ToString("h:mm tt")})";
                    
                    // Work-related themes
                    if (ContainsAny(notes, "work", "project", "deadline", "meeting", "boss", "task", "client"))
                    {
                        themes.Add("work pressure");
                        insights += $" Your notes mention work-related topics{timestamp}."; 
                    }
                    
                    // Energy themes
                    if (ContainsAny(notes, "tired", "sleep", "exhausted", "fatigue", "energy", "rest", "nap"))
                    {
                        themes.Add("energy levels");
                        activities.Clear(); // Replace with more relevant activities
                        activities.Add("Take a power nap (15-20 min)");
                        activities.Add("Have a healthy snack for energy");
                        activities.Add("Try a desk stretching routine");
                        insights += $" Your notes suggest energy may be a factor today{timestamp}."; 
                    }
                    
                    // Stress themes
                    if (ContainsAny(notes, "stress", "anxiety", "worry", "overwhelm", "pressure", "tense", "nervous"))
                    {
                        themes.Add("stress management");
                        activities.Clear(); // Replace with more relevant activities
                        activities.Add("Practice deep breathing for 2 minutes");
                        activities.Add("Try progressive muscle relaxation");
                        activities.Add("Take a short mindful walk");
                        insights += $" Your notes indicate some stress or pressure{timestamp}."; 
                    }
                    
                    // Focus themes
                    if (ContainsAny(notes, "distract", "focus", "concentrate", "attention", "productive"))
                    {
                        themes.Add("focus and concentration");
                        activities.Clear(); // Replace with more relevant activities
                        activities.Add("Try the Pomodoro technique (25min work, 5min break)");
                        activities.Add("Clear your workspace of distractions");
                        activities.Add("Set a clear intention for your next work session");
                    }
                    
                    // Social themes
                    if (ContainsAny(notes, "colleague", "team", "social", "friend", "conflict", "communication"))
                    {
                        themes.Add("workplace relationships");
                        activities.Clear(); // Replace with more relevant activities
                        activities.Add("Schedule a coffee chat with a colleague");
                        activities.Add("Practice active listening in your next meeting");
                        activities.Add("Express appreciation to someone on your team");
                    }
                    
                    // Positive themes
                    if (ContainsAny(notes, "happy", "joy", "accomplish", "success", "proud", "excited", "grateful"))
                    {
                        themes.Add("positive emotions");
                        activities.Clear(); // Replace with more relevant activities
                        activities.Add("Share your success with someone");
                        activities.Add("Journal about what went well");
                        activities.Add("Build on this momentum with another goal");
                        insights += $" Your notes reflect positive emotions or accomplishments{timestamp}."; 
                    }
                }
                
                // If we ended up with no activities (unlikely), add defaults
                if (activities.Count == 0)
                {
                    activities.Add("Take a short break");
                    activities.Add("Practice deep breathing");
                    activities.Add("Stay hydrated");
                }
                
                // If insights is still empty, add a default
                if (string.IsNullOrEmpty(insights))
                {
                    insights = "Your mood tracking helps build awareness of wellbeing patterns. Regular entries provide better insights over time.";
                }
                
                return new MoodAnalysis
                {
                    Sentiment = sentiment,
                    MainThemes = themes.Distinct().Take(3).ToArray(),
                    Insights = insights,
                    SuggestedActivities = activities.Take(3).ToArray()
                };
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error generating rule-based analysis");
                return FallbackAnalysis();
            }
        }
        
        /// <summary>
        /// Determine sentiment from mood score
        /// </summary>
        private string DetermineSentiment(int moodScore)
        {
            if (moodScore <= 2) return "negative";
            if (moodScore >= 4) return "positive";
            return "neutral";
        }
        
        /// <summary>
        /// Check if text contains any of the keywords
        /// </summary>
        private bool ContainsAny(string text, params string[] keywords)
        {
            return keywords.Any(k => text.Contains(k));
        }
        
        /// <summary>
        /// Default fallback analysis
        /// </summary>
        private MoodAnalysis FallbackAnalysis()
        {
            return new MoodAnalysis
            {
                Sentiment = "neutral",
                MainThemes = new[] { "general wellbeing" },
                Insights = "We've received your mood entry. Regular tracking helps build awareness of your wellbeing patterns.",
                SuggestedActivities = new[] { 
                    "Take a short break", 
                    "Stay hydrated", 
                    "Practice deep breathing" 
                }
            };
        }
        
        /// <summary>
        /// Ensure all properties have valid values (no nulls)
        /// </summary>
        private MoodAnalysis SanitizeAnalysis(MoodAnalysis analysis)
        {
            if (analysis == null) return FallbackAnalysis();
            
            // Ensure sentiment is never null
            if (string.IsNullOrEmpty(analysis.Sentiment))
            {
                analysis.Sentiment = "neutral";
            }
            
            // Ensure main themes is never null
            if (analysis.MainThemes == null || analysis.MainThemes.Length == 0)
            {
                analysis.MainThemes = new[] { "general wellbeing" };
            }
            
            // Ensure insights is never null
            if (string.IsNullOrEmpty(analysis.Insights))
            {
                analysis.Insights = "Regular mood tracking helps build awareness of your wellbeing patterns.";
            }
            
            // Ensure suggested activities is never null
            if (analysis.SuggestedActivities == null || analysis.SuggestedActivities.Length == 0)
            {
                analysis.SuggestedActivities = new[] { "Take a short break", "Stay hydrated", "Practice deep breathing" };
            }
            
            return analysis;
        }
        
        /// <summary>
        /// Get static mood records when the WellbeingService implementation isn't available
        /// </summary>
        /// <summary>
        /// Check the status of the AI service
        /// </summary>
        public async Task<object> CheckAIServiceStatusAsync()
        {
            // If AI is disabled in configuration, return disabled status
            if (!_aiEnabled)
            {
                return new
                {
                    status = "disabled",
                    message = "AI features are disabled in configuration",
                    isAvailable = false,
                    timestamp = DateTime.Now
                };
            }
            
            // If we checked the status recently (within 30 seconds), return the cached result
            if ((DateTime.Now - _lastStatusCheck).TotalSeconds < 30)
            {
                return new
                {
                    status = _lastKnownAIStatus ? "online" : "offline",
                    message = _lastKnownAIStatus ? "AI service is online and responding" : "AI service is currently unavailable",
                    isAvailable = _lastKnownAIStatus,
                    timestamp = _lastStatusCheck,
                    cachedResult = true
                };
            }
            
            try
            {
                // Simple test request to check if the service is available
                var request = new
                {
                    model = _defaultModel,
                    messages = new[]
                    {
                        new { role = "system", content = "You are a helpful assistant." },
                        new { role = "user", content = "Hello" }
                    },
                    max_tokens = 5
                };
                
                // Set a short timeout for the request
                var httpClient = new HttpClient();
                httpClient.Timeout = TimeSpan.FromSeconds(5);
                httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", _apiKey);
                
                // Send request
                var content = new StringContent(JsonSerializer.Serialize(request), Encoding.UTF8, "application/json");
                var response = await httpClient.PostAsync(_apiUrl, content);
                
                // Update last check time and status
                _lastStatusCheck = DateTime.Now;
                _lastKnownAIStatus = response.IsSuccessStatusCode;
                
                // Return the status
                return new
                {
                    status = _lastKnownAIStatus ? "online" : "offline",
                    message = _lastKnownAIStatus ? "AI service is online and responding" : $"AI service returned error: {response.StatusCode}",
                    isAvailable = _lastKnownAIStatus,
                    responseCode = (int)response.StatusCode,
                    timestamp = _lastStatusCheck
                };
            }
            catch (Exception ex)
            {
                // Update last check time and status (offline)
                _lastStatusCheck = DateTime.Now;
                _lastKnownAIStatus = false;
                
                // Log the error
                _logger.LogError(ex, "Error checking AI service status");
                
                // Return offline status with error details
                return new
                {
                    status = "offline",
                    message = $"AI service is unreachable: {ex.Message}",
                    isAvailable = false,
                    error = ex.Message,
                    timestamp = _lastStatusCheck
                };
            }
        }
        
        private List<MoodRecord> GetStaticMoodRecords(int userId)
        {
            // Return static test data
            return new List<MoodRecord>
            {
                new MoodRecord { Id = 1, UserId = userId, MoodScore = 3, Notes = "Feeling okay today", RecordedAt = DateTime.Now.AddDays(-6) },
                new MoodRecord { Id = 2, UserId = userId, MoodScore = 4, Notes = "Good progress on project", RecordedAt = DateTime.Now.AddDays(-5) },
                new MoodRecord { Id = 3, UserId = userId, MoodScore = 2, Notes = "Stressed with deadlines", RecordedAt = DateTime.Now.AddDays(-4) },
                new MoodRecord { Id = 4, UserId = userId, MoodScore = 3, Notes = "Better than yesterday", RecordedAt = DateTime.Now.AddDays(-3) },
                new MoodRecord { Id = 5, UserId = userId, MoodScore = 5, Notes = "Great day, finished major task", RecordedAt = DateTime.Now.AddDays(-2) },
                new MoodRecord { Id = 6, UserId = userId, MoodScore = 4, Notes = "Still feeling good", RecordedAt = DateTime.Now.AddDays(-1) },
                new MoodRecord { Id = 7, UserId = userId, MoodScore = 4, Notes = "Looking forward to the weekend", RecordedAt = DateTime.Now }
            };
        }
    }
    
    /// <summary>
    /// Class to store mood analysis results
    /// </summary>
    public class MoodAnalysis
    {
        public string Sentiment { get; set; }
        public string[] MainThemes { get; set; }
        public string Insights { get; set; }
        public string[] SuggestedActivities { get; set; }
    }
}
