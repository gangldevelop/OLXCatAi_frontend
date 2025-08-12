import React from 'react';
import { makeStyles, tokens } from '@fluentui/react-components';

const useStyles = makeStyles({
  skeleton: {
    backgroundColor: tokens.colorNeutralBackground2,
    borderRadius: tokens.borderRadiusMedium,
    animation: 'pulse 1.5s ease-in-out infinite',
  },
  tableRow: {
    height: '40px',
    marginBottom: tokens.spacingVerticalS,
  },
  card: {
    height: '80px',
    marginBottom: tokens.spacingVerticalS,
  },
  statCard: {
    height: '60px',
    marginBottom: tokens.spacingVerticalS,
  },
  '@keyframes pulse': {
    '0%': {
      opacity: 1,
    },
    '50%': {
      opacity: 0.5,
    },
    '100%': {
      opacity: 1,
    },
  },
});

interface LoadingSkeletonProps {
  type: 'table' | 'card' | 'stat';
  count?: number;
}

const LoadingSkeleton: React.FC<LoadingSkeletonProps> = ({ type, count = 5 }) => {
  const styles = useStyles();
  
  const getSkeletonClass = () => {
    switch (type) {
      case 'table':
        return styles.tableRow;
      case 'card':
        return styles.card;
      case 'stat':
        return styles.statCard;
      default:
        return styles.tableRow;
    }
  };

  return (
    <div style={{ padding: tokens.spacingHorizontalM }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`${styles.skeleton} ${getSkeletonClass()}`} />
      ))}
    </div>
  );
};

export default LoadingSkeleton; 