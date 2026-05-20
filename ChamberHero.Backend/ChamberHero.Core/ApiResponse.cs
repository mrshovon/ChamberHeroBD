namespace ChamberHero.Core;

/// <summary>
/// Uniform API Response Wrapper - All API endpoints return this contract
/// Ensures consistency across success and error scenarios with type-safe data payloads.
/// </summary>
/// <typeparam name="T">Response data type</typeparam>
public class ApiResponse<T>
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public T? Data { get; set; }
    public int StatusCode { get; set; } = 200;
    public string? TraceId { get; set; }

    public static ApiResponse<T> SuccessResponse(T data, string message = "Operation successful", int statusCode = 200)
        => new()
        {
            Success = true,
            Message = message,
            Data = data,
            StatusCode = statusCode
        };

    public static ApiResponse<T> FailureResponse(string message, int statusCode = 400, T? data = default)
        => new()
        {
            Success = false,
            Message = message,
            Data = data,
            StatusCode = statusCode
        };

    public static ApiResponse<T> UnauthorizedResponse()
        => FailureResponse("Unauthorized access", 401);

    public static ApiResponse<T> ForbiddenResponse()
        => FailureResponse("Access forbidden", 403);

    public static ApiResponse<T> NotFoundResponse(string message = "Resource not found")
        => FailureResponse(message, 404);

    public static ApiResponse<T> InternalErrorResponse(string message = "An internal error occurred")
        => FailureResponse(message, 500);
}

/// <summary>
/// Non-generic ApiResponse for operations without data payload
/// </summary>
public class ApiResponse
{
    public bool Success { get; set; }
    public string Message { get; set; } = string.Empty;
    public int StatusCode { get; set; } = 200;
    public string? TraceId { get; set; }

    public static ApiResponse SuccessResponse(string message = "Operation successful", int statusCode = 200)
        => new()
        {
            Success = true,
            Message = message,
            StatusCode = statusCode
        };

    public static ApiResponse FailureResponse(string message, int statusCode = 400)
        => new()
        {
            Success = false,
            Message = message,
            StatusCode = statusCode
        };
}
