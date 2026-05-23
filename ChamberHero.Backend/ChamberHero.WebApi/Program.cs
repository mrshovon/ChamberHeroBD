using ChamberHero.Core.Interfaces;
using ChamberHero.Infrastructure.Data;
using ChamberHero.Infrastructure.Repositories;
using ChamberHero.Infrastructure.Services;
using ChamberHero.WebApi.Middleware;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

var configuration = builder.Configuration;
var jwtSettings = configuration.GetSection("JwtSettings");
var allowedOrigins = configuration.GetSection("Cors:AllowedOrigins").Get<string[]>() ?? new[] { "http://localhost:3000","http://192.168.2.101:3000" };
var connectionString = configuration.GetConnectionString("DefaultConnection") ?? throw new InvalidOperationException("DefaultConnection is required.");

// Database and repositories
builder.Services.AddDbContext<ChamberHeroDbContext>(options =>
    options.UseNpgsql(
        connectionString,
        npgsqlOptions =>
        {
            // This forces Npgsql to stop sending administrative schema checks 
            // that break Supabase proxy poolers during startup migrations
            npgsqlOptions.EnableRetryOnFailure(5, TimeSpan.FromSeconds(10), null);
        }
    )
);

builder.Services.AddScoped<IDoctorRepository, DoctorRepository>();
builder.Services.AddScoped<IChamberRepository, ChamberRepository>();
builder.Services.AddScoped<IPatientRepository, PatientRepository>();
builder.Services.AddScoped<IAuthService, AuthService>();

// Authentication
var secretKey = jwtSettings["SecretKey"] ?? throw new InvalidOperationException("JwtSettings:SecretKey is not configured.");
var issuer = jwtSettings["Issuer"];
var audience = jwtSettings["Audience"];

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey)),
            ValidateIssuer = !string.IsNullOrEmpty(issuer),
            ValidIssuer = issuer,
            ValidateAudience = !string.IsNullOrEmpty(audience),
            ValidAudience = audience,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero
        };
    });

builder.Services.AddAuthorization();

// CORS Policy Configuration
builder.Services.AddCors(options =>
{
    options.AddPolicy("ChamberHeroCorsPolicy", policy =>
    {
        policy.WithOrigins(allowedOrigins)
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // Crucial if you plan to use HTTP-Only cookies for JWT later
    });
});

// Update your controllers configuration to handle cycle references smoothly
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        // 🚀 CRITICAL FIX: Ignores object loops by ignoring circular reference chains!
        options.JsonSerializerOptions.ReferenceHandler = System.Text.Json.Serialization.ReferenceHandler.IgnoreCycles;
        
        // Keep your existing string enum converters below if they are there
        options.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo
    {
        Title = "ChamberHero BD API",
        Version = "v1"
    });

    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = ParameterLocation.Header,
        Description = "JWT Authorization header using the Bearer scheme."
    });

    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {
        {
            new OpenApiSecurityScheme
            {
                Reference = new OpenApiReference
                {
                    Type = ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});

var app = builder.Build();

// Apply migrations in development if available
if (app.Environment.IsDevelopment())
{
    using var scope = app.Services.CreateScope();
    var dbContext = scope.ServiceProvider.GetRequiredService<ChamberHeroDbContext>();
    dbContext.Database.Migrate();
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseMiddleware<ExceptionHandlingMiddleware>();

// Core Middleware Pipeline
app.UseRouting();

// CRITICAL: UseCors MUST come after UseRouting, but BEFORE UseAuthentication & UseAuthorization
app.UseCors("ChamberHeroCorsPolicy");

app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();

// Baseline Health check
app.MapGet("/health", () => Results.Ok(new { status = "healthy", timestamp = DateTime.UtcNow }));

app.Run();