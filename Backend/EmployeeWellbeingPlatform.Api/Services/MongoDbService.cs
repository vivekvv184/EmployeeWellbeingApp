using EmployeeWellbeingPlatform.Api.Models;
using Microsoft.Extensions.Options;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EmployeeWellbeingPlatform.Api.Services
{
    public class MongoDbSettings
    {
        public string ConnectionString { get; set; }
        public string DatabaseName { get; set; }
    }

    public class MongoDbService
    {
        private readonly IMongoCollection<MoodRecord> _moodRecords;
        private readonly IMongoCollection<Recommendation> _recommendations;
        private readonly IMongoDatabase _database;
        private readonly MongoClient _client;
        private readonly ILogger<MongoDbService> _logger;
        
        // Allow access to any collection with a generic method
        public IMongoCollection<T> GetCollection<T>(string collectionName)
        {
            return _database.GetCollection<T>(collectionName);
        }

        public MongoDbService(IOptions<MongoDbSettings> mongoDbSettings, ILogger<MongoDbService> logger = null)
        {
            _logger = logger ?? throw new ArgumentNullException(nameof(logger));
            
            try
            {
                // Get connection string from settings
                var connectionString = mongoDbSettings.Value.ConnectionString;
                
                _logger.LogInformation("Initializing MongoDB connection");
                _client = new MongoClient(connectionString);
                _database = _client.GetDatabase(mongoDbSettings.Value.DatabaseName);
                
                _moodRecords = _database.GetCollection<MoodRecord>("MoodRecords");
                _recommendations = _database.GetCollection<Recommendation>("Recommendations");
                
                // Test connection
                var isConnected = IsDatabaseConnected();
                _logger.LogInformation($"MongoDB connection status: {(isConnected ? "Connected" : "Disconnected")}");
                
                // Seed data if collections are empty
                SeedDataIfEmpty().Wait();
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error initializing MongoDB connection");
                // Continue without failing - this allows the app to run with static data
            }
        }
        
        /// <summary>
        /// Checks if MongoDB is connected and accessible
        /// </summary>
        public bool IsDatabaseConnected()
        {
            try
            {
                // Ping the database with a timeout to check connectivity
                var pingCommand = new MongoDB.Bson.BsonDocument("ping", 1);
                var result = _database.RunCommand<MongoDB.Bson.BsonDocument>(pingCommand, 
                    readPreference: MongoDB.Driver.ReadPreference.Primary, 
                    cancellationToken: new System.Threading.CancellationTokenSource(TimeSpan.FromSeconds(10)).Token);
                
                return result != null;
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "MongoDB connectivity check failed");
                return false;
            }
        }

        public async Task<List<MoodRecord>> GetMoodRecordsAsync(int userId)
        {
            return await _moodRecords.Find(m => m.UserId == userId).ToListAsync();
        }

        public async Task<MoodRecord> AddMoodRecordAsync(MoodRecord record)
        {
            // Get max ID or start at 1
            var maxIdRecord = await _moodRecords.Find(_ => true)
                .SortByDescending(r => r.Id)
                .FirstOrDefaultAsync();
                
            record.Id = (maxIdRecord?.Id ?? 0) + 1;
            
            await _moodRecords.InsertOneAsync(record);
            return record;
        }

        public async Task<List<Recommendation>> GetRecommendationsAsync()
        {
            return await _recommendations.Find(_ => true).ToListAsync();
        }

        private async Task SeedDataIfEmpty()
        {
            // Seed mood records if empty
            if ((await _moodRecords.CountDocumentsAsync(FilterDefinition<MoodRecord>.Empty)) == 0)
            {
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

                await _moodRecords.InsertManyAsync(mockMoodRecords);
            }

            // Check if recommendations exist and seed if empty
            if ((await _recommendations.CountDocumentsAsync(FilterDefinition<Recommendation>.Empty)) == 0)
            {
                // Get existing recommendations from WellbeingService to keep the same recommendations
                var wellbeingService = new WellbeingService();
                var recommendations = wellbeingService.GetPersonalizedRecommendations();
                
                await _recommendations.InsertManyAsync(recommendations);
            }
        }
    }
}
