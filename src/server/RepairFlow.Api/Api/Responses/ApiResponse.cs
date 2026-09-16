namespace RepairFlow.Api.Api.Responses;

public sealed record ApiResponse<T>(T Data, ApiMeta Meta)
{
    public static ApiResponse<T> Create(T data, string requestId) =>
        new(data, new ApiMeta(requestId));
}

public sealed record ApiMeta(string RequestId);
