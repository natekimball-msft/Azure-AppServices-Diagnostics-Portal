using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Configuration;
using Newtonsoft.Json;
using System;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CompletionModel
    {
        public dynamic Payload { get; set; }
    }

    public interface IOpenAIService : IDisposable
    {
        Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody);
        bool IsEnabled();
    }

    public class OpenAIServiceDisabled : IOpenAIService
    {
        public bool IsEnabled() { return false; }
        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody) { return null; }
        public void Dispose() {}
    }

    public class OpenAIService : IOpenAIService
    {
        private string OpenAIAPIUrl;
        private string OpenAIAPIKey;
        private static HttpClient _httpClient;
        IConfiguration _configuration;
        bool IsOpenAIAPIEnabled = false;
        private IMemoryCache cache;

        public OpenAIService(IConfiguration Configuration)
        {
            _configuration = Configuration;
            IsOpenAIAPIEnabled = Convert.ToBoolean(_configuration["OpenAIService:Enabled"]);
            if (IsOpenAIAPIEnabled)
            {
                OpenAIAPIUrl = _configuration["OpenAIService:APIUrl"];
                OpenAIAPIKey = _configuration["OpenAIService:APIKey"];
                if (string.IsNullOrWhiteSpace(OpenAIAPIUrl))
                {
                    throw new Exception("Invalid configuration for parameter - OpenAIService:APIUrl");
                }
                if (string.IsNullOrWhiteSpace(OpenAIAPIKey))
                {
                    throw new Exception("Invalid configuration for parameter - OpenAIService:APIKey");
                }
                else
                {
                    InitializeHttpClient();
                }
            }
            this.cache = cache;
        }


        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody)
        {
            var endpoint = $"{OpenAIAPIUrl}/completions";
            var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
            requestMessage.Content = new StringContent(JsonConvert.SerializeObject(requestBody.Payload), Encoding.UTF8, "application/json");
            return await _httpClient.SendAsync(requestMessage);
        }

        public bool IsEnabled()
        {
            return IsOpenAIAPIEnabled;
        }

        private void InitializeHttpClient()
        {
            _httpClient = new HttpClient();
            _httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
            _httpClient.DefaultRequestHeaders.Add("Authorization", $"Bearer {OpenAIAPIKey}");
        }

        public void Dispose()
        {
            if (_httpClient != null)
            {
                _httpClient.Dispose();
            }
        }
    }
}
