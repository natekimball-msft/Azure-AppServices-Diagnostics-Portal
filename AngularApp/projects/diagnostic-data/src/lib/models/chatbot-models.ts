export interface ChatMessage{
    id: string;
    message: string;
    displayedMessage: string;
    messageSource: MessageSource;
    timestamp: number;
    renderingType: MessageRenderingType;
    status: MessageStatus;
}

export enum MessageRenderingType{
    Text = "text",
    Markdown = "markdown",
    Code = "code"
}

export enum MessageStatus{
    Created = 0,
    Waiting = 1,
    InProgress = 2,
    Finished = 3,
}

export enum MessageSource {
    User = "user",
    System = "system"
}