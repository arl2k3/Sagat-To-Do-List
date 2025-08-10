using Sagat_To_Do_List.Data;

namespace Sagat_To_Do_List.Extensions;

public static class WebApplicationExtensions
{
    public static WebApplication ConfigureDevelopmentPipeline(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger(c =>
            {
                c.RouteTemplate = "swagger/{documentName}/swagger.json";
            });
            
            app.UseSwagger(c =>
            {
                c.RouteTemplate = "openapi/{documentName}.json";
            });
            
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/openapi/v1.json", "SAGAT Tasks API V1");
                c.RoutePrefix = "swagger";
                c.DefaultModelsExpandDepth(-1);
            });
        }

        return app;
    }

    public static WebApplication ConfigureCors(this WebApplication app)
    {
        if (app.Environment.IsDevelopment())
        {
            app.UseCors("Development"); 
        }
        else
        {
            app.UseCors("AllowAngularApp"); 
        }

        return app;
    }

    public static WebApplication ConfigurePipeline(this WebApplication app)
    {


        return app;
    }

    public static async Task<WebApplication> SeedDataAsync(this WebApplication app)
    {
        using var scope = app.Services.CreateScope();
        var services = scope.ServiceProvider;
        await DataSeeder.SeedAsync(services);
        return app;
    }
}
