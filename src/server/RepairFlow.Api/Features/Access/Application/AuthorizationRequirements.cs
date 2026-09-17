using Microsoft.AspNetCore.Authorization;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public enum AccessAction
{
    Authenticated,
    WorkspaceRead,
    OperationalRead,
    TechnicalRead,
    AuditRead,
    StaffManage,
    CredentialManage,
    AssignmentManage,
    IntakeWrite,
    DiagnosisWrite,
    QuoteWrite,
    RepairWrite,
    QualityCheckWrite,
    HandoverWrite,
    CustomerLinkManage
}

public enum AssignmentResponsibility
{
    Intake,
    Diagnosis,
    PrimaryTechnician,
    Repairer,
    QualityChecker,
    Handover
}

public sealed record AssignmentScope(
    Guid WorkspaceId,
    Guid ResourceId,
    Guid StaffProfileId,
    AssignmentResponsibility Responsibility,
    bool IsActive = true);

public sealed record AccessAuthorizationResource(
    Guid WorkspaceId,
    Guid? ResourceId = null,
    IReadOnlyCollection<AssignmentScope>? Assignments = null);

public sealed record AccessAuthorizationRequest(
    AccessContext? Context,
    AccessAction Action,
    Guid ResourceWorkspaceId,
    Guid? ResourceId = null,
    IReadOnlyCollection<AssignmentScope>? Assignments = null);

public enum AuthorizationFailureReason
{
    AuthenticationRequired,
    InvalidContext,
    InactivePrincipal,
    InactiveMembership,
    CrossWorkspace,
    RoleDenied,
    AssignmentRequired
}

public sealed record AuthorizationDecision(
    bool IsAllowed,
    AuthorizationFailureReason? FailureReason = null,
    bool HideResource = false)
{
    public static AuthorizationDecision Allow() => new(true);

    public static AuthorizationDecision Deny(
        AuthorizationFailureReason reason,
        bool hideResource = false) =>
        new(false, reason, hideResource);
}

public interface IAccessAuthorizationPolicy
{
    AuthorizationDecision Evaluate(AccessAuthorizationRequest request);
}

public static class AccessPolicies
{
    public const string Authenticated = "repairflow.access.authenticated";
    public const string WorkspaceRead = "repairflow.access.workspace-read";
    public const string OperationalRead = "repairflow.access.operational-read";
    public const string TechnicalRead = "repairflow.access.technical-read";
    public const string AuditRead = "repairflow.access.audit-read";
    public const string StaffManage = "repairflow.access.staff-manage";
    public const string CredentialManage = "repairflow.access.credential-manage";
    public const string AssignmentManage = "repairflow.access.assignment-manage";
    public const string IntakeWrite = "repairflow.access.intake-write";
    public const string DiagnosisWrite = "repairflow.access.diagnosis-write";
    public const string QuoteWrite = "repairflow.access.quote-write";
    public const string RepairWrite = "repairflow.access.repair-write";
    public const string QualityCheckWrite = "repairflow.access.quality-check-write";
    public const string HandoverWrite = "repairflow.access.handover-write";
    public const string CustomerLinkManage = "repairflow.access.customer-link-manage";

    public static IReadOnlyDictionary<string, AccessAction> Definitions { get; } =
        new Dictionary<string, AccessAction>(StringComparer.Ordinal)
        {
            [Authenticated] = AccessAction.Authenticated,
            [WorkspaceRead] = AccessAction.WorkspaceRead,
            [OperationalRead] = AccessAction.OperationalRead,
            [TechnicalRead] = AccessAction.TechnicalRead,
            [AuditRead] = AccessAction.AuditRead,
            [StaffManage] = AccessAction.StaffManage,
            [CredentialManage] = AccessAction.CredentialManage,
            [AssignmentManage] = AccessAction.AssignmentManage,
            [IntakeWrite] = AccessAction.IntakeWrite,
            [DiagnosisWrite] = AccessAction.DiagnosisWrite,
            [QuoteWrite] = AccessAction.QuoteWrite,
            [RepairWrite] = AccessAction.RepairWrite,
            [QualityCheckWrite] = AccessAction.QualityCheckWrite,
            [HandoverWrite] = AccessAction.HandoverWrite,
            [CustomerLinkManage] = AccessAction.CustomerLinkManage
        };
}

public sealed record AccessPolicyRequirement(AccessAction Action) : IAuthorizationRequirement;
