using EmployeeWellbeingPlatform.Api.Models;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public class WellbeingService : IWellbeingService
    {
        private readonly MongoDbService _mongoDbService;
        private const int DefaultUserId = 1; // For demo purposes

        // Constructor with MongoDB service
        public WellbeingService(MongoDbService mongoDbService = null)
        {
            _mongoDbService = mongoDbService;
        }

        public async Task<WellbeingMetrics> GetWellbeingMetricsAsync()
        {
            if (_mongoDbService == null)
            {
                // Fallback to static data if MongoDB is not configured
                return GetStaticWellbeingMetrics();
            }

            // Get mood records from MongoDB
            var moodRecords = await _mongoDbService.GetMoodRecordsAsync(DefaultUserId);
            
            var metrics = new WellbeingMetrics
            {
                AverageMood = moodRecords.Average(m => m.MoodScore),
                MoodEntriesCount = moodRecords.Count,
                MoodTrends = GetMoodTrends(moodRecords)
            };
            
            return metrics;
        }
        
        // Backward compatibility method for non-async code
        public WellbeingMetrics GetWellbeingMetrics()
        {
            // If MongoDB is not available, use static data
            if (_mongoDbService == null)
            {
                return GetStaticWellbeingMetrics();
            }
            
            // Otherwise, get data from MongoDB but block on the async call
            // This is not ideal but maintains backward compatibility
            return GetWellbeingMetricsAsync().GetAwaiter().GetResult();
        }
        
        private WellbeingMetrics GetStaticWellbeingMetrics()
        {
            // Static mock data for fallback
            var mockMoodRecords = new List<MoodRecord>
            {
                new MoodRecord { Id = 1, UserId = 1, MoodScore = 3, Notes = "Feeling okay today", RecordedAt = DateTime.Now.AddDays(-6) },
                new MoodRecord { Id = 2, UserId = 1, MoodScore = 4, Notes = "Good progress on project", RecordedAt = DateTime.Now.AddDays(-5) },
                new MoodRecord { Id = 3, UserId = 1, MoodScore = 2, Notes = "Stressed with deadlines", RecordedAt = DateTime.Now.AddDays(-4) },
                new MoodRecord { Id = 4, UserId = 1, MoodScore = 3, Notes = "Better than yesterday", RecordedAt = DateTime.Now.AddDays(-3) },
                new MoodRecord { Id = 5, UserId = 1, MoodScore = 5, Notes = "Great day, finished major task", RecordedAt = DateTime.Now.AddDays(-2) },
                new MoodRecord { Id = 6, UserId = 1, MoodScore = 4, Notes = "Still feeling good", RecordedAt = DateTime.Now.AddDays(-1) },
                new MoodRecord { Id = 7, UserId = 1, MoodScore = 4, Notes = "Looking forward to the weekend", RecordedAt = DateTime.Now }
            };
            
            return new WellbeingMetrics
            {
                AverageMood = mockMoodRecords.Average(m => m.MoodScore),
                MoodEntriesCount = mockMoodRecords.Count,
                MoodTrends = GetMoodTrends(mockMoodRecords)
            };
        }

        public async Task<MoodRecord> RecordMoodAsync(MoodRecord moodRecord)
        {
            // Log it for demo purposes
            Console.WriteLine($"Mood recorded: Score={moodRecord.MoodScore}, Notes={moodRecord.Notes}");
            
            if (_mongoDbService == null)
            {
                // Fallback to static implementation if MongoDB is not configured
                return RecordMoodStatic(moodRecord);
            }
            
            // Save to MongoDB
            return await _mongoDbService.AddMoodRecordAsync(moodRecord);
        }
        
        // Backward compatibility method for non-async code
        public void RecordMood(MoodRecord moodRecord)
        {
            if (_mongoDbService == null)
            {
                RecordMoodStatic(moodRecord);
                return;
            }
            
            // Use MongoDB but block on the async call
            RecordMoodAsync(moodRecord).GetAwaiter().GetResult();
        }
        
        private MoodRecord RecordMoodStatic(MoodRecord moodRecord)
        {
            // Just log it for demo purposes
            Console.WriteLine($"Mood recorded (static): Score={moodRecord.MoodScore}, Notes={moodRecord.Notes}");
            
            // For demo, just return the record with a fake ID
            moodRecord.Id = new Random().Next(100, 999);
            moodRecord.RecordedAt = DateTime.Now;
            
            // Cannot add to _mockMoodRecords as it no longer exists
            // Just return the record with the ID set
            return moodRecord;
        }

        public async Task<List<Recommendation>> GetPersonalizedRecommendationsAsync(int userId = 1)
        {
            if (_mongoDbService == null)
            {
                return GetStaticRecommendations();
            }
            
            try
            {
                // Get user's mood history
                var moodHistory = await _mongoDbService.GetMoodRecordsAsync(userId);
                
                // Get all available recommendations
                var allRecommendations = await _mongoDbService.GetRecommendationsAsync();
                
                // If we don't have any mood data, return generic recommendations
                if (moodHistory == null || moodHistory.Count == 0)
                {
                    return allRecommendations.Take(5).ToList();
                }
                
                // Analyze mood patterns to provide targeted recommendations
                var personalizedRecs = new List<Recommendation>();
                
                // Calculate metrics from mood history
                double averageMood = moodHistory.Average(m => m.MoodScore);
                var moodTrend = moodHistory.Count > 1 ?
                    moodHistory.OrderBy(m => m.RecordedAt).Last().MoodScore - 
                    moodHistory.OrderBy(m => m.RecordedAt).First().MoodScore : 0;
                
                // Pull out keywords from mood notes
                var allNotes = string.Join(" ", moodHistory.Select(m => m.Notes?.ToLowerInvariant() ?? ""));
                
                // Create a recommendation strategy based on mood patterns
                var recStrategy = new Dictionary<string, int>()
                {
                    { "Mindfulness", 0 },
                    { "Exercise", 0 },
                    { "Social", 0 },
                    { "Work-Life Balance", 0 }
                };
                
                // Adjust weights based on average mood
                if (averageMood < 2.5) // Low mood
                {
                    recStrategy["Mindfulness"] += 3;
                    recStrategy["Social"] += 2;
                }
                else if (averageMood < 3.5) // Medium mood
                {
                    recStrategy["Exercise"] += 2;
                    recStrategy["Work-Life Balance"] += 2;
                }
                else // Good mood
                {
                    recStrategy["Social"] += 2;
                    recStrategy["Work-Life Balance"] += 1;
                }
                
                // Adjust weights based on trend
                if (moodTrend < -0.5) // Declining mood
                {
                    recStrategy["Mindfulness"] += 2;
                    recStrategy["Exercise"] += 1;
                }
                else if (moodTrend > 0.5) // Improving mood
                {
                    recStrategy["Social"] += 1;
                    recStrategy["Exercise"] += 1;
                }
                
                // Adjust weights based on keywords in notes
                if (allNotes.Contains("stress") || allNotes.Contains("anxious") || 
                    allNotes.Contains("overwhelm") || allNotes.Contains("worried"))
                {
                    recStrategy["Mindfulness"] += 3;
                    recStrategy["Work-Life Balance"] += 2;
                }
                
                if (allNotes.Contains("tired") || allNotes.Contains("exhausted") || 
                    allNotes.Contains("energy") || allNotes.Contains("sleep"))
                {
                    recStrategy["Exercise"] += 2;
                    recStrategy["Mindfulness"] += 1;
                }
                
                if (allNotes.Contains("team") || allNotes.Contains("colleague") || 
                    allNotes.Contains("meeting") || allNotes.Contains("collaboration"))
                {
                    recStrategy["Social"] += 3;
                }
                
                if (allNotes.Contains("deadline") || allNotes.Contains("workload") || 
                    allNotes.Contains("balance") || allNotes.Contains("overwork"))
                {
                    recStrategy["Work-Life Balance"] += 3;
                }
                
                // Select recommendations based on calculated weights
                var sortedCategories = recStrategy.OrderByDescending(kvp => kvp.Value);
                
                // Display a personalized message about why these recommendations were chosen
                var personalizedMessage = new Recommendation
                {
                    Id = 0, // Special ID for message
                    Title = "Your Personalized Wellbeing Plan",
                    Description = GeneratePersonalizedMessage(averageMood, moodTrend, sortedCategories.First().Key),
                    Category = "Overview"
                };
                personalizedRecs.Add(personalizedMessage);
                
                // For each category with weight > 0, add recommendations in priority order
                foreach (var category in sortedCategories.Where(c => c.Value > 0))
                {
                    var categoryRecs = allRecommendations
                        .Where(r => r.Category == category.Key)
                        .OrderBy(_ => Guid.NewGuid()) // Shuffle for variety
                        .Take(2); // Take 2 from each category
                    
                    personalizedRecs.AddRange(categoryRecs);
                }
                
                // Ensure we have at least 5 recommendations
                if (personalizedRecs.Count < 6) // 1 message + 5 recommendations
                {
                    var remainingRecsNeeded = 6 - personalizedRecs.Count;
                    var remainingCategories = allRecommendations
                        .Select(r => r.Category)
                        .Distinct()
                        .Except(personalizedRecs.Select(r => r.Category))
                        .ToList();
                        
                    if (remainingCategories.Any())
                    {
                        foreach (var category in remainingCategories)
                        {
                            var extraRecs = allRecommendations
                                .Where(r => r.Category == category && !personalizedRecs.Any(p => p.Id == r.Id))
                                .OrderBy(_ => Guid.NewGuid())
                                .Take(remainingRecsNeeded);
                            
                            personalizedRecs.AddRange(extraRecs);
                            remainingRecsNeeded -= extraRecs.Count();
                            
                            if (remainingRecsNeeded <= 0)
                                break;
                        }
                    }
                    
                    // If we still need more, add random ones
                    if (remainingRecsNeeded > 0)
                    {
                        var extraRandomRecs = allRecommendations
                            .Where(r => !personalizedRecs.Any(p => p.Id == r.Id))
                            .OrderBy(_ => Guid.NewGuid())
                            .Take(remainingRecsNeeded);
                        
                        personalizedRecs.AddRange(extraRandomRecs);
                    }
                }
                
                return personalizedRecs.Take(8).ToList(); // Limit to 8 total recommendations
            }
            catch (Exception ex)
            {
                Console.WriteLine($"Error generating personalized recommendations: {ex}");
                return await _mongoDbService.GetRecommendationsAsync();
            }
        }
        
        private string GeneratePersonalizedMessage(double averageMood, double moodTrend, string focusCategory)
        {
            string message;
            
            if (averageMood < 2.5) // Low mood
            {
                if (moodTrend < -0.5) // Declining
                    message = "Your wellbeing seems to have been challenged recently. We've focused on recommendations that can help you regain balance and improve your mental state.";
                else if (moodTrend > 0.5) // Improving
                    message = "While your mood has been improving, we're providing supportive strategies to continue this positive trajectory and boost your wellbeing further.";
                else // Stable
                    message = "Your mood has been consistently lower than ideal. These recommendations are designed to help elevate your wellbeing and introduce positive changes.";
            }
            else if (averageMood < 3.5) // Medium mood
            {
                if (moodTrend < -0.5) // Declining
                    message = "We've noticed your mood trending downward. These recommendations focus on stopping this decline and rebuilding your positive momentum.";
                else if (moodTrend > 0.5) // Improving
                    message = "You're on a positive path! These recommendations will help maintain your improving mood and continue building your wellbeing.";
                else // Stable
                    message = "Your wellbeing appears stable in the moderate range. These recommendations aim to help you take the next step toward thriving rather than just coping.";
            }
            else // Good mood
            {
                if (moodTrend < -0.5) // Declining
                    message = "While your overall mood has been good, we've noticed a recent downward trend. These recommendations will help you address this early and maintain your wellbeing.";
                else if (moodTrend > 0.5) // Improving
                    message = "Excellent progress! Your wellbeing is trending very positively. We've selected recommendations to help you maintain and build on these great results.";
                else // Stable
                    message = "Your wellbeing is consistently good. These recommendations focus on maintaining this positive state and introducing new practices to your routine.";
            }
            
            // Add focus category information
            switch (focusCategory)
            {
                case "Mindfulness":
                    message += " We're especially focusing on mindfulness practices to help you manage stress and improve mental clarity.";
                    break;
                case "Exercise":
                    message += " We're highlighting physical activity recommendations to boost your energy and mood through movement.";
                    break;
                case "Social":
                    message += " We're emphasizing social connection strategies to strengthen your support network and sense of belonging.";
                    break;
                case "Work-Life Balance":
                    message += " We're prioritizing work-life balance techniques to help you create healthier boundaries and reduce burnout risk.";
                    break;
            }
            
            return message;
        }
        
        // Implementation of interface method - no parameters as per interface definition
        public List<Recommendation> GetPersonalizedRecommendations()
        {
            // If MongoDB is not available, use static data
            if (_mongoDbService == null)
            {
                return GetStaticRecommendations();
            }
            
            // Use default user ID = 1 for the interface implementation
            return GetPersonalizedRecommendationsAsync(DefaultUserId).GetAwaiter().GetResult();
        }
        
        // Extended version with userId parameter for additional flexibility
        public List<Recommendation> GetPersonalizedRecommendationsForUser(int userId)
        {
            // If MongoDB is not available, use static data
            if (_mongoDbService == null)
            {
                return GetStaticRecommendations();
            }
            
            // Otherwise, get data from MongoDB but block on the async call
            return GetPersonalizedRecommendationsAsync(userId).GetAwaiter().GetResult();
        }
        
        private List<Recommendation> GetStaticRecommendations()
        {
            // Static recommendations for demo
            return new List<Recommendation>
            {
                new Recommendation
                {
                    Id = 1,
                    Title = "Take a short walk",
                    Description = "Taking a 10-minute walk can boost your mood and energy levels.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 2,
                    Title = "Practice mindfulness",
                    Description = "Spend 5 minutes practicing mindful breathing to reduce stress.",
                    Category = "Mindfulness"
                },
                new Recommendation
                {
                    Id = 3,
                    Title = "Connect with a colleague",
                    Description = "Reach out to a team member for a quick virtual coffee chat.",
                    Category = "Social"
                },
                new Recommendation
                {
                    Id = 4,
                    Title = "Desk stretches",
                    Description = "Try these 3 simple stretches to relieve tension while sitting at your desk.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 5,
                    Title = "Set work boundaries",
                    Description = "Try setting specific work hours and take regular breaks to maintain work-life balance.",
                    Category = "Work-Life Balance"
                },
                // Additional recommendations
                new Recommendation
                {
                    Id = 6,
                    Title = "Digital detox",
                    Description = "Take a 30-minute break from all digital devices to reduce eye strain and mental fatigue.",
                    Category = "Work-Life Balance"
                },
                new Recommendation
                {
                    Id = 7,
                    Title = "Gratitude journaling",
                    Description = "Write down three things you're grateful for today to improve your perspective.",
                    Category = "Mindfulness"
                },
                new Recommendation
                {
                    Id = 8,
                    Title = "Lunch with colleagues",
                    Description = "Plan a lunch with teammates to strengthen your workplace connections.",
                    Category = "Social"
                },
                new Recommendation
                {
                    Id = 9,
                    Title = "Posture check",
                    Description = "Take a moment to check and correct your sitting posture to prevent back pain.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 10,
                    Title = "Organize your workspace",
                    Description = "A tidy workspace can reduce stress and improve focus. Take 10 minutes to organize.",
                    Category = "Work-Life Balance"
                },
                new Recommendation
                {
                    Id = 11,
                    Title = "Take the stairs",
                    Description = "Skip the elevator and take the stairs for a quick cardio boost during your workday.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 12,
                    Title = "5-4-3-2-1 grounding",
                    Description = "Notice 5 things you see, 4 you feel, 3 you hear, 2 you smell, and 1 you taste to reduce anxiety.",
                    Category = "Mindfulness"
                },
                new Recommendation
                {
                    Id = 13,
                    Title = "Virtual coffee break",
                    Description = "Schedule a short virtual coffee break with a colleague you haven't spoken to in a while.",
                    Category = "Social"
                },
                new Recommendation
                {
                    Id = 14,
                    Title = "Wrist and hand stretches",
                    Description = "Relieve tension from typing with simple wrist rotations and finger stretches.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 15,
                    Title = "Email boundaries",
                    Description = "Set specific times to check emails rather than responding to each notification.",
                    Category = "Work-Life Balance"
                },
                new Recommendation
                {
                    Id = 16,
                    Title = "Standing desk",
                    Description = "If possible, switch to a standing desk for part of your day to improve circulation.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 17,
                    Title = "Box breathing",
                    Description = "Practice box breathing: inhale for 4 seconds, hold for 4, exhale for 4, hold for 4, repeat.",
                    Category = "Mindfulness"
                },
                new Recommendation
                {
                    Id = 18,
                    Title = "Join a workplace group",
                    Description = "Consider joining a workplace interest group to connect with colleagues with similar interests.",
                    Category = "Social"
                },
                new Recommendation
                {
                    Id = 19,
                    Title = "Neck rolls",
                    Description = "Gently roll your neck in circles to release tension from long periods of computer work.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 20,
                    Title = "Meeting-free block",
                    Description = "Block out time in your calendar for focused work without meetings or interruptions.",
                    Category = "Work-Life Balance"
                },
                new Recommendation
                {
                    Id = 21,
                    Title = "Lunchtime walk",
                    Description = "Use part of your lunch break for a quick walk to get fresh air and movement.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 22,
                    Title = "Progressive muscle relaxation",
                    Description = "Tense and then release each muscle group in your body to release physical tension.",
                    Category = "Mindfulness"
                },
                new Recommendation
                {
                    Id = 23,
                    Title = "Mentorship opportunity",
                    Description = "Consider becoming a mentor or finding a mentor to enhance your professional connections.",
                    Category = "Social"
                },
                new Recommendation
                {
                    Id = 24,
                    Title = "Eye exercises",
                    Description = "Follow the 20-20-20 rule: every 20 minutes, look at something 20 feet away for 20 seconds.",
                    Category = "Exercise"
                },
                new Recommendation
                {
                    Id = 25,
                    Title = "Schedule personal time",
                    Description = "Block time in your calendar for personal activities that recharge you.",
                    Category = "Work-Life Balance"
                }
            };
        }

        private List<MoodTrend> GetMoodTrends(List<MoodRecord> moodRecords)
        {
            // Group mood records by date and calculate daily averages
            return moodRecords
                .GroupBy(m => m.RecordedAt.Date)
                .Select(g => new MoodTrend
                {
                    Date = g.Key,
                    AverageMood = g.Average(m => m.MoodScore)
                })
                .OrderBy(t => t.Date)
                .ToList();
        }
        
        // Get mood records for a specific user
        public async Task<List<MoodRecord>> GetMoodRecordsAsync(int userId)
        {
            // Check if MongoDB service is available
            if (_mongoDbService == null)
            {
                // Return static data if MongoDB is not configured
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
            
            try
            {
                // Get mood records from MongoDB
                return await _mongoDbService.GetMoodRecordsAsync(userId);
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error getting mood records from MongoDB: {ex}");
                
                // Fallback to static data on error
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
        /// Get all mood records from all users (for admin dashboard)
        /// </summary>
        public async Task<List<MoodRecord>> GetAllMoodRecordsAsync()
        {
            // Check if MongoDB service is available
            if (_mongoDbService == null)
            {
                // Return static data if MongoDB is not configured
                return new List<MoodRecord>
                {
                    new MoodRecord { Id = 1, UserId = 1, MoodScore = 3, Notes = "Feeling okay today", RecordedAt = DateTime.Now.AddDays(-6) },
                    new MoodRecord { Id = 2, UserId = 1, MoodScore = 4, Notes = "Good progress on project", RecordedAt = DateTime.Now.AddDays(-5) },
                    new MoodRecord { Id = 3, UserId = 1, MoodScore = 2, Notes = "Stressed with deadlines", RecordedAt = DateTime.Now.AddDays(-4) },
                    new MoodRecord { Id = 4, UserId = 1, MoodScore = 3, Notes = "Better than yesterday", RecordedAt = DateTime.Now.AddDays(-3) },
                    new MoodRecord { Id = 5, UserId = 1, MoodScore = 5, Notes = "Great day, finished major task", RecordedAt = DateTime.Now.AddDays(-2) },
                    new MoodRecord { Id = 6, UserId = 1, MoodScore = 4, Notes = "Still feeling good", RecordedAt = DateTime.Now.AddDays(-1) },
                    new MoodRecord { Id = 7, UserId = 1, MoodScore = 4, Notes = "Looking forward to the weekend", RecordedAt = DateTime.Now },
                    new MoodRecord { Id = 8, UserId = 2, MoodScore = 3, Notes = "Average day", RecordedAt = DateTime.Now.AddDays(-5) },
                    new MoodRecord { Id = 9, UserId = 2, MoodScore = 2, Notes = "Difficult meeting", RecordedAt = DateTime.Now.AddDays(-3) },
                    new MoodRecord { Id = 10, UserId = 3, MoodScore = 5, Notes = "Great progress on project", RecordedAt = DateTime.Now.AddDays(-2) }
                };
            }
            
            try
            {
                // For MongoDB, we need to get all records from the collection
                // This would typically be restricted based on permissions in a real app
                var collection = _mongoDbService.GetCollection<MoodRecord>("MoodRecords");
                return await collection.Find(_ => true).ToListAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error getting all mood records from MongoDB: {ex}");
                
                // Fallback to static data on error
                return new List<MoodRecord>
                {
                    new MoodRecord { Id = 1, UserId = 1, MoodScore = 3, Notes = "Feeling okay today", RecordedAt = DateTime.Now.AddDays(-6) },
                    new MoodRecord { Id = 2, UserId = 1, MoodScore = 4, Notes = "Good progress on project", RecordedAt = DateTime.Now.AddDays(-5) },
                    new MoodRecord { Id = 3, UserId = 1, MoodScore = 2, Notes = "Stressed with deadlines", RecordedAt = DateTime.Now.AddDays(-4) },
                    new MoodRecord { Id = 4, UserId = 1, MoodScore = 3, Notes = "Better than yesterday", RecordedAt = DateTime.Now.AddDays(-3) },
                    new MoodRecord { Id = 5, UserId = 1, MoodScore = 5, Notes = "Great day, finished major task", RecordedAt = DateTime.Now.AddDays(-2) },
                    new MoodRecord { Id = 6, UserId = 1, MoodScore = 4, Notes = "Still feeling good", RecordedAt = DateTime.Now.AddDays(-1) },
                    new MoodRecord { Id = 7, UserId = 1, MoodScore = 4, Notes = "Looking forward to the weekend", RecordedAt = DateTime.Now }
                };
            }
        }
        
        /// <summary>
        /// Get recommendations asynchronously
        /// </summary>
        public async Task<List<Recommendation>> GetRecommendationsAsync()
        {
            if (_mongoDbService == null)
            {
                // Return static recommendations if MongoDB is not configured
                return GetStaticRecommendations();
            }
            
            try
            {
                // Get recommendations from MongoDB
                return await _mongoDbService.GetRecommendationsAsync();
            }
            catch (Exception ex)
            {
                Console.Error.WriteLine($"Error getting recommendations from MongoDB: {ex}");
                
                // Fallback to static recommendations on error
                return GetStaticRecommendations();
            }
        }
    }
}
