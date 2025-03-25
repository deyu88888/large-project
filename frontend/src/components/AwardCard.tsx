import React from 'react';
import { useTheme, Box, Typography, Paper } from "@mui/material";
import { tokens } from "../theme/theme";
import { FaTrophy } from "react-icons/fa";

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

const AwardCard: React.FC<AwardCardProps> = ({ award }) => {
  const theme = useTheme();
  const colours = tokens(theme.palette.mode);
  
  // Determine award color based on rank
  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'Gold':
        return '#FFD700';
      case 'Silver':
        return '#C0C0C0';
      case 'Bronze':
        return '#CD7F32';
      default:
        return '#CD7F32';
    }
  };

  const rankColor = getRankColor(award.award.rank);

  return (
    <Paper
      elevation={2}
      sx={{
        backgroundColor: colours.primary[400],
        border: `1px solid ${colours.grey[800]}`,
        p: 2,
        position: 'relative',
        overflow: 'hidden',
        transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
        '&:hover': {
          transform: 'translateY(-5px)',
          boxShadow: `0px 8px 15px rgba(0, 0, 0, 0.2)`,
        },
      }}
    >
      {/* Rank indicator ribbon */}
      <Box
        sx={{
          position: 'absolute',
          top: 0,
          right: 0,
          width: '30px',
          height: '30px',
          backgroundColor: rankColor,
          transform: 'rotate(45deg) translate(10px, -20px)',
        }}
      />
      
      <Box display="flex" alignItems="center" mb={2}>
        <FaTrophy 
          size={24} 
          style={{ marginRight: 12, color: rankColor }}
        />
        <Typography variant="h6" sx={{ color: colours.grey[100] }}>
          {award.award.title}
        </Typography>
      </Box>
      
      <Typography 
        variant="subtitle2" 
        sx={{ 
          color: colours.grey[300], 
          mb: 1,
          display: 'inline-block',
          backgroundColor: `${rankColor}22`,
          px: 1,
          py: 0.5,
          borderRadius: '4px',
        }}
      >
        {award.award.rank} Award
      </Typography>
      
      <Typography variant="body2" sx={{ color: colours.grey[300], mt: 1 }}>
        {award.award.description}
      </Typography>
    </Paper>
  );
};

export default AwardCard;