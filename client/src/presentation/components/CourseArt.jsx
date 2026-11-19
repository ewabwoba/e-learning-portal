import React from 'react';
import { metaFor } from './categoryMeta';

/** Flat illustration used when a course has no photo (or it fails to load). Original artwork, no external assets. */
export default function CourseArt({ category, className = '' }) {
  const { icon: Icon, art, fg } = metaFor(category);
  return (
    <div className={`course-art ${className}`} style={{ background: art }} role="img" aria-label={`${category} course illustration`}>
      <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <circle cx="330" cy="40" r="90" fill="#fff" opacity=".28" />
        <circle cx="40" cy="220" r="80" fill="#fff" opacity=".22" />
        <rect x="70" y="52" width="210" height="140" rx="14" fill="#fff" />
        <rect x="70" y="52" width="210" height="26" rx="14" fill="#fff" />
        <circle cx="88" cy="65" r="4" fill={fg} opacity=".5" /><circle cx="102" cy="65" r="4" fill={fg} opacity=".3" /><circle cx="116" cy="65" r="4" fill={fg} opacity=".2" />
        <rect x="92" y="96" width="96" height="9" rx="4.5" fill={fg} opacity=".85" />
        <rect x="92" y="114" width="150" height="7" rx="3.5" fill="#d7dcec" />
        <rect x="92" y="130" width="124" height="7" rx="3.5" fill="#d7dcec" />
        <rect x="92" y="156" width="64" height="22" rx="6" fill={fg} />
        <rect x="262" y="108" width="92" height="104" rx="12" fill={fg} opacity=".92" />
        <rect x="276" y="124" width="64" height="8" rx="4" fill="#fff" opacity=".85" />
        <rect x="276" y="142" width="44" height="8" rx="4" fill="#fff" opacity=".55" />
        <circle cx="308" cy="186" r="14" fill="#fff" opacity=".95" />
      </svg>
      <span className="course-art-icon" style={{ color: fg }}><Icon size={30} strokeWidth={2} aria-hidden /></span>
    </div>
  );
}
