import React, { useState, useEffect, useRef } from "react";
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
  const [animationStage, setAnimationStage] = useState<number>(0);
  const [isVisible, setIsVisible] = useState<boolean>(true);
  
  const feedbackRef = useRef<HTMLDivElement>(null);
  const starsRef = useRef<HTMLDivElement>(null);
  const thanksRef = useRef<HTMLDivElement>(null);

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
          
          // Start disappearing animation for existing feedback after 4s
          setTimeout(() => {
            startDisappearAnimation();
          }, 4000);
        }
      } catch (error) {
        // No existing feedback, that's fine
      }
    };

    checkExistingFeedback();
  }, [societyId]);

  const startDisappearAnimation = () => {
    // Step 1: Start fading the stars
    setAnimationStage(1);

    // Step 2: After stars fade, begin sliding thanks message
    setTimeout(() => {
      setAnimationStage(2);
    }, 400);

    // Step 3: Start collapsing the container
    setTimeout(() => {
      setAnimationStage(3);
    }, 800);

    // Step 4: Finally remove from DOM
    setTimeout(() => {
      setIsVisible(false);
    }, 1200);
  };

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
      
      // Schedule the disappearing animation after 3 seconds
      setTimeout(() => {
        startDisappearAnimation();
      }, 3000);
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isVisible) {
    return null; // Don't render anything if not visible
  }

  if (feedbackSubmitted || (existingFeedback && !showFeedbackForm)) {
    return (
      <div 
        ref={feedbackRef}
        style={{
          marginTop: "1rem", 
          textAlign: "center",
          borderTop: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
          paddingTop: animationStage >= 3 ? "0" : "0.75rem",
          paddingBottom: animationStage >= 3 ? "0" : "0.75rem",
          overflow: "hidden",
          height: animationStage >= 3 ? "0" : "auto",
          opacity: animationStage >= 3 ? 0 : 1,
          transition: "height 0.4s cubic-bezier(0.16, 1, 0.3, 1), padding 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
          transform: `perspective(1000px) rotateX(${animationStage >= 3 ? '-10deg' : '0'})`,
          transformOrigin: "top center",
          position: "relative",
          marginBottom: animationStage >= 3 ? "0" : undefined,
        }}
      >
        <div 
          ref={thanksRef}
          style={{
            fontSize: "0.875rem",
            color: isLight ? colours.grey[200] : colours.grey[200],
            fontWeight: 600,
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transform: animationStage >= 2 ? "translateY(-20px)" : "translateY(0)",
            opacity: animationStage >= 2 ? 0 : 1,
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
          }}
        >
          <span 
            role="img" 
            aria-label="Thumbs up" 
            style={{ 
              marginRight: "0.5rem",
              display: "inline-block",
              animation: "thumbPulse 1.5s ease-in-out"
            }}
          >
            👍
          </span>
          <span style={{ 
            background: `linear-gradient(90deg, ${colours.greenAccent[500]}, ${colours.blueAccent[500]})`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            animation: "gradientShift 3s ease infinite"
          }}>
            {existingFeedback ? "Thanks for your feedback!" : "Feedback submitted!"}
          </span>
        </div>
        <div 
          ref={starsRef}
          style={{
            display: "flex", 
            justifyContent: "center", 
            marginTop: "0.5rem",
            transform: animationStage >= 1 ? "translateY(20px)" : "translateY(0)",
            opacity: animationStage >= 1 ? 0 : 1,
            transition: "transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1), opacity 0.4s ease-out",
          }}
        >
          {[1, 2, 3, 4, 5].map((star, index) => (
            <span 
              key={star}
              style={{ 
                fontSize: "1.25rem", 
                margin: "0 0.25rem",
                color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700],
                filter: star <= rating ? "drop-shadow(0 0 3px rgba(255, 215, 0, 0.7))" : "none",
                animation: star <= rating ? `starEntrance 0.3s cubic-bezier(0.34, 1.56, 0.64, 1) ${index * 0.08}s both` : "",
                display: "inline-block",
                transform: `scale(${star <= rating ? 1 : 0.9})`,
                transformOrigin: "center center",
              }}
            >
              ★
            </span>
          ))}
        </div>
        {/* Decorative particles that appear briefly */}
        {!animationStage && [1, 2, 3, 4, 5].map((_, i) => (
          <div
            key={i}
            style={{
              position: "absolute",
              left: `${10 + i * 20}%`,
              top: "50%",
              width: "5px",
              height: "5px",
              borderRadius: "50%",
              backgroundColor: i % 2 === 0 ? colours.greenAccent[400] : colours.blueAccent[400],
              animation: `particle 1s ease-out ${i * 0.1}s`,
              opacity: 0,
              pointerEvents: "none"
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div 
      style={{
        marginTop: "1rem",
        borderTop: `1px solid ${isLight ? colours.grey[300] : colours.grey[700]}`,
        paddingTop: "0.75rem",
        transition: 'all 0.3s ease'
      }}
    >
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
                  color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700],
                  transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease, filter 0.3s ease",
                  transform: `scale(${star <= rating ? 1.1 : 1})`,
                  filter: star <= rating ? "drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))" : "none",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = "scale(1.3) rotate(5deg)";
                  e.currentTarget.style.filter = "drop-shadow(0 0 5px rgba(255, 215, 0, 0.7))";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = star <= rating ? "scale(1.1)" : "scale(1)";
                  e.currentTarget.style.filter = star <= rating ? "drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))" : "none";
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
                    color: star <= rating ? "#FFD700" : isLight ? colours.grey[300] : colours.grey[700],
                    transition: "transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease, filter 0.3s ease",
                    transform: `scale(${star <= rating ? 1.1 : 1})`,
                    filter: star <= rating ? "drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))" : "none",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "scale(1.3) rotate(5deg)";
                    e.currentTarget.style.filter = "drop-shadow(0 0 5px rgba(255, 215, 0, 0.7))";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = star <= rating ? "scale(1.1)" : "scale(1)";
                    e.currentTarget.style.filter = star <= rating ? "drop-shadow(0 0 2px rgba(255, 215, 0, 0.5))" : "none";
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
                backgroundColor: isLight ? "#ffffff" : colours.primary[600],
                color: isLight ? "#000000" : colours.grey[100],
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = isLight 
                  ? `0 0 0 2px ${colours.blueAccent[200]}, 0 3px 10px rgba(0,0,0,0.1)` 
                  : `0 0 0 2px ${colours.blueAccent[700]}, 0 3px 10px rgba(0,0,0,0.2)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
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
                backgroundColor: isLight ? "#ffffff" : colours.primary[600],
                color: isLight ? "#000000" : colours.grey[100],
                resize: "vertical",
                minHeight: "4rem",
                transition: "box-shadow 0.3s ease, transform 0.3s ease",
                boxShadow: "0 2px 5px rgba(0,0,0,0.08)",
                outline: "none",
              }}
              onFocus={(e) => {
                e.currentTarget.style.boxShadow = isLight 
                  ? `0 0 0 2px ${colours.blueAccent[200]}, 0 3px 10px rgba(0,0,0,0.1)` 
                  : `0 0 0 2px ${colours.blueAccent[700]}, 0 3px 10px rgba(0,0,0,0.2)`;
                e.currentTarget.style.transform = "translateY(-2px)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.08)";
                e.currentTarget.style.transform = "translateY(0)";
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
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden",
              }}
              disabled={isSubmitting}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
              }}
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
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
                boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
                position: "relative",
                overflow: "hidden",
              }}
              disabled={isSubmitting}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-3px)";
                e.currentTarget.style.boxShadow = "0 5px 15px rgba(0,0,0,0.15)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
              }}
            >
              {isSubmitting ? (
                <>
                  <span>Submitting...</span>
                  <div 
                    style={{
                      position: "absolute",
                      top: 0,
                      right: 0,
                      bottom: 0,
                      left: 0,
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      animation: "shimmer 1.5s infinite",
                    }}
                  />
                </>
              ) : (
                <span 
                  style={{
                    display: "inline-block",
                    position: "relative",
                    zIndex: 1
                  }}
                >
                  Submit Feedback
                  <span 
                    style={{
                      position: "absolute",
                      bottom: "-3px",
                      left: "0",
                      width: "100%",
                      height: "2px",
                      background: `linear-gradient(90deg, transparent, ${isLight ? 'white' : 'rgba(255,255,255,0.7)'}, transparent)`,
                      transformOrigin: "center",
                      transform: "scaleX(0.7)",
                      opacity: 0.6,
                    }}
                  />
                </span>
              )}
            </button>
          </div>
        </div>
      )}
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
          @keyframes thumbPulse {
            0% { transform: scale(0) rotate(-15deg); opacity: 0; }
            50% { transform: scale(1.2) rotate(15deg); opacity: 1; }
            100% { transform: scale(1) rotate(0); opacity: 1; }
          }
          @keyframes gradientShift {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
          }
          @keyframes starEntrance {
            0% { transform: scale(0) rotate(-30deg); opacity: 0; }
            60% { transform: scale(1.3) rotate(15deg); opacity: 1; }
            100% { transform: scale(1) rotate(0deg); opacity: 1; }
          }
          @keyframes particle {
            0% { transform: translate(0, 0) scale(0); opacity: 0; }
            30% { opacity: 1; }
            100% { transform: translate(${Math.random() > 0.5 ? '-' : ''}${20 + Math.random() * 30}px, ${Math.random() > 0.5 ? '-' : ''}${20 + Math.random() * 30}px) scale(1); opacity: 0; }
          }
        `}
      </style>
    </div>
  );
};

export default RecommendationFeedback;