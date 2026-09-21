using Amazon;
using Amazon.Runtime;
using Amazon.S3;
using Amazon.S3.Model;
using Microsoft.Extensions.Options;
using RepairFlow.Api.Features.RepairOrder.Application;

namespace RepairFlow.Api.Features.RepairOrder.Infrastructure;

public sealed class RepairEvidenceStorageOptions
{
    public const string SectionName = "ObjectStorage";

    public string Provider { get; set; } = "s3";

    public string ServiceUrl { get; set; } = string.Empty;

    public string Region { get; set; } = "us-east-1";

    public string BucketName { get; set; } = "repairflow-private";

    public string AccessKey { get; set; } = string.Empty;

    public string SecretKey { get; set; } = string.Empty;

    public bool ForcePathStyle { get; set; } = true;

    public int SignedUrlLifetimeSeconds { get; set; } = 300;

    public void Validate()
    {
        if (!string.Equals(Provider, "s3", StringComparison.OrdinalIgnoreCase))
        {
            throw new InvalidOperationException("ObjectStorage:Provider must be s3.");
        }

        if (string.IsNullOrWhiteSpace(BucketName) ||
            string.IsNullOrWhiteSpace(Region) ||
            string.IsNullOrWhiteSpace(AccessKey) ||
            string.IsNullOrWhiteSpace(SecretKey))
        {
            throw new InvalidOperationException(
                "ObjectStorage requires BucketName, Region, AccessKey and SecretKey.");
        }

        if (SignedUrlLifetimeSeconds is < 60 or > 3600)
        {
            throw new InvalidOperationException(
                "ObjectStorage:SignedUrlLifetimeSeconds must be between 60 and 3600.");
        }
    }
}

public sealed class S3PrivateObjectStorage : IPrivateObjectStorage, IDisposable
{
    private readonly IAmazonS3 _client;
    private readonly RepairEvidenceStorageOptions _options;

    public S3PrivateObjectStorage(IOptions<RepairEvidenceStorageOptions> options)
    {
        _options = options.Value;
        _options.Validate();
        var config = new AmazonS3Config
        {
            RegionEndpoint = RegionEndpoint.GetBySystemName(_options.Region),
            ForcePathStyle = _options.ForcePathStyle
        };
        if (!string.IsNullOrWhiteSpace(_options.ServiceUrl))
        {
            config.ServiceURL = _options.ServiceUrl;
        }

        _client = new AmazonS3Client(
            new BasicAWSCredentials(_options.AccessKey, _options.SecretKey),
            config);
    }

    public TimeSpan SignedReadLifetime =>
        TimeSpan.FromSeconds(_options.SignedUrlLifetimeSeconds);

    public async Task PutAsync(
        string objectKey,
        string contentType,
        Stream content,
        long contentLength,
        CancellationToken cancellationToken = default)
    {
        var request = new PutObjectRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            InputStream = content,
            ContentType = contentType,
            AutoCloseStream = false,
            AutoResetStreamPosition = false
        };
        request.Headers.ContentLength = contentLength;
        await _client.PutObjectAsync(request, cancellationToken);
    }

    public async Task DeleteAsync(
        string objectKey,
        CancellationToken cancellationToken = default)
    {
        await _client.DeleteObjectAsync(
            new DeleteObjectRequest
            {
                BucketName = _options.BucketName,
                Key = objectKey
            },
            cancellationToken);
    }

    public Task<string> CreateReadUrlAsync(
        string objectKey,
        DateTimeOffset expiresAt,
        CancellationToken cancellationToken = default)
    {
        cancellationToken.ThrowIfCancellationRequested();
        var url = _client.GetPreSignedURL(new GetPreSignedUrlRequest
        {
            BucketName = _options.BucketName,
            Key = objectKey,
            Verb = HttpVerb.GET,
            Expires = expiresAt.UtcDateTime
        });
        return Task.FromResult(url);
    }

    public void Dispose() => _client.Dispose();
}
