namespace AppLensV3.Services
{
    /// <summary>
    /// Auth details for cert based token acquisition.
    /// </summary>
    public class KustoCertBasedAuthOptions: IKustoAuthOptions
    {
        /// <summary>
        /// Identifies the level in app settings where the config is defined.
        /// </summary>
        public const string ConfigHierarchy = "Kusto:AuthSchemes:CertTokenAuth";

        /// <inheritdoc/>
        public bool Enabled { get; set; } = false;

        /// <inheritdoc/>
        public string TokenRequestorCertSubjectName { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string ClientId { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string TenantId { get; set; } = string.Empty;

        /// <inheritdoc/>
        public string AppKey { get => string.Empty; set { } }
    }
}
