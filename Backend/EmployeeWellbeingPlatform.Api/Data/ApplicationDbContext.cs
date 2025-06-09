using Microsoft.EntityFrameworkCore;
using EmployeeWellbeingPlatform.Api.Models;

namespace EmployeeWellbeingPlatform.Api.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; }
        public DbSet<MoodRecord> MoodRecords { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure relationships
            modelBuilder.Entity<MoodRecord>()
                .HasOne<User>()
                .WithMany(u => u.MoodRecords)
                .HasForeignKey(m => m.UserId);
        }
    }
}
