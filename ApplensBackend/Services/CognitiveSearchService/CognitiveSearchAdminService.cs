using AppLensV3.Models;
using Azure.Search.Documents.Models;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace AppLensV3.Services.CognitiveSearchService
{
    public interface ICognitiveSearchAdminService
    {
        Task<bool> AddDocuments(List<CognitiveSearchDocument> documents, string indexName);
        Task<bool> DeleteIndex(string indexName);
        Task<bool> CreateIndex(string indexName);
        Task<List<string>> ListIndices();
    }

    public class CognitiveSearchAdminService: ICognitiveSearchAdminService {
        private readonly ICognitiveSearchBaseService _baseService;

        public CognitiveSearchAdminService(ICognitiveSearchBaseService baseService)
        {
            _baseService = baseService;
        }

        public async Task<bool> AddDocuments(List<CognitiveSearchDocument> documents, string indexName)
        {
            IndexDocumentsBatch<CognitiveSearchDocument> batch = IndexDocumentsBatch.Create(
                documents.Select(document => IndexDocumentsAction.Upload(document)).ToArray());
            try
            {
                var searchClient = await _baseService.GetIndexClientForAdmin(indexName);
                IndexDocumentsResult result = searchClient.IndexDocuments(batch);
                return true;
            }
            catch (Exception ex)
            {
                //TODO: Handle this
                throw ex;
            }
        }

        public async Task<bool> DeleteIndex(string indexName)
        {
            return await _baseService.DeleteIndex(indexName);
        }

        public async Task<bool> CreateIndex(string indexName)
        {
            return await _baseService.CreateIndex(indexName);
        }

        public async Task<List<string>> ListIndices()
        {
            return (await _baseService.ListIndices()).Select(x => x.Name).ToList();
        }
    }
}
