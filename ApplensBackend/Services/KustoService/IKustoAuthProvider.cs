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
        /// Gets the current auth scheme to use.
        /// If user assigned managed identity is configured and the app is running on cloud, it will take precedence.
        /// Else, if configured, CertAuth scheme will be used to acquire token via SN+I.
        /// If both the user assigned managed identity and cert token auth are not configured, the default scheme to use is AppKey.
        /// </summary>
        KustoAuthSchemes AuthScheme { get; }

        /// <summary>
        /// Gets configuration details to support the corresponding auth scheme.
        /// </summary>
        IKustoAuthOptions AuthDetails { get; }
    }

    public class KustoAuthProvider : IKustoAuthProvider
    {
        private readonly IKustoAuthOptions appKeyAuth = null;
        private readonly IKustoAuthOptions certTokenAuth = null;
        private readonly IKustoAuthOptions userManagedIdentityAuth = null;

        public KustoAuthProvider(IConfiguration configuration)
        {
            appKeyAuth = new KustoAppKeyBasedAuthOptions();
            configuration.GetSection(KustoAppKeyBasedAuthOptions.ConfigHierarchy).Bind(appKeyAuth);

            certTokenAuth = new KustoCertBasedAuthOptions();
            configuration.GetSection(KustoCertBasedAuthOptions.ConfigHierarchy).Bind(certTokenAuth);

            userManagedIdentityAuth = new KustoUserManagedIdentityAuthOptions();
            configuration.GetSection(KustoUserManagedIdentityAuthOptions.ConfigHierarchy).Bind(userManagedIdentityAuth);

            if (userManagedIdentityAuth.Enabled && !string.IsNullOrWhiteSpace(userManagedIdentityAuth.ClientId) && !IsRunningLocal)
            {
                AuthScheme = KustoAuthSchemes.UserAssignedManagedIdentity;
                AuthDetails = userManagedIdentityAuth;
            }
            else
            {
                if (certTokenAuth.Enabled && !string.IsNullOrWhiteSpace(certTokenAuth.ClientId) &&
                    !string.IsNullOrWhiteSpace(certTokenAuth.TenantId) && !string.IsNullOrWhiteSpace(certTokenAuth.TokenRequestorCertSubjectName))
                {
                    AuthScheme = KustoAuthSchemes.CertBasedToken;
                    AuthDetails = certTokenAuth;
                }
                else
                {
                    if (appKeyAuth.Enabled && !string.IsNullOrWhiteSpace(appKeyAuth.ClientId) &&
                        !string.IsNullOrWhiteSpace(appKeyAuth.TenantId) && !string.IsNullOrWhiteSpace(appKeyAuth.AppKey))
                    {
                        AuthScheme = KustoAuthSchemes.AppKey;
                        AuthDetails = appKeyAuth;
                    }
                }
            }
        }

        /// <inheritdoc/>
        public KustoAuthSchemes AuthScheme { get; private set; } = KustoAuthSchemes.None;

        /// <inheritdoc/>
        public IKustoAuthOptions AuthDetails { get; private set; } = null;

        private bool IsRunningLocal
        {
            get
            {
                return string.IsNullOrWhiteSpace(System.Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME"));
            }
        }
    }
}
