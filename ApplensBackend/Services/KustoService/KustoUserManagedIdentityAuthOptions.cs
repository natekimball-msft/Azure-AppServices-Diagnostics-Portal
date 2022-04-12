namespace AppLensV3.Services
{
    /// <summary>
    /// Auth details for user assigned managed identity.
    /// </summary>
    public class KustoUserManagedIdentityAuthOptions : IKustoAuthOptions
    {
        /// <summary>
        /// Identifies the level in app settings where the config is defined.
        /// </summary>
        public const string ConfigHierarchy = "Kusto:AuthSchemes:UserManagedIdentityAuth";

        /// <inheritdoc/>
        public bool Enabled { get; set; } = false;

        /// <inheritdoc/>
        public string TokenRequestorCertSubjectName { get => string.Empty; set { } }

        /// <inheritdoc/>
        public string ClientId { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string TenantId { get => string.Empty; set { } }

        /// <inheritdoc/>
        public string AppKey { get => string.Empty; set { } }
    }
}
