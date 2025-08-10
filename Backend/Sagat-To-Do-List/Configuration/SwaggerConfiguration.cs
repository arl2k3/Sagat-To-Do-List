using Microsoft.OpenApi.Models;
using System.Reflection;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace Sagat_To_Do_List.Configuration;

/// <summary>
/// Filtro para remover las respuestas automáticas de Problem Details de Swagger
/// </summary>
public class RemoveProblemDetailsOperationFilter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        foreach (var response in operation.Responses.Values)
        {
            if (response.Content?.ContainsKey("application/problem+json") == true)
            {
                response.Content.Remove("application/problem+json");
            }
            
            if (response.Content != null)
            {
                var keysToRemove = response.Content.Keys
                    .Where(k => k.Contains("problem"))
                    .ToList();
                    
                foreach (var key in keysToRemove)
                {
                    response.Content.Remove(key);
                }
            }
        }
        
        var schemasToRemove = context.SchemaRepository.Schemas.Keys
            .Where(k => k.Contains("ProblemDetails") || k.Contains("ValidationProblemDetails"))
            .ToList();
            
        foreach (var schema in schemasToRemove)
        {
            context.SchemaRepository.Schemas.Remove(schema);
        }
    }
}

public static class SwaggerConfiguration
{
    public static IServiceCollection AddSwaggerConfiguration(this IServiceCollection services)
    {
        services.AddSwaggerGen(c =>
        {
            c.SwaggerDoc("v1", new OpenApiInfo
            {
                Version = "v1",
                Title = "SAGAT Tasks API",
            });

            // Deshabilitar Problem Details automáticos
            c.OperationFilter<RemoveProblemDetailsOperationFilter>();

            c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
            {
                Name = "Authorization",
                In = ParameterLocation.Header,
                Type = SecuritySchemeType.Http,
                Scheme = "bearer",
                BearerFormat = "JWT"
            });

            c.AddSecurityRequirement(new OpenApiSecurityRequirement()
            {
                {
                    new OpenApiSecurityScheme
                    {
                        Reference = new OpenApiReference
                        {
                            Type = ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                    },
                    new List<string>()
                }
            });
        });

        return services;
    }
}
