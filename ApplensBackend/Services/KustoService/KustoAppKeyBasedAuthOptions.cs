namespace AppLensV3.Services
{
    /// <summary>
    /// Auth details for app key based authentication.
    /// </summary>
    public class KustoAppKeyBasedAuthOptions : IKustoAuthOptions
    {
        /// <summary>
        /// Identifies the level in app settings where the config is defined.
        /// </summary>
        public const string ConfigHierarchy = "Kusto:AuthSchemes:AppKeyAuth";

        /// <inheritdoc/>
        public bool Enabled { get; set; } = false;

        /// <inheritdoc/>
        public string TokenRequestorCertSubjectName { get => string.Empty; set { } }

        /// <inheritdoc/>
        public string ClientId { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string TenantId { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string AppKey { get; set; } = string.Empty;
    }
}
