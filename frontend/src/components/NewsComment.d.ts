/******************************************************************************
 * src/components/NewsComment.tsx
 *
 * A modern React component for fetching and displaying comments under a news post,
 * with YouTube-like nested replies, likes, dislikes, and post-new-comment UI.
 ******************************************************************************/
import React from "react";
interface NewsCommentProps {
    newsId: number;
}
declare const NewsComment: React.FC<NewsCommentProps>;
export default NewsComment;
