import React from 'react';

const SkeletonLoader = ({ className, width, height, circle }) => {
  const style = {
    width: width || '100%',
    height: height || '20px',
    borderRadius: circle ? '50%' : '1rem'
  };

  return (
    <div 
      className={`relative overflow-hidden bg-slate-200 dark:bg-white/5 animate-pulse-subtle ${className}`}
      style={style}
    >
      <div className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 dark:via-white/5 to-transparent animate-shimmer"></div>
    </div>
  );
};

export default SkeletonLoader;
