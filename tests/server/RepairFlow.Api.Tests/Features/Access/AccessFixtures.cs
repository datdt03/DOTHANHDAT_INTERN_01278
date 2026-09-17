using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Tests.Features.Access;

public sealed record AccessFixtureSet(
    Workspace PrimaryWorkspace,
    Workspace SecondaryWorkspace,
    StaffProfile OwnerStaff,
    StaffProfile ManagerStaff,
    StaffProfile ReceptionistStaff,
    StaffProfile TechnicianStaff,
    StaffProfile StaffWithoutAccount,
    AccessPrincipal ActiveOwnerAccount,
    AccessPrincipal ActiveReceptionistAccount,
    AccessPrincipal InactiveManagerAccount,
    WorkspaceMembership OwnerMembership,
    WorkspaceMembership SecondaryOwnerMembership,
    WorkspaceMembership ReceptionistMembership,
    WorkspaceMembership SuspendedManagerMembership,
    WorkspaceMembership UnprovisionedStaffMembership);

public static class AccessFixture
{
    public const string KnownPassword = "correct-horse-battery-staple";

    public static AccessFixtureSet Create()
    {
        var primaryWorkspace = new Workspace(
            Guid.Parse("00000000-0000-0000-0000-000000000001"),
            "RepairFlow Demo Shop",
            "Asia/Ho_Chi_Minh");
        var secondaryWorkspace = new Workspace(
            Guid.Parse("00000000-0000-0000-0000-000000000002"),
            "RepairFlow Second Shop",
            "Asia/Ho_Chi_Minh");

        var ownerStaff = ActiveStaff("00000000-0000-0000-0000-000000000101", "Owner Demo");
        var managerStaff = ActiveStaff("00000000-0000-0000-0000-000000000102", "Manager Demo");
        var receptionistStaff = ActiveStaff("00000000-0000-0000-0000-000000000103", "Receptionist Demo");
        var technicianStaff = ActiveStaff("00000000-0000-0000-0000-000000000104", "Technician Demo");
        var staffWithoutAccount = ActiveStaff("00000000-0000-0000-0000-000000000105", "Staff Without Account");

        return new AccessFixtureSet(
            primaryWorkspace,
            secondaryWorkspace,
            ownerStaff,
            managerStaff,
            receptionistStaff,
            technicianStaff,
            staffWithoutAccount,
            new AccessPrincipal(
                Guid.Parse("00000000-0000-0000-0000-000000000201"),
                "owner@example.test",
                ownerStaff.Id,
                AccountStatus.Active),
            new AccessPrincipal(
                Guid.Parse("00000000-0000-0000-0000-000000000202"),
                "receptionist@example.test",
                receptionistStaff.Id,
                AccountStatus.Active),
            new AccessPrincipal(
                Guid.Parse("00000000-0000-0000-0000-000000000203"),
                "manager@example.test",
                managerStaff.Id,
                AccountStatus.Inactive),
            Membership("00000000-0000-0000-0000-000000000301", primaryWorkspace, ownerStaff, AccessRole.Owner, MembershipStatus.Active),
            Membership("00000000-0000-0000-0000-000000000302", secondaryWorkspace, ownerStaff, AccessRole.Owner, MembershipStatus.Active),
            Membership("00000000-0000-0000-0000-000000000303", primaryWorkspace, receptionistStaff, AccessRole.Receptionist, MembershipStatus.Active),
            Membership("00000000-0000-0000-0000-000000000304", primaryWorkspace, managerStaff, AccessRole.Manager, MembershipStatus.Suspended),
            Membership("00000000-0000-0000-0000-000000000305", primaryWorkspace, staffWithoutAccount, AccessRole.Technician, MembershipStatus.Active));
    }

    public static AccessContext CreateContext(
        AccessPrincipal principal,
        Workspace workspace,
        WorkspaceMembership membership,
        StaffProfile staffProfile,
        AttributedStaffContext? attributedStaff = null)
    {
        if (!AccessContext.TryCreate(
                principal,
                workspace,
                membership,
                staffProfile,
                attributedStaff,
                out var context))
        {
            throw new InvalidOperationException("The requested access fixture is invalid.");
        }

        return context!;
    }

    private static StaffProfile ActiveStaff(string id, string name) =>
        new(Guid.Parse(id), name, "+84123456789", StaffProfileStatus.Active);

    private static WorkspaceMembership Membership(
        string id,
        Workspace workspace,
        StaffProfile staffProfile,
        AccessRole role,
        MembershipStatus status) =>
        new(Guid.Parse(id), workspace.Id, staffProfile.Id, role, status);
}
