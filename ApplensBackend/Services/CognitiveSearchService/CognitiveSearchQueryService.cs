using AppLensV3.Models;
using AppLensV3.Services.CognitiveSearchService;
using Azure.Search.Documents;
using Azure.Search.Documents.Models;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public interface ICognitiveSearchQueryService
    {
        Task<List<string>> SearchDocuments(string query, string indexName);
    }

    public class CognitiveSearchQueryService: ICognitiveSearchQueryService
    {
        private readonly ICognitiveSearchBaseService _baseService;
        public CognitiveSearchQueryService(ICognitiveSearchBaseService baseService)
        {
            _baseService = baseService;
        }

        public async Task<List<string>> SearchDocuments(string query, string indexName)
        {
            var queryClient = await _baseService.GetSearchClientForQueries(indexName);
            if (queryClient != null)
            {
                SearchOptions options = new SearchOptions();
                SearchResults<CognitiveSearchDocument> results = await queryClient.SearchAsync<CognitiveSearchDocument>(query, options);
                if (results != null && results.TotalCount > 0)
                {
                    return results.GetResults().ToList().Select(x => x.Document.Id).ToList();
                }
            }
            return new List<string>();
        }
    }
}
