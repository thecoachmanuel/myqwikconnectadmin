'use client';

import React, { useState } from 'react';
import { getImageUrl } from '@/lib/image-helper';

interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  size?: number;
  className?: string;
  rounded?: boolean;
  style?: React.CSSProperties;
}

export default function UserAvatar({
  src,
  name,
  size = 42,
  className = '',
  rounded = true,
  style,
}: UserAvatarProps) {
  const [hasError, setHasError] = useState(false);

  const cleanSrc = src && src.trim() !== '' && src !== '/asset/img/user.png' ? getImageUrl(src) : null;
  const showPlaceholder = !cleanSrc || hasError;

  const borderRadius = rounded ? '50%' : '10px';

  if (showPlaceholder) {
    return (
      <div
        className={`d-inline-flex align-items-center justify-content-center flex-shrink-0 ${className}`}
        style={{
          width: size,
          height: size,
          minWidth: size,
          minHeight: size,
          borderRadius,
          backgroundColor: '#F1F3F6',
          border: '1px solid rgba(0, 0, 0, 0.05)',
          overflow: 'hidden',
          ...style,
        }}
        title={name || 'User'}
      >
        <svg
          width={Math.round(size * 0.52)}
          height={Math.round(size * 0.52)}
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M12 12C14.7614 12 17 9.76142 17 7C17 4.23858 14.7614 2 12 2C9.23858 2 7 4.23858 7 7C7 9.76142 9.23858 12 12 12Z"
            fill="#8E9AA0"
            fillOpacity="0.85"
          />
          <path
            d="M20.59 22C20.59 18.13 16.74 15 12 15C7.26 15 3.41 18.13 3.41 22H20.59Z"
            fill="#8E9AA0"
            fillOpacity="0.85"
          />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={cleanSrc}
      alt={name || 'User'}
      width={size}
      height={size}
      className={`${rounded ? 'rounded-circle' : 'rounded'} ${className}`}
      style={{
        width: size,
        height: size,
        objectFit: 'cover',
        borderRadius,
        border: '1px solid rgba(0,0,0,0.06)',
        ...style,
      }}
      onError={() => setHasError(true)}
    />
  );
}

