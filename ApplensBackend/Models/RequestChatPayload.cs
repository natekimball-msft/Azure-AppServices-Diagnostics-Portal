using Azure.AI.OpenAI;

namespace AppLensV3.Models
{
    public class RequestChatPayload
    {
        public ChatMetaData MetaData { get; set; }

        public ChatMessage[] Messages { get; set; }
    }

    public class ChatMetaData
    {
        public string ChatIdentifier;
        public string ChatModel;
        public int MaxTokens;
        public string AzureServiceName;
    }
}
