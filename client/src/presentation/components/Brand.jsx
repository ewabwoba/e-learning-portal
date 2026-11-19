import React from 'react';
import { Link } from 'react-router-dom';

export function LogoMark({ size = 32 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true">
      <rect width="32" height="32" rx="9" fill="var(--blue)" />
      <path d="M7.5 13.2 16 9l8.5 4.200L16 17.400 7.500 13.200Z" fill="#fff" />
      <path d="M11 16.900v3.300c0 1.500 2.300 3 5 3s5-1.500 5-3v-3.300l-5 2.500-5-2.500Z" fill="#fff" opacity=".85" />
      <path d="M25 14v5" stroke="#fff" strokeWidth="1.600" strokeLinecap="round" />
    </svg>
  );
}

export default function Brand({ to = '/', label = 'Coursely home', compact = false }) {
  return (
    <Link to={to} className="brand" aria-label={label}>
      <LogoMark />
      {!compact && <span className="brand-word">Coursely</span>}
    </Link>
  );
}
