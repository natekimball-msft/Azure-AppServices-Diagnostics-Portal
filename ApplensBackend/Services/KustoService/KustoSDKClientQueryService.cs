using System;
using System.Collections.Concurrent;
using System.Data;
using System.Text.RegularExpressions;
using System.Threading.Tasks;
using AppLensV3.Helpers;
using Kusto.Cloud.Platform.Data;
using Kusto.Data;
using Kusto.Data.Common;
using Microsoft.Extensions.Configuration;

namespace AppLensV3.Services
{
    public class KustoSDKClientQueryService : IKustoQueryService
    {
        private readonly bool useCertBasedTokenAcquisition = false;

        private static ConcurrentDictionary<Tuple<string, string>, ICslQueryProvider> QueryProviderMapping;

        private string userAssignedMSIClientId = string.Empty;

        private string aadKustoResource = string.Empty;

        private string kustoApiQueryEndpoint = string.Empty;

        public KustoSDKClientQueryService(IConfiguration configuration)
        {
            aadKustoResource = $"{configuration["Kusto:AADKustoResource"]}";
            if (string.IsNullOrWhiteSpace(aadKustoResource))
            {
                aadKustoResource = KustoConstants.AADKustoResource;
            }

            kustoApiQueryEndpoint = KustoApiEndpoint + ":443";

            userAssignedMSIClientId = $"{configuration["Kusto:UserAssignedMSIClientId"]}";
            if (!string.IsNullOrWhiteSpace(userAssignedMSIClientId) && !IsRunningLocal)
            {
                useCertBasedTokenAcquisition = false;
            }
            else
            {
                useCertBasedTokenAcquisition = !string.IsNullOrWhiteSpace($"{configuration.GetValue(typeof(string), "Kusto:CertBasedClientId", string.Empty)}") &&
                    !string.IsNullOrWhiteSpace($"{configuration.GetValue(typeof(string), "Kusto:CertBasedAADTenantId", string.Empty)}") &&
                    !string.IsNullOrWhiteSpace($"{configuration.GetValue(typeof(string), "Kusto:TokenRequestorCertSubjectName", string.Empty)}");

                if (useCertBasedTokenAcquisition)
                {
                    CertBasedAuthOptions = new KustoCertBasedAuthOptions(
                        clientId: $"{configuration.GetValue(typeof(string), "Kusto:CertBasedClientId")}",
                        aadTenantId: $"{configuration.GetValue(typeof(string), "Kusto:CertBasedAADTenantId")}",
                        tokenRequestorCertSubjectName: $"{configuration.GetValue(typeof(string), "Kusto:TokenRequestorCertSubjectName")}"
                        );
                }
                else
                {
                    if (!string.IsNullOrWhiteSpace($"{configuration.GetValue(typeof(string), "Kusto:ClientId", string.Empty)}") &&
                    !string.IsNullOrWhiteSpace($"{configuration.GetValue(typeof(string), "Kusto:AppKey", string.Empty)}"))
                    {
                        string tenantDomainId = $"{configuration.GetValue(typeof(string), "Kusto:AppKeyTenantId", string.Empty)}";
                        if (string.IsNullOrWhiteSpace(tenantDomainId))
                        {
                            tenantDomainId = KustoConstants.MicrosoftTenantAuthorityId;
                        }

                        AppKeyBasedAuthOptions = new KustoApplicationKeyBasedAuthOptions(
                            clientId: $"{configuration.GetValue(typeof(string), "Kusto:ClientId", string.Empty)}",
                            applicationKey: $"{configuration.GetValue(typeof(string), "Kusto:AppKey", string.Empty)}",
                            aadAuthorityId: tenantDomainId);
                    }
                }
            }

            if (QueryProviderMapping == null)
            {
                QueryProviderMapping = new ConcurrentDictionary<Tuple<string, string>, ICslQueryProvider>();
            }
        }

        private KustoCertBasedAuthOptions CertBasedAuthOptions { get; } = null;

