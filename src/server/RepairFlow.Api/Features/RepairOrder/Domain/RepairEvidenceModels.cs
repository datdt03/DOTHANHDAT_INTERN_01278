namespace RepairFlow.Api.Features.RepairOrder.Domain;

public enum RepairEvidenceStage
{
    BeforeRepair
}

public static class RepairEvidenceStageCodec
{
    public static string ToWireValue(RepairEvidenceStage stage) => stage switch
    {
        RepairEvidenceStage.BeforeRepair => "before_repair",
        _ => throw new ArgumentOutOfRangeException(nameof(stage), stage, "Unknown evidence stage.")
    };
}

public sealed record RepairEvidence(
    Guid Id,
    Guid WorkspaceId,
    Guid RepairOrderId,
    Guid RepairItemId,
    RepairEvidenceStage Stage,
    string ObjectKey,
    string OriginalFilename,
    string MimeType,
    long SizeBytes,
    string Checksum,
    string IdempotencyKey,
    Guid CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset? DeletedAt = null,
    Guid? DeletedBy = null);

public sealed record RepairEvidenceCreateData(
    Guid Id,
    Guid WorkspaceId,
    Guid RepairOrderId,
    Guid RepairItemId,
    RepairEvidenceStage Stage,
    string ObjectKey,
    string OriginalFilename,
    string MimeType,
    long SizeBytes,
    string Checksum,
    string IdempotencyKey,
    Guid CreatedBy,
    DateTimeOffset CreatedAt);

public sealed record RepairEvidenceCreateResult(
    RepairEvidence Evidence,
    bool AlreadyExisted);

public sealed record RepairEvidenceDeleteResult(
    RepairEvidence Evidence,
    string ObjectKey);

public sealed record RepairEvidenceLockResult(
    Guid RepairOrderId,
    Guid RepairItemId,
    DateTimeOffset LockedAt,
    Guid LockedBy,
    bool AlreadyLocked);

public static class RepairEvidenceRules
{
    public const long MaxSizeBytes = 1024 * 1024;
    public const int MaxEvidenceCountPerItem = 5;
    public const int MaxIdempotencyKeyLength = 128;
    public const int MaxOriginalFilenameLength = 255;

    public static bool TryResolveImage(
        string? contentType,
        string? originalFilename,
        out string mimeType,
        out string extension)
    {
        mimeType = contentType?.Trim().ToLowerInvariant() ?? string.Empty;
        var filename = originalFilename ?? string.Empty;
        var separatorIndex = Math.Max(filename.LastIndexOf('/'), filename.LastIndexOf('\\'));
        var basename = separatorIndex >= 0 ? filename[(separatorIndex + 1)..] : filename;
        var dotIndex = basename.LastIndexOf('.');
        var fileExtension = dotIndex >= 0
            ? basename[dotIndex..].ToLowerInvariant()
            : string.Empty;

        extension = mimeType switch
        {
            "image/jpeg" when fileExtension is ".jpg" or ".jpeg" => ".jpg",
            "image/png" when fileExtension == ".png" => ".png",
            _ => string.Empty
        };

        return extension.Length > 0;
    }

    public static string SafeOriginalFilename(string? originalFilename)
    {
        var filename = originalFilename ?? string.Empty;
        var separatorIndex = Math.Max(filename.LastIndexOf('/'), filename.LastIndexOf('\\'));
        var basename = separatorIndex >= 0 ? filename[(separatorIndex + 1)..] : filename;
        var cleaned = new string(basename.Where(character => !char.IsControl(character)).ToArray()).Trim();
        if (cleaned.Length == 0)
        {
            return "image";
        }

        return cleaned.Length <= MaxOriginalFilenameLength
            ? cleaned
            : cleaned[..MaxOriginalFilenameLength];
    }

    public static bool HasValidSignature(ReadOnlySpan<byte> bytes, string mimeType) =>
        mimeType switch
        {
            "image/png" => bytes.Length >= 8 &&
                bytes[..8].SequenceEqual(new byte[] { 137, 80, 78, 71, 13, 10, 26, 10 }),
            "image/jpeg" => bytes.Length >= 3 &&
                bytes[0] == 0xFF && bytes[1] == 0xD8 && bytes[2] == 0xFF,
            _ => false
        };
}
