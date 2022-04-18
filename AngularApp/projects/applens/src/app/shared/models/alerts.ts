import { HealthStatus } from "diagnostic-data";

export interface AlertInfo {
    header: string;
    details: string;
    seekConfirmation: boolean;
    confirmationOptions: ConfirmationOption[]; 
    alertStatus: HealthStatus;
}

export interface ConfirmationOption {
    label: string;
    value: string;
}