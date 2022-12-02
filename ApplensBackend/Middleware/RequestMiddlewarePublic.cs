using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Middleware
{
    public class RequestMiddlewarePublic
    {
        private readonly RequestDelegate _next;
        private readonly string allowedOrigins;

        public RequestMiddlewarePublic(RequestDelegate next)
        {
            _next = next;
            List<string> allowedOriginsList = new List<string>()
            {
                "https://azuresupportcenter.msftcloudes.com/", // Prod
                "https://azuresupportcenterppe.msftcloudes.com/", // PPE
                "https://azuresupportcentertest.azurewebsites.net/", // Test
                "https://eu.azuresupportcenter.azure.com", // EU
            };
            allowedOrigins = string.Join(" ", allowedOriginsList);
        }

        public async Task Invoke(HttpContext httpContext)
        {
            AddCrossOriginRestrictionHeaders(httpContext);
            await _next(httpContext);
        }

        private void AddCrossOriginRestrictionHeaders(HttpContext httpContext)
        {
            httpContext.Response.Headers.Add("Content-Security-Policy", $"default-src: https:; frame-ancestors 'self' {allowedOrigins}");
        }
    }

}
