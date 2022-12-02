using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Primitives;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Middleware
{
    public class RequestMiddlewareNationalCloud
    {
        private readonly RequestDelegate _next;
        private readonly string websiteHostName;
        private readonly string allowedOrigin;

        public RequestMiddlewareNationalCloud(RequestDelegate next)
        {
            _next = next;
            websiteHostName = Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME");
            allowedOrigin = string.Empty;
            if (websiteHostName != null)
            {
                switch (websiteHostName)
                {
                    //Fairfax
                    case "https://applens.azurewebsites.us":
                        allowedOrigin = "https://azuresupportcenter.usgovcloudapi.net/";
                        break;
                    //Mooncake
                    case "https://applens.chinacloudsites.cn":
                        allowedOrigin = "https://azuresupportcenter.chinacloudapi.cn/";
                        break;
                    //USNat
                    case "https://applens-usnatwest.appservice.eaglex.ic.gov":
                        allowedOrigin = "https://ex.azuresupportcenter.eaglex.ic.gov/";
                        break;
                    //USSec
                    case "https://applens.appservice.microsoft.scloud":
                        allowedOrigin = "https://azuresupportcenter.microsoft.scloud/";
                        break;
                    default:
                        break;
                }
            }
        }

        public async Task Invoke(HttpContext httpContext)
        {
            AddCrossOriginRestrictionHeaders(httpContext);
            await _next(httpContext);
        }

        private void AddCrossOriginRestrictionHeaders(HttpContext httpContext)
        {
            httpContext.Response.Headers.Add("Content-Security-Policy", $"default-src: https:; frame-ancestors 'self' {allowedOrigin}");
        }
    }

}
