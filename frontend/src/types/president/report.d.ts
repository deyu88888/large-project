export interface ReportFormData {
    report_type: string;
    subject: string;
    details: string;
}
export type SelectChangeEvent = {
    target: {
        name: string;
        value: unknown;
    };
};
