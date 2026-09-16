using System.Text.Json;
using RepairFlow.Api.Features.Access.Application;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed class AccessFoundationTests
{
    [Fact]
    public void Context_keeps_acting_account_and_attributed_staff_separate()
    {
        var fixture = AccessFixture.Create();
        var attributedStaff = AttributedStaffContext.From(fixture.StaffWithoutAccount);

        var context = AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff,
            attributedStaff);

        Assert.Equal(fixture.ActiveOwnerAccount.Id, context.Principal.Id);
        Assert.Equal(fixture.OwnerStaff.Id, context.StaffProfile.Id);
        Assert.Equal(fixture.StaffWithoutAccount.Id, context.AttributedStaff!.StaffProfileId);
        Assert.NotEqual(context.Principal.StaffProfileId, context.AttributedStaff.StaffProfileId);
    }

    [Fact]
    public void Staff_without_account_cannot_create_an_authenticated_context()
    {
        var fixture = AccessFixture.Create();

        var created = AccessContext.TryCreate(
            principal: null,
            fixture.PrimaryWorkspace,
            fixture.UnprovisionedStaffMembership,
            fixture.StaffWithoutAccount,
            attributedStaff: null,
            out var context);

        Assert.False(created);
        Assert.Null(context);
    }

    [Fact]
    public void Context_rejects_inactive_account_suspended_membership_and_cross_workspace_membership()
    {
        var fixture = AccessFixture.Create();

        Assert.False(AccessContext.TryCreate(
            fixture.InactiveManagerAccount,
            fixture.PrimaryWorkspace,
            fixture.SuspendedManagerMembership,
            fixture.ManagerStaff,
            attributedStaff: null,
            out _));

        var activeManagerAccount = fixture.InactiveManagerAccount with
        {
            Status = AccountStatus.Active
        };
        Assert.False(AccessContext.TryCreate(
            activeManagerAccount,
            fixture.PrimaryWorkspace,
            fixture.SuspendedManagerMembership,
            fixture.ManagerStaff,
            attributedStaff: null,
            out _));

        Assert.False(AccessContext.TryCreate(
            fixture.ActiveOwnerAccount,
            fixture.SecondaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff,
            attributedStaff: null,
            out _));
    }

    [Fact]
    public void Service_projects_only_safe_access_context_fields()
    {
        var fixture = AccessFixture.Create();
        var context = AccessFixture.CreateContext(
            fixture.ActiveOwnerAccount,
            fixture.PrimaryWorkspace,
            fixture.OwnerMembership,
            fixture.OwnerStaff);

        var response = new AccessService().ToSafeResponse(context);
        var json = JsonSerializer.Serialize(response);

        Assert.Equal("owner", response.Role);
        Assert.DoesNotContain("password", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("token", json, StringComparison.OrdinalIgnoreCase);
        Assert.DoesNotContain("hash", json, StringComparison.OrdinalIgnoreCase);
    }
}
