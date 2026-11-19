import React from 'react';

export default function PageHeader({ eyebrow, title, children, actions }) {
  return (
    <div className="page-head">
      <div>{eyebrow && <span className="eyebrow">{eyebrow}</span>}<h1>{title}</h1>{children && <p className="muted">{children}</p>}</div>
      {actions && <div className="page-actions">{actions}</div>}
    </div>
  );
}

export function StatCard({ icon: Icon, tone = 'blue', label, value, unit, note }) {
  return (
    <div className="stat-card">
      <span className={`stat-icon tone-${tone}`}><Icon size={22} aria-hidden /></span>
      <div><small>{label}</small><strong className="num">{value}{unit && <em>{unit}</em>}</strong>{note && <span className="stat-note">{note}</span>}</div>
    </div>
  );
}
