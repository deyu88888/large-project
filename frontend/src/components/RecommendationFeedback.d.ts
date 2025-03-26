import React from "react";
interface RecommendationFeedbackProps {
    societyId: number;
    isLight: boolean;
    colours: any;
    onFeedbackSubmitted?: () => void;
}
declare const RecommendationFeedback: React.FC<RecommendationFeedbackProps>;
export default RecommendationFeedback;