        private KustoApplicationKeyBasedAuthOptions AppKeyBasedAuthOptions { get; } = null;

        private string KustoApiEndpoint
        {
            get
            {
                var m = Regex.Match(aadKustoResource, @"https://(?<cluster>\w+).");
                if (m.Success)
                {
                    return aadKustoResource.Replace(m.Groups["cluster"].Value, "{cluster}");
                }
                else
                {
                    throw new ArgumentException(nameof(aadKustoResource) + " not correctly formatted.");
                }
            }
        }

        private bool IsRunningLocal
        {
            get
            {
                return string.IsNullOrWhiteSpace(System.Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME"));
            }
        }
        private string GetClientIdentifyingName()
        {
            return IsRunningLocal ? $"LocalMachine|{System.Environment.MachineName}" : $"{System.Environment.GetEnvironmentVariable("WEBSITE_HOSTNAME")}|{System.Environment.GetEnvironmentVariable("COMPUTERNAME") ?? System.Environment.MachineName}";
        }

        private ICslQueryProvider Client(string cluster, string database)
        {
            var key = Tuple.Create(cluster, database);
            if (!QueryProviderMapping.ContainsKey(key))
            {
                KustoConnectionStringBuilder connectionStringBuilder = new KustoConnectionStringBuilder(kustoApiQueryEndpoint.Replace("{cluster}", cluster), database)
                {
                    ApplicationNameForTracing = GetClientIdentifyingName()
                };
                if (!string.IsNullOrWhiteSpace(userAssignedMSIClientId) && !IsRunningLocal)
                {
                    connectionStringBuilder = connectionStringBuilder.WithAadUserManagedIdentity(userAssignedMSIClientId);
                }
                else
                {
                    if (useCertBasedTokenAcquisition && CertBasedAuthOptions != null)
                    {
                        connectionStringBuilder = connectionStringBuilder.WithAadApplicationSubjectAndIssuerAuthentication(
                            applicationClientId: CertBasedAuthOptions.ClientId,
                            applicationCertificateSubjectDistinguishedName: GenericCertLoader.Instance.GetCertBySubjectName(CertBasedAuthOptions.TokenRequestorCertSubjectName).Subject,
                            applicationCertificateIssuerDistinguishedName: GenericCertLoader.Instance.GetCertBySubjectName(CertBasedAuthOptions.TokenRequestorCertSubjectName).IssuerName.Name,
                            authority: CertBasedAuthOptions.AADTenantId);
                    }
                    else
                    {
                        if (AppKeyBasedAuthOptions != null)
                        {
                            connectionStringBuilder = connectionStringBuilder.WithAadApplicationKeyAuthentication(
                                applicationClientId:AppKeyBasedAuthOptions.ClientId,
                                applicationKey: AppKeyBasedAuthOptions.ApplicationKey,
                                authority: AppKeyBasedAuthOptions.AADAuthorityId);
                        }
                        else
                        {
                            throw new InvalidOperationException("Attempt to create kusto client with invalid configuration. At least one of the auth configuration (User assigned MSI, SN+I, AppKey) must be configured.");
                        }
                    }
                }

                var queryProvider = Kusto.Data.Net.Client.KustoClientFactory.CreateCslQueryProvider(connectionStringBuilder);
                if (!QueryProviderMapping.TryAdd(key, queryProvider))
                {
                    queryProvider.Dispose();
                }
            }

            return QueryProviderMapping[key];
        }

        public async Task<DataTable> ExecuteQueryAsync(string cluster, string database, string query, string operationName, DateTime? startTime = null, DateTime? endTime = null, int timeoutSeconds = KustoConstants.DefaultQueryTimeoutInSeconds)
        {
            if (string.IsNullOrWhiteSpace(cluster))
            {
                throw new ArgumentNullException(paramName: nameof(cluster), message: "Kusto cluster name against which the query must be executed cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(database))
            {
                throw new ArgumentNullException(paramName: nameof(database), message: "Kusto database name against which the query must be executed cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(query))
            {
                throw new ArgumentNullException(paramName: nameof(query), message: "Query text to execute cannot be null or empty.");
            }

            if (string.IsNullOrWhiteSpace(operationName))
            {
                throw new ArgumentNullException(paramName: nameof(operationName), message: "Please specify an operation name to idetify this query.");
            }

            DataSet dataSet = null;
            try
            {
                ClientRequestProperties clientRequestProperties = new ClientRequestProperties();
                var kustoClientId = $"Diagnostics.{operationName};AppLensUI;{startTime?.ToString() ?? "UnknownStartTime"};{endTime?.ToString() ?? "UnknownEndTime"}##{0}_{Guid.NewGuid().ToString()}";
                clientRequestProperties.ClientRequestId = kustoClientId;
                clientRequestProperties.SetOption("servertimeout", new TimeSpan(0, 0, timeoutSeconds));
                if (cluster.StartsWith("waws", StringComparison.OrdinalIgnoreCase) && cluster.EndsWith("follower", StringComparison.OrdinalIgnoreCase))
                {
                    clientRequestProperties.SetOption(ClientRequestProperties.OptionQueryConsistency, ClientRequestProperties.OptionQueryConsistency_Weak);
                }

                var kustoClient = Client(cluster, database);
                var result = await kustoClient.ExecuteQueryAsync(database, query, clientRequestProperties);
                dataSet = result.ToDataSet();
            }
            catch (Exception ex)
            {
                // TODO: Log exception details here.
                throw;
            }

            DataTable datatable = dataSet?.Tables?[0];
            if (datatable == null)
            {
                datatable = new DataTable();
            }

            return datatable;
        }

        private class KustoCertBasedAuthOptions
        {
            public KustoCertBasedAuthOptions(string clientId, string aadTenantId, string tokenRequestorCertSubjectName)
            {
                if (string.IsNullOrWhiteSpace(clientId))
                {
                    throw new ArgumentNullException(paramName: nameof(clientId), message: "AAD client id cannot be null or empty.");
                }

                if (string.IsNullOrWhiteSpace(aadTenantId))
                {
                    throw new ArgumentNullException(paramName: nameof(aadTenantId), message: "AAD domain uri cannot be null or empty.");
                }

                if (string.IsNullOrWhiteSpace(tokenRequestorCertSubjectName))
                {
                    throw new ArgumentNullException(paramName: nameof(tokenRequestorCertSubjectName), message: "Certificate subject name to use for aquiring AAD token cannot be null or empty.");
                }

                ClientId = clientId;
                AADTenantId = aadTenantId;
                TokenRequestorCertSubjectName = tokenRequestorCertSubjectName;
            }

            public string TokenRequestorCertSubjectName { get; }

            public string ClientId { get; }

            public string AADTenantId { get; }
        }

        private class KustoApplicationKeyBasedAuthOptions
        {
            public KustoApplicationKeyBasedAuthOptions(string clientId, string applicationKey, string aadAuthorityId)
            {
                if (string.IsNullOrWhiteSpace(clientId))
                {
                    throw new ArgumentNullException(paramName: nameof(clientId), message: "AAD client id cannot be null or empty.");
                }

                if (string.IsNullOrWhiteSpace(applicationKey))
                {
                    throw new ArgumentNullException(paramName: nameof(applicationKey), message: "Secret used to aquire AAD token cannot be null or empty.");
                }

                if (string.IsNullOrWhiteSpace(aadAuthorityId))
                {
                    throw new ArgumentNullException(paramName: nameof(aadAuthorityId), message: "AAD domain uri cannot be null or empty.");
                }

                ClientId = clientId;
                AADAuthorityId = aadAuthorityId;
                ApplicationKey = applicationKey;
            }

            public string ApplicationKey { get; }

            public string ClientId { get; }

            public string AADAuthorityId { get; }
        }
    }
}
