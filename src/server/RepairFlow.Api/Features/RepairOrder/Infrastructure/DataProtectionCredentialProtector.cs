using Microsoft.AspNetCore.DataProtection;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class DataProtectionCredentialProtector : ICredentialProtector
{
    private const string KeyVersion = "v1";
    private static readonly TimeSpan CredentialLifetime = TimeSpan.FromHours(24);

    private readonly IDataProtector _protector;

    public DataProtectionCredentialProtector(IDataProtectionProvider provider)
    {
        _protector = provider.CreateProtector("RepairFlow.RepairOrder.ItemCredential.v1");
    }

    public ProtectedCredential Protect(string value, DateTimeOffset receivedAt, TimeSpan lifetime)
    {
        if (string.IsNullOrWhiteSpace(value))
        {
            throw new ArgumentException("Credential value is required.", nameof(value));
        }

        var expiresAt = receivedAt.Add(lifetime <= TimeSpan.Zero ? CredentialLifetime : lifetime);
        return new ProtectedCredential(
            _protector.Protect(value),
            KeyVersion,
            receivedAt,
            expiresAt);
    }

    public string Unprotect(string ciphertext, string keyVersion)
    {
        if (!string.Equals(keyVersion, KeyVersion, StringComparison.Ordinal))
        {
            throw new InvalidOperationException("The credential key version is not supported.");
        }

        return _protector.Unprotect(ciphertext);
    }
}
