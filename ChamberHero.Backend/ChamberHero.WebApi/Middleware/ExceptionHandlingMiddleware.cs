using System.Text.Json;

namespace ChamberHero.WebApi.Middleware;

/// <summary>
/// Global Exception Handling Middleware - Captures unhandled exceptions and returns uniform JSON ApiResponse objects.
/// Generates trace IDs for debugging and monitoring.
/// </summary>
public class ExceptionHandlingMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ILogger<ExceptionHandlingMiddleware> _logger;

    public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await _next(context);
        }
        catch (Exception exception)
        {
            var traceId = context.TraceIdentifier;
            _logger.LogError(exception, "Unhandled exception occurred. TraceId: {TraceId}", traceId);

            await HandleExceptionAsync(context, exception, traceId);
        }
    }

    private static Task HandleExceptionAsync(HttpContext context, Exception exception, string traceId)
    {
        context.Response.ContentType = "application/json";

        var response = new ApiErrorResponse
        {
            Success = false,
            Message = GetErrorMessage(exception),
            TraceId = traceId,
            StatusCode = GetHttpStatusCode(exception),
            Details = GetExceptionDetails(exception)
        };

        context.Response.StatusCode = response.StatusCode;

        return context.Response.WriteAsJsonAsync(response);
    }

    private static int GetHttpStatusCode(Exception exception) => exception switch
    {
        UnauthorizedAccessException => StatusCodes.Status401Unauthorized,
        ArgumentException => StatusCodes.Status400BadRequest,
        InvalidOperationException => StatusCodes.Status409Conflict,
        KeyNotFoundException => StatusCodes.Status404NotFound,
        _ => StatusCodes.Status500InternalServerError
    };

    private static string GetErrorMessage(Exception exception) => exception switch
    {
        UnauthorizedAccessException => "Unauthorized access.",
        ArgumentException => "Invalid argument provided.",
        InvalidOperationException => "An invalid operation was attempted.",
        KeyNotFoundException => "Resource not found.",
        _ => "An internal server error occurred. Please contact support."
    };

    private static object? GetExceptionDetails(Exception exception)
    {
        #if DEBUG
        return new
        {
            exception.Message,
            exception.StackTrace,
            InnerException = exception.InnerException?.Message
        };
        #else
        return null;
        #endif
    }
}

/// <summary>
/// Uniform API Error Response Contract
/// </summary>
public class ApiErrorResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; }
    public string TraceId { get; set; } = string.Empty;
    public object? Details { get; set; }
}
