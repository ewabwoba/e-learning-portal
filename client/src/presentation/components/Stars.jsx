import React from 'react';
import { Star } from 'lucide-react';

export default function Stars({ value = 0, size = 14 }) {
  const full = Math.round(value);
  return (
    <span className="stars" role="img" aria-label={`${value} out of 5 stars`}>
      {[0, 1, 2, 3, 4].map((i) => <Star key={i} size={size} strokeWidth={0} style={{ opacity: i < full ? 1 : 0.25 }} aria-hidden />)}
    </span>
  );
}
