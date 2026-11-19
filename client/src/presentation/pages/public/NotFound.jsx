import React from 'react';
import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';
import { EmptyState } from '../../components/States';
import { useDocumentTitle } from '../../../application/useDocumentTitle';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container" style={{ padding: '72px 0' }}>
      <EmptyState icon={Compass} title="We could not find that page" action={<Link to="/" className="btn btn-primary">Back to home</Link>}>
        The link may be broken or the page may have moved.
      </EmptyState>
    </div>
  );
}
