namespace RepairFlow.Api.Features.Access.Domain;

public enum AccountStatus
{
    Active,
    Inactive,
    Locked
}

public enum StaffProfileStatus
{
    Active,
    Inactive,
    Locked
}

public enum AccessRole
{
    Owner,
    Manager,
    Receptionist,
    Technician
}

public enum MembershipStatus
{
    Invited,
    Active,
    Suspended,
    Removed
}

public sealed record Workspace(Guid Id, string Name, string TimeZone);

public sealed record StaffProfile(
    Guid Id,
    string Name,
    string? Phone,
    StaffProfileStatus Status);

public sealed record AccessPrincipal(
    Guid Id,
    string Email,
    Guid StaffProfileId,
    AccountStatus Status);

public sealed record WorkspaceMembership(
    Guid Id,
    Guid WorkspaceId,
    Guid StaffProfileId,
    AccessRole Role,
    MembershipStatus Status);

public sealed record AccessAccount(
    AccessPrincipal Principal,
    StaffProfile StaffProfile,
    string CredentialHash);

public sealed record AccessWorkspaceMembership(
    Workspace Workspace,
    WorkspaceMembership Membership);

public sealed record AccessSession(
    Guid Id,
    Guid PrincipalId,
    Guid StaffProfileId,
    Guid WorkspaceId,
    string TokenHash,
    DateTimeOffset IssuedAt,
    DateTimeOffset LastAccessedAt,
    DateTimeOffset AbsoluteExpiresAt,
    DateTimeOffset? RevokedAt,
    string? RevokeReason,
    string? IpHash,
    string? UserAgent);

public sealed record AccessSessionSnapshot(
    AccessSession Session,
    AccessAccount Account,
    AccessWorkspaceMembership WorkspaceMembership);

public sealed record AttributedStaffContext(Guid StaffProfileId, string DisplayName)
{
    public static AttributedStaffContext From(StaffProfile staffProfile) =>
        new(staffProfile.Id, staffProfile.Name);
}

public sealed record AccessContext(
    AccessPrincipal Principal,
    Workspace Workspace,
    WorkspaceMembership Membership,
    StaffProfile StaffProfile,
    AttributedStaffContext? AttributedStaff)
{
    public bool IsAuthenticated => true;

    public static bool TryCreate(
        AccessPrincipal? principal,
        Workspace? workspace,
        WorkspaceMembership? membership,
        StaffProfile? staffProfile,
        AttributedStaffContext? attributedStaff,
        out AccessContext? context)
    {
        context = null;

        if (principal is null ||
            workspace is null ||
            membership is null ||
            staffProfile is null ||
            principal.Status != AccountStatus.Active ||
            staffProfile.Status != StaffProfileStatus.Active ||
            membership.Status != MembershipStatus.Active ||
            principal.StaffProfileId != staffProfile.Id ||
            membership.StaffProfileId != staffProfile.Id ||
            membership.WorkspaceId != workspace.Id)
        {
            return false;
        }

        context = new AccessContext(
            principal,
            workspace,
            membership,
            staffProfile,
            attributedStaff);
        return true;
    }
}
