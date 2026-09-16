using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public interface IAccessContextAccessor
{
    AccessContext? Current { get; }
}

public sealed class RequestAccessContextAccessor : IAccessContextAccessor
{
    public AccessContext? Current => null;
}
