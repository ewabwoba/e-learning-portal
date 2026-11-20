import React, { useState } from 'react';
import { ScrollText } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';

const when = (d) => new Date(d).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
const SENSITIVE = ['ROLE_CHANGED', 'USER_DELETED', 'USER_SUSPENDED', 'COURSE_DELETED', 'COURSE_UNPUBLISH'];
const nice = (a) => a.toLowerCase().replace(/_/g, ' ').replace(/^./, (c) => c.toUpperCase());

export default function AdminAudit() {
  useDocumentTitle('Audit log · Admin');
  const repo = useRepo();
  const { data, loading, error, reload } = useAsync(() => repo.admin.audit(), [repo]);
  const [only, setOnly] = useState(false);
  const rows = (data || []).filter((a) => !only || SENSITIVE.includes(a.action));
  return (
    <>
      <PageHeader eyebrow="Administration" title="Audit log" actions={<label className="check-inline"><input type="checkbox" checked={only} onChange={(e) => setOnly(e.target.checked)} /> Sensitive actions only</label>}>A permanent record of what admins and instructors changed. Entries cannot be edited.</PageHeader>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2, 3].map((i) => <div key={i} style={{ padding: 18 }}><Skeleton h={28} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && rows.length === 0 && <EmptyState icon={ScrollText} title="Nothing logged yet">Administrative actions will be recorded here.</EmptyState>}
      {!loading && !error && rows.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>When</th><th>Who</th><th>Action</th><th>Details</th></tr></thead>
            <tbody>
              {rows.map((a) => (
                <tr key={a.id}>
                  <td className="cell-first num">{when(a.createdAt)}</td>
                  <td data-label="Who">{a.actor}</td>
                  <td data-label="Action"><span className={`pill ${SENSITIVE.includes(a.action) ? 'pill-orange' : 'pill-grey'}`}>{nice(a.action)}</span></td>
                  <td data-label="Details" className="detail">{a.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
