export type FAQQuestion = {
    question: string;
    answer: string;
};
export type FAQSection = {
    title: string;
    questions: FAQQuestion[];
};
export declare const faqSections: FAQSection[];
