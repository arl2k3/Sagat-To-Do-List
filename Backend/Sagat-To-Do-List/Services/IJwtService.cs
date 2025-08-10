using Microsoft.AspNetCore.Identity;

namespace Sagat_To_Do_List.Services
{
    public interface IJwtService
    {
        Task<string> GenerateJwtToken(IdentityUser user, string role);
    }
}