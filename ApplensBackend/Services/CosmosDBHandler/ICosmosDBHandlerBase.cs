using System;
using System.Collections.Generic;
using System.Linq.Expressions;
using System.Threading.Tasks;
using Microsoft.Azure.Documents;

namespace AppLensV3.Services
{
    public interface ICosmosDBHandlerBase<T> where T : class
    {
        Task<T> CreateItemAsync(T item);
        Task<T> GetItemAsync(string id, string partitionKey);

        Task<List<T>> GetItemsAsync(string partitionKey);

        Task<T> UpdateItemAsync(T item, string partitionKey);
    }
}
