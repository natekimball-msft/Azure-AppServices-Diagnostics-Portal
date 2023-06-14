export class CustomCommandBarButtons {
    displayText: string;
    iconName: string;
    disabled: () => boolean = function () { return false; };
    onClick : () => void = function() {};
}