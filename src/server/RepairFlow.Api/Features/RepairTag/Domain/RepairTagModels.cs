using System.Globalization;
using System.Text;

namespace RepairFlow.Api.Features.RepairTag.Domain;

public sealed record RepairTag(
    Guid Id,
    Guid WorkspaceId,
    string Name,
    string NormalizedName,
    Guid CreatedBy,
    DateTimeOffset CreatedAt,
    DateTimeOffset UpdatedAt);

public sealed record RepairItemTagAssignment(
    Guid RepairOrderId,
    Guid RepairItemId,
    string OrderStatus,
    IReadOnlyList<RepairTag> Tags);

public enum RepairTagNameValidationError
{
    Required,
    TooLong,
    Invalid
}

public static class RepairTagNamePolicy
{
    public const int MaxLength = 64;

    public static bool TryNormalize(
        string? value,
        out string name,
        out string normalizedName,
        out RepairTagNameValidationError? error)
    {
        name = string.Empty;
        normalizedName = string.Empty;
        error = null;

        var trimmed = value?.Trim();
        if (string.IsNullOrWhiteSpace(trimmed))
        {
            error = RepairTagNameValidationError.Required;
            return false;
        }

        var canonical = trimmed.Normalize(NormalizationForm.FormC);
        var runeCount = 0;
        foreach (var rune in canonical.EnumerateRunes())
        {
            runeCount++;
            if (runeCount > MaxLength)
            {
                error = RepairTagNameValidationError.TooLong;
                return false;
            }

            if (!IsAllowed(rune))
            {
                error = RepairTagNameValidationError.Invalid;
                return false;
            }
        }

        if (runeCount == 0)
        {
            error = RepairTagNameValidationError.Required;
            return false;
        }

        name = canonical;
        normalizedName = canonical.ToUpperInvariant();
        return true;
    }

    public static string NormalizeSearch(string? value) =>
        string.IsNullOrWhiteSpace(value)
            ? string.Empty
            : value.Trim().Normalize(NormalizationForm.FormC).ToUpperInvariant();

    private static bool IsAllowed(Rune rune)
    {
        if (Rune.IsControl(rune) || rune.Value is '\u2028' or '\u2029')
        {
            return false;
        }

        return Rune.IsLetterOrDigit(rune) || Rune.IsWhiteSpace(rune) || rune.Value is '-' or '_';
    }
}
