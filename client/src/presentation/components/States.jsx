import React from 'react';
import { AlertTriangle } from 'lucide-react';

export function EmptyState({ icon: Icon, title, children, action }) {
  return (
    <div className="state">
      {Icon && <span className="state-icon"><Icon size={28} aria-hidden /></span>}
      <h3>{title}</h3>
      {children && <p>{children}</p>}
      {action}
    </div>
  );
}

export function ErrorState({ error, onRetry, title = 'Something went wrong' }) {
  return (
    <div className="state error" role="alert">
      <span className="state-icon"><AlertTriangle size={28} aria-hidden /></span>
      <h3>{title}</h3>
      <p>{error?.message || 'Please try again in a moment.'}</p>
      {onRetry && <button type="button" className="btn btn-primary" onClick={onRetry}>Try again</button>}
    </div>
  );
}

export function CardSkeletons({ count = 6 }) {
  return (
    <div className="course-grid" aria-busy="true" aria-label="Loading courses">
      {Array.from({ length: count }, (_, i) => (
        <div className="skel-card" key={i}>
          <div className="skeleton" />
          <div><div className="skeleton skel-line" style={{ width: '30%' }} /><div className="skeleton skel-line" style={{ width: '85%', height: 18 }} /><div className="skeleton skel-line" style={{ width: '55%' }} /></div>
        </div>
      ))}
    </div>
  );
}

export const Skeleton = ({ w = '100%', h = 16, r }) => <div className="skeleton" style={{ width: w, height: h, borderRadius: r }} aria-hidden />;

export const PageLoader = ({ label = 'Loading' }) => (
  <div className="loader-screen" role="status"><span className="spinner" style={{ width: 28, height: 28, borderWidth: 3 }} /><span className="sr-only">{label}</span></div>
);
