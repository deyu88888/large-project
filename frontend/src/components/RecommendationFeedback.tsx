import React, { useState, useEffect } from "react";
import { submitRecommendationFeedback, getRecommendationFeedback } from "../api";

interface RecommendationFeedbackProps {
  societyId: number;
  isLight: boolean;
  colours: any;
  onFeedbackSubmitted?: () => void;
}

const RecommendationFeedback: React.FC<RecommendationFeedbackProps> = ({ 
  societyId, 
  isLight,
  colours,
  onFeedbackSubmitted 
}) => {
  const [rating, setRating] = useState<number>(0);
  const [showFeedbackForm, setShowFeedbackForm] = useState<boolean>(false);
  const [relevance, setRelevance] = useState<number>(3);
  const [comment, setComment] = useState<string>("");
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [existingFeedback, setExistingFeedback] = useState<any | null>(null);
  const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);

  // Check if the user has already provided feedback for this society
  useEffect(() => {
    const checkExistingFeedback = async () => {
      try {
        const feedback = await getRecommendationFeedback(societyId);
        if (feedback && feedback.rating) {
          setExistingFeedback(feedback);
          setRating(feedback.rating);
          setRelevance(feedback.relevance);
          setComment(feedback.comment || "");
        }
      } catch (error) {
        // No existing feedback, that's fine
      }
    };

    checkExistingFeedback();
  }, [societyId]);

  const handleRatingClick = (value: number) => {
    setRating(value);
    setShowFeedbackForm(true);
  };

  const handleSubmitFeedback = async () => {
    setIsSubmitting(true);
    
    try {
      await submitRecommendationFeedback(societyId, {
        society_id: societyId,
        rating,
        relevance,
        comment: comment.trim() ? comment : undefined,
        is_joined: false
      });
      
      setFeedbackSubmitted(true);
      if (onFeedbackSubmitted) {
        onFeedbackSubmitted();
      }
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (feedbackSubmitted || (existingFeedback && !showFeedbackForm)) {
    return (
      <div 
        style={{
          marginTop: "1rem", 
          textAlign: "center",
          borderTop: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
          paddingTop: "0.75rem"
        }}
      >
        <div style={{
          fontSize: "0.875rem",
          color: isLight ? colours.grey[200] : colours.grey[200]
        }}>
          {existingFeedback ? "Thanks for your feedback!" : "Feedback submitted!"}
        </div>
        <div style={{display: "flex", justifyContent: "center", marginTop: "0.25rem"}}>
          {[1, 2, 3, 4, 5].map((star) => (
            <span 
              key={star}
              style={{ 
                fontSize: "1.25rem", 
                margin: "0 0.25rem",
                color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700]
              }}
            >
              ★
            </span>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      marginTop: "1rem",
      borderTop: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
      paddingTop: "0.75rem"
    }}>
      {!showFeedbackForm ? (
        <div>
          <p style={{
            fontSize: "0.875rem", 
            marginBottom: "0.5rem",
            color: isLight ? colours.grey[200] : colours.grey[200],
            textAlign: "center"
          }}>
            Was this recommendation helpful?
          </p>
          <div style={{display: "flex", justifyContent: "center"}}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                onClick={() => handleRatingClick(star)}
                style={{
                  margin: "0 0.25rem",
                  fontSize: "1.25rem",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700]
                }}
              >
                ★
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div>
          <div style={{marginBottom: "0.75rem"}}>
            <label style={{
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: 500,
              marginBottom: "0.25rem",
              color: isLight ? colours.grey[200] : colours.grey[200]
            }}>
              Rating:
            </label>
            <div style={{display: "flex", justifyContent: "center"}}>
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setRating(star)}
                  style={{
                    margin: "0 0.25rem",
                    fontSize: "1.25rem",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700]
                  }}
                >
                  ★
                </button>
              ))}
            </div>
          </div>
          
          <div style={{marginBottom: "0.75rem"}}>
            <label style={{
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: 500,
              marginBottom: "0.25rem",
              color: isLight ? colours.grey[200] : colours.grey[200]
            }}>
              How relevant was this recommendation?
            </label>
            <select
              value={relevance}
              onChange={(e) => setRelevance(parseInt(e.target.value))}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                borderRadius: "0.25rem",
                backgroundColor: "#ffffff", // White background
                color: "#000000", // Black text
              }}
              disabled={isSubmitting}
            >
              <option value={1}>Not relevant at all</option>
              <option value={2}>Slightly relevant</option>
              <option value={3}>Somewhat relevant</option>
              <option value={4}>Very relevant</option>
              <option value={5}>Extremely relevant</option>
            </select>
          </div>
          
          <div style={{marginBottom: "0.75rem"}}>
            <label style={{
              display: "block", 
              fontSize: "0.875rem", 
              fontWeight: 500,
              marginBottom: "0.25rem",
              color: isLight ? colours.grey[200] : colours.grey[200]
            }}>
              Comments (optional):
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              style={{
                width: "100%",
                padding: "0.5rem",
                border: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
                borderRadius: "0.25rem",
                backgroundColor: "#ffffff", // White background
                color: "#000000", // Black text
                resize: "vertical",
                minHeight: "4rem"
              }}
              disabled={isSubmitting}
            />
          </div>
          
          <div style={{display: "flex", justifyContent: "flex-end"}}>
            <button
              onClick={() => setShowFeedbackForm(false)}
              style={{
                padding: "0.375rem 0.75rem",
                marginRight: "0.5rem",
                fontSize: "0.875rem",
                backgroundColor: isLight ? colours.grey[300] : colours.grey[700],
                color: isLight ? colours.grey[900] : colours.grey[100],
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer"
              }}
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmitFeedback}
              style={{
                padding: "0.375rem 0.75rem",
                fontSize: "0.875rem",
                backgroundColor: isLight ? colours.blueAccent[400] : colours.blueAccent[500],
                color: isLight ? "#ffffff" : colours.grey[100],
                border: "none",
                borderRadius: "0.25rem",
                cursor: "pointer"
              }}
              disabled={isSubmitting}
            >
              {isSubmitting ? "Submitting..." : "Submit Feedback"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RecommendationFeedback;
