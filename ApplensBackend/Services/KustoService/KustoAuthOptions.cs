using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    /// <summary>
    /// Class provide details for auth scheme.
    /// </summary>
    public class KustoAuthOptions
    {
        /// <summary>
        /// Gets or sets a value indicating whether the current auth scheme is enabled.
        /// </summary>
        public bool Enabled { get; set; } = false;

        /// <summary>
        /// Gets or sets the auth scheme type to use while authenticating to Kusto.
        /// </summary>
        public KustoAuthSchemes AuthScheme { get; set; } = KustoAuthSchemes.None;

        /// <summary>
        /// Gets or sets the client id guid of the AAD app.
        /// </summary>
        public string ClientId { get; set; }

        /// <summary>
        /// Gets or sets the tenant id guid in which the aad app resides.
        /// </summary>
        public string TenantId { get; set; }

        /// <summary>
        /// Gets or sets the application key to use. Should hold a valid value only for AppKey based auth scheme.
        /// </summary>
        public string AppKey { get; set; }

        /// <summary>
        /// Gets or sets the subject name of the certificate to use to acquire the AAD token. Should hold a valid value only for cert based based auth scheme.
        /// </summary>
        public string TokenRequestorCertSubjectName { get; set; }
    }
}
