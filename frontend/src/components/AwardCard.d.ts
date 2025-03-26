import React from 'react';
interface AwardCardProps {
    award: {
        id: number;
        award: {
            title: string;
            description: string;
            rank: string;
        };
    };
}
declare const AwardCard: React.FC<AwardCardProps>;
export default AwardCard;
