using RepairFlow.Api.Features.Access.Api;
using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public sealed class AccessService
{
    public AccessContextResponse ToSafeResponse(AccessContext context) =>
        new(
            context.Principal.Id,
            context.Principal.Email,
            context.Workspace.Id,
            context.Workspace.Name,
            context.Membership.Role.ToString().ToLowerInvariant(),
            context.StaffProfile.Id,
            context.StaffProfile.Name);
}
