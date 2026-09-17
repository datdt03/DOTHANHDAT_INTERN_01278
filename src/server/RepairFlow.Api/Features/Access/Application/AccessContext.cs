using RepairFlow.Api.Features.Access.Domain;

namespace RepairFlow.Api.Features.Access.Application;

public interface IAccessContextAccessor
{
    AccessContext? Current { get; }
}

public interface IAccessContextWriter
{
    void SetCurrent(AccessContext? context);
}

public sealed class RequestAccessContextAccessor : IAccessContextAccessor, IAccessContextWriter
{
    public AccessContext? Current { get; private set; }

    public void SetCurrent(AccessContext? context) => Current = context;
}
