using System;
using System.Collections.Concurrent;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading;
using System.Threading.Tasks;
using AppLensV3.Models;
using Azure;
using Azure.AI.OpenAI;
using Microsoft.CodeAnalysis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Newtonsoft.Json;
using Newtonsoft.Json.Linq;

namespace AppLensV3.Services
{
    public class CompletionModel
    {
        public dynamic Payload { get; set; }
    }

    public interface IOpenAIService : IDisposable
    {
        Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest);

        Task<dynamic> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata);

        Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task> onMessageStreamAsyncCallback, CancellationToken cancellationToken = default);

        bool IsEnabled();
    }

    public class OpenAIServiceDisabled : IOpenAIService
    {
        public bool IsEnabled() { return false; }

        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest) { return null; }

        public void Dispose() { }

        public Task<dynamic> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            return null;
        }

        public Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task> onMessageStreamAsyncCallback, CancellationToken cancellationToken = default)
        {
            return Task.CompletedTask;
        }
    }

    public class OpenAIService : IOpenAIService
    {
        private const int MaxTokensAllowed = 800;
        private const int MaxTokensAllowedForStreaming = 3000;
        private readonly string openAIEndpoint;
        private readonly string openAIGPT3APIUrl;
        private readonly string openAIGPT4Model;
        private readonly string openAIAPIKey;
        private readonly ILogger<OpenAIService> logger;
        private readonly bool isOpenAIAPIEnabled = false;
        private static HttpClient httpClient;
        private IOpenAIRedisService redisCache;
        private IConfiguration configuration;
        private static OpenAIClient openAIClient;
        private Dictionary<string, Task<string>> chatTemplateFileCache;
        private string chatHubRedisKeyPrefix;
        private Dictionary<string, AnalyticsKustoTableDetails> analyticsKustoTables = new Dictionary<string, AnalyticsKustoTableDetails>(StringComparer.OrdinalIgnoreCase);
        private ConcurrentDictionary<string, ChatCompletionCustomHandler> customHandlerForChatCompletion = new ConcurrentDictionary<string, ChatCompletionCustomHandler>(StringComparer.OrdinalIgnoreCase);

        // Delegate gets chatCompletionOptions which will have the corresponding template file and past user messages already loaded.
        // It also gets the chatMessages and the chatMetaData in case the custom logic needs to prepare its independent set of messages.
        private delegate Task<Response<ChatCompletions>> ChatCompletionCustomHandler(List<ChatMessage> chatMessages, ChatMetaData metadata, ChatCompletionsOptions chatCompletionsOptions);

        public OpenAIService(IConfiguration config, IOpenAIRedisService redisService, ILogger<OpenAIService> logger)
        {
            configuration = config;
            isOpenAIAPIEnabled = Convert.ToBoolean(configuration["OpenAIService:Enabled"]);
            chatTemplateFileCache = new Dictionary<string, Task<string>>();
            if (isOpenAIAPIEnabled)
            {
                this.logger = logger;
                redisCache = redisService;
                openAIEndpoint = configuration["OpenAIService:Endpoint"];
                openAIGPT3APIUrl = configuration["OpenAIService:GPT3DeploymentAPI"];
                openAIGPT4Model = configuration["OpenAIService:GPT4DeploymentName"];
                openAIAPIKey = configuration["OpenAIService:APIKey"];
                chatHubRedisKeyPrefix = "ChatHub-MessageState-";

                ValidateConfiguration();
                InitializeHttpClient();
                InitializeOpenAIClient();
                InitializeChatTemplateFileCache();

                // Initialize custom handlers for chat completion API. This allows for chaining GPT responses.
                customHandlerForChatCompletion["analyticskustocopilot"] = HandleAnalyticsKustoCopilot;
            }
        }

        private async Task<string> GetFromRedisCache(string key)
        {
            if (string.IsNullOrWhiteSpace(key))
            {
                return null;
            }
            return await redisCache.GetKey(key);
        }

        private async Task<bool> SaveToRedisCache(string key, string value)
        {
            if (string.IsNullOrWhiteSpace(key) || string.IsNullOrWhiteSpace(value))
            {
                return false;
            }
            return await redisCache.SetKey(key, value);
        }

        public async Task<HttpResponseMessage> RunTextCompletion(CompletionModel requestBody, bool cacheEnabledOnRequest)
        {
            var cacheKey = JsonConvert.SerializeObject(requestBody);
            if (cacheEnabledOnRequest)
            {
                var getFromCache = await GetFromRedisCache(cacheKey);
                if (!string.IsNullOrEmpty(getFromCache))
                {
                    return new HttpResponseMessage()
                    {
                        StatusCode = HttpStatusCode.OK,
                        Content = new StringContent(getFromCache)
                    };
                }
            }
            try
            {
                var endpoint = $"{openAIEndpoint}{openAIGPT3APIUrl}";
                var requestMessage = new HttpRequestMessage(HttpMethod.Post, endpoint);
                requestMessage.Content = new StringContent(JsonConvert.SerializeObject(requestBody.Payload), Encoding.UTF8, "application/json");
                var response = await httpClient.SendAsync(requestMessage);
                if (cacheEnabledOnRequest)
                {
                    try
                    {
                        if (response.IsSuccessStatusCode)
                        {
                            var content = await response.Content.ReadAsStringAsync();
                            if (!string.IsNullOrWhiteSpace(content))
                            {
                                var saveStatus = await SaveToRedisCache(cacheKey, content);
                                logger.LogInformation($"Status of OpenAISaveToRedisCache: {saveStatus}");
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        // No big deal if save to cache fails, log and succeed the request
                        logger.LogWarning($"Failed to save OpenAI response to Redis Cache: {ex}");
                    }
                }
                return response;
            }
            catch (Exception ex)
            {
                logger.LogError($"OpenAICallError: {ex}");
                throw;
            }
        }

        public async Task<dynamic> RunChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            if (chatMessages == null || chatMessages.Count == 0)
            {
                throw new ArgumentNullException("chatMessages cannot be null or empty");
            }

            ChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);

            Response<ChatCompletions> response = null;
            if (!string.IsNullOrWhiteSpace(metadata.ChatIdentifier) && customHandlerForChatCompletion.TryGetValue(metadata.ChatIdentifier, out ChatCompletionCustomHandler customHandler))
            {
                response = await customHandler.Invoke(chatMessages, metadata, chatCompletionsOptions);
            }
            else
            {
                response = await openAIClient.GetChatCompletionsAsync(openAIGPT4Model, chatCompletionsOptions);
            }

            return response.Value;
        }

        /// <inheritdoc/>
        public async Task StreamChatCompletion(List<ChatMessage> chatMessages, ChatMetaData metadata, Func<ChatStreamResponse, Task>? onMessageStreamAsyncCallback = default, CancellationToken cancellationToken = default)
        {
            if (chatMessages == null || chatMessages.Count == 0)
            {
                return;
            }

            string finishReason = string.Empty;

            ChatCompletionsOptions chatCompletionsOptions = await PrepareChatCompletionOptions(chatMessages, metadata);
            chatCompletionsOptions.MaxTokens = MaxTokensAllowedForStreaming;

            Response<StreamingChatCompletions> response = await openAIClient.GetChatCompletionsStreamingAsync(
               openAIGPT4Model, chatCompletionsOptions);

            using StreamingChatCompletions streamingChatCompletions = response.Value;

            await foreach (StreamingChatChoice choice in streamingChatCompletions.GetChoicesStreaming(cancellationToken))
            {
                await foreach (ChatMessage message in choice.GetMessageStreaming(cancellationToken))
                {
                    string messageState = await GetFromRedisCache($"{chatHubRedisKeyPrefix}{metadata.MessageId}");
                    if (messageState != null && messageState.Equals("cancelled", StringComparison.OrdinalIgnoreCase))
                    {
                        throw new OperationCanceledException("message marked for cancellation in redis cache");
                    }

                    if (onMessageStreamAsyncCallback != default && message != null)
                    {
                        await onMessageStreamAsyncCallback(new ChatStreamResponse(content: message.Content));
                    }
                }

                finishReason = choice.FinishReason;
            }

            if (onMessageStreamAsyncCallback != default)
            {
                await onMessageStreamAsyncCallback(new ChatStreamResponse(finishReason: finishReason));
            }
        }

        private void InitializeHttpClient()
        {
            httpClient = new HttpClient();
            httpClient.MaxResponseContentBufferSize = Int32.MaxValue;
            httpClient.DefaultRequestHeaders.Add("api-key", $"{openAIAPIKey}");
        }

        private void InitializeOpenAIClient()
        {
            openAIClient = new OpenAIClient(
                new Uri(openAIEndpoint),
                new AzureKeyCredential(openAIAPIKey));
        }

        private async Task InitializeChatTemplateFileCache()
        {
            FileInfo[] allTemplateFiles = null;
            var listDirTask = Task.Factory.StartNew(() =>
            {
                DirectoryInfo dir = new DirectoryInfo(@"OpenAIChatTemplates");
                allTemplateFiles = dir.GetFiles("*.json");
            });

            await listDirTask;

            if (allTemplateFiles == null)
            {
                return;
            }

            foreach (FileInfo file in allTemplateFiles)
            {
                chatTemplateFileCache.TryAdd(file.Name, File.ReadAllTextAsync(file.FullName));
            }
        }

        private async Task<string> GetChatTemplateContent(string chatIdentifier)
        {
            await InitializeChatTemplateFileCache();
            string templateCacheKey = $"{chatIdentifier ?? string.Empty}.json".ToLower();
            if (string.IsNullOrWhiteSpace(chatIdentifier) || !chatTemplateFileCache.TryGetValue(templateCacheKey, out _))
            {
                templateCacheKey = "_default.json";
            }

            return await chatTemplateFileCache[templateCacheKey];
        }

        #region Delegate implementation for custom chat completion handlers
        private async Task<Response<ChatCompletions>> HandleAnalyticsKustoCopilot(List<ChatMessage> chatMessages, ChatMetaData metadata, ChatCompletionsOptions chatCompletionsOptions)
        {
            try
            {
                ChatCompletionsOptions tempChatCompletionsOptions = new ChatCompletionsOptions();
                tempChatCompletionsOptions.Temperature = chatCompletionsOptions.Temperature;
                tempChatCompletionsOptions.MaxTokens = chatCompletionsOptions.MaxTokens;
                tempChatCompletionsOptions.NucleusSamplingFactor = chatCompletionsOptions.NucleusSamplingFactor;
                tempChatCompletionsOptions.FrequencyPenalty = chatCompletionsOptions.FrequencyPenalty;
                tempChatCompletionsOptions.PresencePenalty = chatCompletionsOptions.PresencePenalty;
                tempChatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.System, chatCompletionsOptions.Messages.First(m => m.Role == ChatRole.System).Content));

                string userQuestion = chatMessages.Last(m => m.Role == ChatRole.User).Content;
                string chainingQuestion = $"Which table(s) will help answer the following question? If more than one table is found, return a comma seperated list.{Environment.NewLine}{userQuestion}";
                tempChatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, chainingQuestion));

                Response<ChatCompletions> intermediateResponse = await openAIClient.GetChatCompletionsAsync(openAIGPT4Model, tempChatCompletionsOptions);
                string tableNamesCSV = intermediateResponse.Value.Choices[0].Message.Content;
                if (tableNamesCSV.Equals("Sorry, I could not generate the query."))
                {
                    // We could not identify the table or the attempted question does not adhere to the rules set for the copilot. Terminate processing and return a response.
                    return intermediateResponse;
                }

                tempChatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.Assistant, tableNamesCSV));

                StringBuilder secondQuestion = new StringBuilder();
                foreach (string tableName in tableNamesCSV.Split(","))
                {
                    if (analyticsKustoTables.Count == 0)
                    {
                        string configString = await GetChatTemplateContent("analyticskustotableconfig");
                        JObject jObject = JObject.Parse(configString);
                        JArray tablesList = (jObject["Tables"] ?? new JObject()).ToObject<JArray>();
                        foreach (var element in tablesList)
                        {
                            if (!string.IsNullOrWhiteSpace((element["TableName"] ?? string.Empty).ToString()) && !string.IsNullOrWhiteSpace((element["SchemaWithNotes"] ?? string.Empty).ToString()))
                            {
                                analyticsKustoTables.Add(element["TableName"].ToString().Trim(),
                                    new AnalyticsKustoTableDetails()
                                    {
                                        TableName = element["TableName"].ToString().Trim(),
                                        Description = (element["Description"] ?? string.Empty).ToString(),
                                        SchemaWithNotes = (string)element["SchemaWithNotes"]
                                    }
                                 );
                            }
                        }
                    }

                    if (analyticsKustoTables.TryGetValue(tableName.Trim(), out AnalyticsKustoTableDetails tableDetails))
                    {
                        secondQuestion.AppendLine($"Table:{tableDetails.TableName}");
                        if (!string.IsNullOrWhiteSpace(tableDetails.Description))
                        {
                            secondQuestion.AppendLine($"Description:{tableDetails.Description}");
                        }

                        secondQuestion.AppendLine($"SchemaWithNotes:{tableDetails.SchemaWithNotes}");
                        secondQuestion.AppendLine();
                    }
                }

                secondQuestion.AppendLine("Using the above details, answer the following question");
                secondQuestion.AppendLine(userQuestion);
                tempChatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, secondQuestion.ToString()));

                return await openAIClient.GetChatCompletionsAsync(openAIGPT4Model, tempChatCompletionsOptions);

            }
            catch (Exception ex)
            {
                logger.LogError($"Error preparing chat completion options : {ex}");
                throw;
            }
        }
        #endregion

        private async Task<ChatCompletionsOptions> PrepareChatCompletionOptions(List<ChatMessage> chatMessages, ChatMetaData metadata)
        {
            var chatCompletionsOptions = new ChatCompletionsOptions()
            {
                Temperature = 0.3F,
                MaxTokens = metadata.MaxTokens <= MaxTokensAllowed ? metadata.MaxTokens : MaxTokensAllowed,
                NucleusSamplingFactor = 0.95F,
                FrequencyPenalty = 0,
                PresencePenalty = 0
            };

            try
            {
                string chatTemplateContent = await GetChatTemplateContent(metadata.ChatIdentifier);

                JObject jObject = JObject.Parse(chatTemplateContent);
                string systemPrompt = (jObject["systemPrompt"] ?? string.Empty).ToString();
                chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.System, systemPrompt));
                JArray fewShotExamples = (jObject["fewShotExamples"] ?? new JObject()).ToObject<JArray>();

                foreach (var element in fewShotExamples)
                {
                    string userMessage = (element["userInput"] ?? string.Empty).ToString();
                    string assistantMessage = (element["chatbotResponse"] ?? string.Empty).ToString();

                    chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.User, userMessage));
                    chatCompletionsOptions.Messages.Add(new ChatMessage(ChatRole.Assistant, assistantMessage));
                }

                chatMessages.ForEach(e => chatCompletionsOptions.Messages.Add(e));

            }
            catch (Exception ex)
            {
                logger.LogError($"Error preparing chat completion options : {ex}");
            }

            return chatCompletionsOptions;
        }

        private void ValidateConfiguration()
        {
            ValidateConfigEntry("OpenAIService:Endpoint");
            ValidateConfigEntry("OpenAIService:APIKey");
            ValidateConfigEntry("OpenAIService:GPT3ModelAPI");
            ValidateConfigEntry("OpenAIService:GPT4Model");
        }

        private void ValidateConfigEntry(string entryName)
        {
            string errorMsg = $"Invalid configuration for parameter - {entryName}";
            if (string.IsNullOrWhiteSpace(entryName))
            {
                this.logger.LogError(errorMsg);
                throw new Exception(errorMsg);
            }
        }

        public bool IsEnabled()
        {
            return isOpenAIAPIEnabled;
        }

        public void Dispose()
        {
            if (httpClient != null)
            {
                httpClient.Dispose();
            }
        }
    }
}