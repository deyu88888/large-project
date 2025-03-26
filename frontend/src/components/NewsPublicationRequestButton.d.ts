import React from 'react';
interface NewsPublicationRequestButtonProps {
    newsId: number;
    onSuccess?: () => void;
    disabled?: boolean;
}
declare const NewsPublicationRequestButton: React.FC<NewsPublicationRequestButtonProps>;
export default NewsPublicationRequestButton;
