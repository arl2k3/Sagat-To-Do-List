using Sagat_To_Do_List.Configuration;
using Sagat_To_Do_List.Extensions;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

// Deshabilitar Problem Details automáticos
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.SuppressModelStateInvalidFilter = false;
    options.SuppressMapClientErrors = true;
});

builder.Services
    .AddApplicationServices(builder.Configuration)
    .AddSwaggerConfiguration();

var app = builder.Build();

await app.SeedDataAsync();

app.ConfigurePipeline();
app.ConfigureDevelopmentPipeline();
app.ConfigureCors();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
