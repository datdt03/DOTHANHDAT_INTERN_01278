using System.Collections.Concurrent;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Configuration;

namespace RepairFlow.Api.Features.Access.Application;

public interface IAccessRateLimiter
{
    bool IsAllowed(string key, DateTimeOffset now);

    void RecordFailure(string key, DateTimeOffset now);

    void RecordSuccess(string key);
}

public sealed class InMemoryAccessRateLimiter : IAccessRateLimiter
{
    private readonly ConcurrentDictionary<string, FailureWindow> _failures = new(StringComparer.Ordinal);
    private readonly AuthOptions _options;

    public InMemoryAccessRateLimiter(IOptions<AuthOptions> options)
    {
        _options = options.Value;
    }

    public bool IsAllowed(string key, DateTimeOffset now)
    {
        if (!_failures.TryGetValue(key, out var window))
        {
            return true;
        }

        if (now - window.StartedAt >= TimeSpan.FromMinutes(_options.FailureWindowMinutes))
        {
            _failures.TryRemove(key, out _);
            return true;
        }

        return window.Failures < _options.MaxFailedAttempts;
    }

    public void RecordFailure(string key, DateTimeOffset now)
    {
        _failures.AddOrUpdate(
            key,
            _ => new FailureWindow(1, now),
            (_, existing) => now - existing.StartedAt >= TimeSpan.FromMinutes(_options.FailureWindowMinutes)
                ? new FailureWindow(1, now)
                : existing with { Failures = existing.Failures + 1 });
    }

    public void RecordSuccess(string key) => _failures.TryRemove(key, out _);

    private sealed record FailureWindow(int Failures, DateTimeOffset StartedAt);
}
