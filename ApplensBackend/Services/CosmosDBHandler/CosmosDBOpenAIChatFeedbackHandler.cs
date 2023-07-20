using AppLensV3.Models;
using Microsoft.Azure.Cosmos;
using Microsoft.Extensions.Configuration;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace AppLensV3.Services
{
    public class CosmosDBOpenAIChatFeedbackHandler : CosmosDBHandlerBase<ChatFeedback>, ICosmosDBOpenAIChatFeedbackHandler
    {
        const string collectionId = "OpenAIChatFeedback";

        /// <summary>
        /// Initializes a new instance of the <see cref="CosmosDBOpenAIChatFeedbackHandler"/> class.
        /// Constructor.
        /// </summary>
        /// <param name="configuration">Configuration object.</param>
        public CosmosDBOpenAIChatFeedbackHandler(IConfiguration configration) : base(configration)
        {
            CollectionId = collectionId;
            Inital(configration).Wait();
        }

        /// <summary>
        /// Adds feedback to database.
        /// </summary>
        /// <param name="chatFeedback">Feedback to be added.</param>
        /// <returns>ChatFeedbackSaveOperationResponse object indicating whether the save operation was successful or a failure.</returns>
        public async Task SaveFeedback(ChatFeedback chatFeedback)
        {
            await Container.CreateItemAsync<ChatFeedback>(chatFeedback, GetPartitionKey(chatFeedback));
        }

        /// <summary>
        /// Gets chat feedback for a specific PartitionKey and Id.
        /// </summary>
        /// <returns>Feedback correspoding to the Id. Null if matching feedback is not found.</returns>
        public async Task<ChatFeedback> GetFeedback(string chatIdentifier, string provider, string resourceType, string feedbackId) =>
            await GetItemAsync(feedbackId, ChatFeedback.GetPartitionKey(chatIdentifier, provider, resourceType));

        private PartitionKey GetPartitionKey(ChatFeedback chatFeedback) => new PartitionKey(chatFeedback.PartitionKey);

    }
}
