using Sagat_To_Do_List.Configuration;
using Sagat_To_Do_List.Extensions;

var builder = WebApplication.CreateBuilder(args);

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
