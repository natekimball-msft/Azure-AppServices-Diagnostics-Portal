using System;
using System.Data;
using System.Threading.Tasks;
using AppLensV3.Helpers;

namespace AppLensV3.Services
{
    /// <summary>
    /// Interface to implement by Kusto provider. Consumers can execute queries via this method.
    /// </summary>
    public interface IKustoQueryService
    {
        /// <summary>
        /// Execute a kusto query.
        /// </summary>
        /// <param name="cluster">Cluster name where the query is supposed to be executed on.</param>
        /// <param name="database">Kusto database name to connect to.</param>
        /// <param name="query">Query text to execute.</param>
        /// <param name="operationName">Unique string name to identify the purpose of this query.</param>
        /// <param name="startTime">Start time that the query is looking up data from.</param>
        /// <param name="endTime">End time that the query is looking up data up to.</param>
        /// <param name="timeoutSeconds">Time out in seconds for the query.</param>
        /// <returns>Returns a data table containing the result of the query.</returns>
        Task<DataTable> ExecuteQueryAsync(string cluster, string database, string query, string operationName, DateTime? startTime = null, DateTime? endTime = null, int timeoutSeconds = KustoConstants.DefaultQueryTimeoutInSeconds);

        Task<string> GetKustoClusterByGeoRegion(string geoRegionName);
    }
}
