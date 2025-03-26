interface DescriptionRequest {
    id: string;
}
declare const fetchPendingDescriptions: () => Promise<DescriptionRequest[] | undefined>;
export { fetchPendingDescriptions };
export type { DescriptionRequest };
