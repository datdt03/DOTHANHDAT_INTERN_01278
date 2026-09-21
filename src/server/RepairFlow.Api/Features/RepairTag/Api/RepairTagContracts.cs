namespace RepairFlow.Api.Features.RepairTag.Api;

public sealed record CreateRepairTagRequest(string Name);

public sealed record RenameRepairTagRequest(string Name);

public sealed record ReplaceRepairItemTagsRequest(IReadOnlyList<Guid>? TagIds);

public sealed record RepairTagResponse(
    Guid Id,
    string Name,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record RepairItemTagsResponse(
    Guid RepairOrderId,
    Guid RepairItemId,
    string OrderStatus,
    IReadOnlyList<RepairTagResponse> Tags);
