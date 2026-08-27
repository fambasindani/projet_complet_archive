// @ts-nocheck
// 📁 Composant/SkeletonLoader.jsx
import React from "react";

const SkeletonLoader = ({ 
  type = "text", 
  width = "100%", 
  height = "20px",
  count = 1,
  className = ""
}) => {
  const skeletons = [];
  
  for (let i = 0; i < count; i++) {
    skeletons.push(
      <div
        key={i}
        className={`skeleton-loader ${className}`}
        style={{
          width: width,
          height: height,
          backgroundColor: '#e0e0e0',
          borderRadius: '4px',
          marginBottom: '10px',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      />
    );
  }

  return <>{skeletons}</>;
};

export default SkeletonLoader;