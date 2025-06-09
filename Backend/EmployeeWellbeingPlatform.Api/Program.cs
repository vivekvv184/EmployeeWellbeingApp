using Microsoft.AspNetCore.Builder;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Configuration;
using EmployeeWellbeingPlatform.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Add CORS policy for API access
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

// Configure CORS for local development
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", 
        builder => builder
            .AllowAnyOrigin()
            .AllowAnyMethod()
            .AllowAnyHeader());
});

// Configure MongoDB
builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));

// Password management for MongoDB connection
// IMPORTANT: In a production environment, credentials should be stored in secure configuration
// or environment variables, not in the source code.

// Register services
builder.Services.AddSingleton<MongoDbService>();
builder.Services.AddScoped<IWellbeingService, WellbeingService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<AIService>();
builder.Services.AddScoped<IChatbotService, ChatbotService>();

var app = builder.Build();

// Enable Swagger for API documentation
app.UseSwagger();
app.UseSwaggerUI();

// HTTPS redirection can be enabled in production
// app.UseHttpsRedirection();

// Enable CORS
app.UseCors("AllowAll");

// Serve static files from wwwroot (for index.html)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseAuthorization();
app.MapControllers();

app.Run();
