using EmployeeWellbeingPlatform.Api.Models;
using System;
using System.Collections.Generic;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public interface IWellbeingService
    {
        WellbeingMetrics GetWellbeingMetrics();
        void RecordMood(MoodRecord moodRecord);
        List<Recommendation> GetPersonalizedRecommendations();
        Task<List<MoodRecord>> GetAllMoodRecordsAsync();
        Task<List<Recommendation>> GetRecommendationsAsync();
    }

    public class WellbeingMetrics
    {
        public double AverageMood { get; set; }
        public int MoodEntriesCount { get; set; }
        public List<MoodTrend> MoodTrends { get; set; }
    }

    public class MoodTrend
    {
        public DateTime Date { get; set; }
        public double AverageMood { get; set; }
    }

    public class Recommendation
    {
        public int Id { get; set; }
        public string Title { get; set; }
        public string Description { get; set; }
        public string Category { get; set; } // e.g., "Exercise", "Mindfulness", "Work-Life Balance"
    }
}
