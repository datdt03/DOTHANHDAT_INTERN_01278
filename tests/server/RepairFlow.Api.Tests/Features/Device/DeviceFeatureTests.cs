using RepairFlow.Api.Api.Responses;
using Microsoft.AspNetCore.Http;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;
using RepairFlow.Api.Features.Device.Api;
using RepairFlow.Api.Features.Device.Application;
using DeviceEntity = RepairFlow.Api.Features.Device.Domain.Device;
using RepairFlow.Api.Features.Device.Domain;
using RepairFlow.Api.Tests.Features.Access;

namespace RepairFlow.Api.Tests.Features.Device;

public sealed class DeviceFeatureTests
{
    [Fact]
    public async Task Create_requires_serial_or_device_identifier()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingDeviceRepository();
        var service = CreateService(fixture, repository);

        var exception = await Assert.ThrowsAsync<ApiValidationException>(() => service.CreateAsync(
            new CreateDeviceRequest(
                Guid.NewGuid(),
                "laptop",
                "RepairFlow",
                "Model X"),
            CancellationToken.None));

        Assert.Contains("serialNumber", ((Dictionary<string, string[]>)exception.Details!).Keys);
        Assert.False(repository.CreateCalled);
    }

    [Fact]
    public async Task Customer_outside_workspace_is_hidden_as_not_found()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingDeviceRepository
        {
            CreateException = new DeviceNotFoundException()
        };
        var service = CreateService(fixture, repository);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.CreateAsync(
            new CreateDeviceRequest(Guid.NewGuid(), "laptop", "RepairFlow", "Model X", "SN-1"),
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status404NotFound, exception.StatusCode);
        Assert.Equal("not_found", exception.Code);
    }

    [Fact]
    public async Task Serial_duplicate_is_a_safe_conflict()
    {
        var fixture = AccessFixture.Create();
        var repository = new RecordingDeviceRepository
        {
            CreateException = new DeviceConflictException(
                "device_serial_exists",
                "A device with this serial number already exists in the workspace.")
        };
        var service = CreateService(fixture, repository);

        var exception = await Assert.ThrowsAsync<ApiException>(() => service.CreateAsync(
            new CreateDeviceRequest(Guid.NewGuid(), "laptop", "RepairFlow", "Model X", "SN-1"),
            CancellationToken.None));

        Assert.Equal(StatusCodes.Status409Conflict, exception.StatusCode);
        Assert.Equal("device_serial_exists", exception.Code);
    }

    private static DeviceService CreateService(
        AccessFixtureSet fixture,
        RecordingDeviceRepository repository)
    {
        var accessor = new RequestAccessContextAccessor();
        accessor.SetCurrent(AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff));
        return new DeviceService(accessor, new AccessAuthorizationPolicy(), repository);
    }

    private sealed class RecordingDeviceRepository : IDeviceRepository
    {
        public Exception? CreateException { get; init; }
        public bool CreateCalled { get; private set; }

        public Task<IReadOnlyList<DeviceEntity>> SearchAsync(
            Guid workspaceId,
            Guid? customerId,
            string? search,
            string? serialNumber,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default)
        {
            IReadOnlyList<DeviceEntity> result = [];
            return Task.FromResult(result);
        }

        public Task<DeviceEntity?> FindAsync(
            Guid workspaceId,
            Guid deviceId,
            Guid? assignedStaffId,
            CancellationToken cancellationToken = default) =>
            Task.FromResult<DeviceEntity?>(null);

        public Task<DeviceEntity> CreateAsync(
            Guid workspaceId,
            CreateDeviceData data,
            CancellationToken cancellationToken = default)
        {
            CreateCalled = true;
            if (CreateException is DeviceNotFoundException)
            {
                throw new DeviceNotFoundException();
            }

            if (CreateException is not null)
            {
                throw CreateException;
            }

            var now = DateTimeOffset.UtcNow;
            return Task.FromResult(new DeviceEntity(
                Guid.NewGuid(), workspaceId, data.CustomerId, data.DeviceType, data.Brand,
                data.Model, data.SerialNumber, data.DeviceIdentifier, data.Note, now, now));
        }
    }
}
