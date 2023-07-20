namespace AppLensV3.Models
{
    public class CognitiveSearchDocument
    {
        public string Id { get; set; }
        public string Title { get; set; }
        public string Content { get; set; }
        public string Url { get; set; }
        public CognitiveSearchDocument(string id, string title, string content, string url = null) {
            Id = id;
            Title = title;
            Content = content;
            Url = url;
        }
    }
}
