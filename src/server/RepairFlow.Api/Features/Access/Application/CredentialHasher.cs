using System.Security.Cryptography;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;

namespace RepairFlow.Api.Features.Access.Application;

public interface ICredentialHasher
{
    string Hash(string credential);

    bool Verify(string credential, string? encodedHash);
}

public sealed class CredentialHasher : ICredentialHasher
{
    private const string Scheme = "rfv1$pbkdf2-sha256";

    private readonly AuthOptions _options;

    public CredentialHasher(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public string Hash(string credential)
    {
        ArgumentException.ThrowIfNullOrWhiteSpace(credential);

        var salt = RandomNumberGenerator.GetBytes(_options.PasswordHashSaltBytes);
        var derivedKey = Rfc2898DeriveBytes.Pbkdf2(
            credential,
            salt,
            _options.PasswordHashIterations,
            HashAlgorithmName.SHA256,
            _options.PasswordHashBytes);

        return string.Join(
            '$',
            Scheme,
            _options.PasswordHashIterations,
            Convert.ToBase64String(salt),
            Convert.ToBase64String(derivedKey));
    }

    public bool Verify(string credential, string? encodedHash)
    {
        if (string.IsNullOrEmpty(credential) || string.IsNullOrWhiteSpace(encodedHash))
        {
            return false;
        }

        try
        {
            var parts = encodedHash.Split('$');
            if (parts.Length != 5 ||
                $"{parts[0]}${parts[1]}" != Scheme ||
                !int.TryParse(parts[2], out var iterations) ||
                iterations < 10_000 ||
                iterations > 10_000_000)
            {
                return false;
            }

            var salt = Convert.FromBase64String(parts[3]);
            var expected = Convert.FromBase64String(parts[4]);
            if (salt.Length < 8 || expected.Length < 16 || expected.Length > 128)
            {
                return false;
            }

            var actual = Rfc2898DeriveBytes.Pbkdf2(
                credential,
                salt,
                iterations,
                HashAlgorithmName.SHA256,
                expected.Length);

            return CryptographicOperations.FixedTimeEquals(actual, expected);
        }
        catch (FormatException)
        {
            return false;
        }
        catch (ArgumentException)
        {
            return false;
        }
    }
}
