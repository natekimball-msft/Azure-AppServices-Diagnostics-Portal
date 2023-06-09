using Azure;
using Azure.AI.OpenAI;
using SendGrid.Helpers.Mail;

namespace AppLensV3.Models
{
    public class RequestChatPayload
    {
        public ChatMetaData MetaData { get; set; }

        public ChatMessage[] Messages { get; set; }
    }

    public class ChatMetaData
    {
        public string MessageId;
        public string ChatIdentifier;
        public string ChatModel;
        public int MaxTokens;
        public string AzureServiceName;
    }

    public class ChatStreamResponse
    {
        public string Content;

        public string FinishReason;

        /// <summary>
        /// Initializes a new instance of the <see cref="ChatStreamResponse"/> class.
        /// </summary>
        /// <param name="content">content.</param>
        /// <param name="finishReason">finish reason.</param>
        public ChatStreamResponse(string content = "", string finishReason = "")
        {
            Content = content;
            FinishReason = finishReason;
        }
    }

    public class ChatResponse
    {
        /// <summary>
        /// Gets or sets response to show on the UI.
        /// </summary>
        public string Text { get; set; } = string.Empty;

        /// <summary>
        /// Gets a value indicating whether the response is truncated and if more is to follow.
        /// </summary>
        public bool Truncated
        {
            get => FinishReason.Equals("length", System.StringComparison.OrdinalIgnoreCase);
        }

        /// <summary>
        /// Gets or sets a description of how evaluation of this chat ended.
        /// </summary>
        public string FinishReason { get; set; } = string.Empty;

        public ChatResponse(string chatResponse, string finishReason)
        {
            Text = chatResponse ?? string.Empty;
            FinishReason = finishReason ?? string.Empty;
        }

        public ChatResponse(Response<ChatCompletions> chatCompletionResponse)
        {
            if (chatCompletionResponse?.Value?.Choices?.Count > 0)
            {
                Text = chatCompletionResponse.Value.Choices[0].Message?.Content ?? string.Empty;
                FinishReason = chatCompletionResponse.Value.Choices[0].FinishReason ?? string.Empty;
            }
        }
    }
}
