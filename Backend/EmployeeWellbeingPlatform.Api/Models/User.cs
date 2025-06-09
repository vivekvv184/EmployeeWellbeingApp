using System;
using System.Collections.Generic;

namespace EmployeeWellbeingPlatform.Api.Models
{
    public class User
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Email { get; set; }
        public string Username { get; set; }
        public string PasswordHash { get; set; }
        public string Department { get; set; }
        public int? TeamId { get; set; }
        public bool IsAdmin { get; set; } = false;
        public string Role { get; set; } = "Employee"; // Employee, Manager, Admin
        public DateTime JoinDate { get; set; }
        public DateTime LastLoginAt { get; set; }
        public List<MoodRecord> MoodRecords { get; set; } = new List<MoodRecord>();
    }

    public class MoodRecord
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public int MoodScore { get; set; } // 1-5 scale
        public string Notes { get; set; }
        public DateTime RecordedAt { get; set; } = DateTime.UtcNow;
    }
}
