using Microsoft.AspNetCore.Identity;

namespace Sagat_To_Do_List.Data;

public static class DataSeeder
{
    public static async Task SeedAsync(IServiceProvider serviceProvider)
    {
        var roleManager = serviceProvider.GetRequiredService<RoleManager<IdentityRole>>();
        var userManager = serviceProvider.GetRequiredService<UserManager<IdentityUser>>();

        await CreateRolesAsync(roleManager);
        await CreateAdminUserAsync(userManager);
    }

    private static async Task CreateRolesAsync(RoleManager<IdentityRole> roleManager)
    {
        string[] roleNames = { "admin", "user" };
        
        foreach (var roleName in roleNames)
        {
            var roleExist = await roleManager.RoleExistsAsync(roleName);
            if (!roleExist)
            {
                await roleManager.CreateAsync(new IdentityRole(roleName));
            }
        }
    }
    private static async Task CreateAdminUserAsync(UserManager<IdentityUser> userManager)
    {
        var adminEmail = "admin@sagat.com";
        var adminUser = await userManager.FindByEmailAsync(adminEmail);
        
        if (adminUser == null)
        {
            var admin = new IdentityUser
            {
                UserName = adminEmail,
                Email = adminEmail,
                EmailConfirmed = true
            };

            var createAdmin = await userManager.CreateAsync(admin, "Admin123");
            if (createAdmin.Succeeded)
            {
                await userManager.AddToRoleAsync(admin, "admin");
            }
        }
    }
}
