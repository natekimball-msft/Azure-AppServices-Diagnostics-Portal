using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    /// <summary>
    /// Interface to provide details for each auth scheme.
    /// </summary>
    public interface IKustoAuthOptions
    {
        /// <summary>
        /// Gets or sets a value indicating whether the current auth scheme is enabled.
        /// </summary>
        bool Enabled { get; set; }

        /// <summary>
        /// Gets or sets the client id guid of the AAD app.
        /// </summary>
        string ClientId { get; set; }

        /// <summary>
        /// Gets or sets the tenant id guid in which the aad app resides.
        /// </summary>
        string TenantId { get; set; }

        /// <summary>
        /// Gets or sets the application key to use. Should hold a valid value only for AppKey based auth scheme.
        /// </summary>
        string AppKey { get; set; }

        /// <summary>
        /// Gets or sets the subject name of the certificate to use to acquire the AAD token. Should hold a valid value only for cert based based auth scheme.
        /// </summary>
        string TokenRequestorCertSubjectName { get; set; }
    }
}
