import React from 'react';

export default function SplashScreen() {
  return (
    <div className="splash-screen">
      <svg className="splash-logo" viewBox="0 0 80 80" fill="none">
        <rect width="80" height="80" rx="16" fill="var(--z-brand-primary)"/>
        <path d="M20 55V25h12c8 0 12 4 12 10s-4 10-12 10H28v10H20zm8-18h4c4 0 6-2 6-5s-2-5-6-5h-4v10z" fill="white"/>
        <path d="M50 55V25h8v30h-8z" fill="white"/>
        <path d="M62 55V25h8v5h-4c-2 0-4 1-4 4v21h-8z" fill="white"/>
      </svg>
      <h1 className="splash-title">Z</h1>
      <p className="splash-subtitle">智能体Z 正在启动...</p>
      <div className="splash-spinner" />
    </div>
  );
}
