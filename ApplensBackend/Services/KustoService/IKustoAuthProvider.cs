using System;
using System.Configuration;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{
    /// <summary>
    /// Different auth schemes supported in configuration
    /// </summary>
    public enum KustoAuthSchemes
    {
        /// <summary>
        /// No auth scheme has valid details configured.
        /// </summary>
        None,

        /// <summary>
        /// Acquire token via app key
        /// </summary>
        AppKey,

        /// <summary>
        /// Acquire token via certificate (SN+I) authentication.
        /// </summary>
        CertBasedToken,

        /// <summary>
        /// Acquire token with user assigned managed identity.
        /// </summary>
        UserAssignedManagedIdentity
    }

    /// <summary>
    /// Indicates the current auth scheme to use and the configuration details to support it.
    /// </summary>
    public interface IKustoAuthProvider
    {
        /// <summary>
        /// Gets configuration details to support the corresponding auth scheme.
        /// </summary>
        KustoAuthOptions AuthDetails { get; }
    }

    /// <inheritdoc/>
    public class KustoAuthProvider : IKustoAuthProvider
    {
        private const string SectionName = "Kusto";

        /// <summary>
        /// Initializes a new instance of the <see cref="KustoAuthProvider"/> class.
        /// </summary>
        /// <param name="configuration">Configuration object injected via DI.</param>
        public KustoAuthProvider(IConfiguration configuration)
        {
            AuthDetails = new KustoAuthOptions();
            configuration.GetSection(SectionName).Bind(AuthDetails);

            switch (AuthDetails.AuthScheme)
            {
                case KustoAuthSchemes.UserAssignedManagedIdentity:
                    ThrowIfEmpty("ClientId", AuthDetails.ClientId, KustoAuthSchemes.UserAssignedManagedIdentity);

                    AuthDetails.TenantId = string.Empty;
                    AuthDetails.AppKey = string.Empty;
                    AuthDetails.TokenRequestorCertSubjectName = string.Empty;
                    break;
                case KustoAuthSchemes.CertBasedToken:
                    ThrowIfEmpty("ClientId", AuthDetails.ClientId, KustoAuthSchemes.CertBasedToken);
                    ThrowIfEmpty("TenantId", AuthDetails.TenantId, KustoAuthSchemes.CertBasedToken);
                    ThrowIfEmpty("TokenRequestorCertSubjectName", AuthDetails.TokenRequestorCertSubjectName, KustoAuthSchemes.CertBasedToken);

                    AuthDetails.AppKey = string.Empty;
                    break;
                case KustoAuthSchemes.AppKey:
                    ThrowIfEmpty("ClientId", AuthDetails.ClientId, KustoAuthSchemes.AppKey);
                    ThrowIfEmpty("TenantId", AuthDetails.TenantId, KustoAuthSchemes.AppKey);
                    ThrowIfEmpty("AppKey", AuthDetails.AppKey, KustoAuthSchemes.AppKey);

                    AuthDetails.TokenRequestorCertSubjectName = string.Empty;
                    break;
                default:
                    AuthDetails = GetEmptyAuthDetails();
                    break;
            }
        }

        /// <inheritdoc/>
        public KustoAuthOptions AuthDetails { get; private set; } = null;

        private void ThrowIfEmpty(string paramName, string paramValue, KustoAuthSchemes authScheme)
        {
            if (string.IsNullOrWhiteSpace(paramValue))
            {
                throw new ArgumentNullException(paramName: paramName, message: $"{paramName} cannot be empty for {authScheme} auth scheme");
            }
        }

        private KustoAuthOptions GetEmptyAuthDetails()
        {
            return new KustoAuthOptions()
            {
                AuthScheme = KustoAuthSchemes.None,
                ClientId = string.Empty,
                TenantId = string.Empty,
                AppKey = string.Empty,
                TokenRequestorCertSubjectName = string.Empty
            };
        }
    }
}
