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

        public RequestMiddlewarePublic(RequestDelegate next)
        {
            _next = next;
        }

        public async Task Invoke(HttpContext httpContext)
        {
            AddCrossOriginRestrictionHeaders(httpContext);
            await _next(httpContext);
        }

        private void AddCrossOriginRestrictionHeaders(HttpContext httpContext)
        {
            List<string> allowedOrigins = new List<string>()
            {
                "https://azuresupportcenter.msftcloudes.com/", // Prod
                "https://azuresupportcenterppe.msftcloudes.com/", // PPE
                "https://azuresupportcentertest.azurewebsites.net/", // Test
                "https://eu.azuresupportcenter.azure.com", // EU
            };
            string allowedOriginsStr = string.Join(" ", allowedOrigins);
            httpContext.Response.Headers.Add("Content-Security-Policy", $"default-src: https:; frame-ancestors 'self' {allowedOriginsStr}");
        }
    }

}
