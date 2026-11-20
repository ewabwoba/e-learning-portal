import React, { useState } from 'react';
import { Pencil, Plus, Tags, Trash2 } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import Dialog, { ConfirmDialog } from '../../components/Dialog';
import { Field } from '../../components/Field';
import { EmptyState, ErrorState, Skeleton } from '../../components/States';

function NameDialog({ title, initial = '', label = 'Category name', submitLabel, onSubmit, onClose }) {
  const [name, setName] = useState(initial);
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const go = async (e) => {
    e.preventDefault();
    if (!name.trim()) { setErr('Enter a name.'); return; }
    setBusy(true);
    try { await onSubmit(name.trim()); onClose(); } catch (x) { setErr(x.message); setBusy(false); }
  };
  return (
    <Dialog title={title} onClose={onClose}>
      <form onSubmit={go} noValidate className="dialog-form">
        <Field label={label} value={name} onChange={(e) => setName(e.target.value)} error={err} maxLength={60} />
        <div className="dialog-actions"><button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button><button className="btn btn-primary" disabled={busy}>{busy ? 'Saving…' : submitLabel}</button></div>
      </form>
    </Dialog>
  );
}

export default function AdminCategories() {
  useDocumentTitle('Categories · Admin');
  const repo = useRepo();
  const toast = useToast();
  const { data, loading, error, reload } = useAsync(() => repo.admin.categories(), [repo]);
  const [dlg, setDlg] = useState(null);
  return (
    <>
      <PageHeader eyebrow="Administration" title="Categories" actions={<button type="button" className="btn btn-primary" onClick={() => setDlg({ kind: 'NEW' })}><Plus size={17} aria-hidden /> New category</button>}>Instructors choose from this list when they create a course. Renaming updates every course in the category.</PageHeader>
      {loading && <div className="table-wrap" aria-busy="true">{[0, 1, 2].map((i) => <div key={i} style={{ padding: 18 }}><Skeleton h={30} /></div>)}</div>}
      {error && <ErrorState error={error} onRetry={reload} />}
      {!loading && !error && data.length === 0 && <EmptyState icon={Tags} title="No categories yet" action={<button type="button" className="btn btn-primary" onClick={() => setDlg({ kind: 'NEW' })}>Add a category</button>}>Add at least one so instructors can publish courses.</EmptyState>}
      {!loading && !error && data.length > 0 && (
        <div className="table-wrap">
          <table className="table responsive">
            <thead><tr><th>Category</th><th>Courses</th><th><span className="sr-only">Actions</span></th></tr></thead>
            <tbody>
              {data.map((c) => (
                <tr key={c.id}>
                  <td className="cell-first"><b>{c.name}</b></td>
                  <td data-label="Courses" className="num">{c.courses}</td>
                  <td className="actions">
                    <button type="button" className="btn btn-ghost btn-sm" onClick={() => setDlg({ kind: 'RENAME', c })}><Pencil size={14} aria-hidden /> Rename</button>
                    <button type="button" className="icon-btn danger" aria-label={`Delete ${c.name}`} onClick={() => setDlg({ kind: 'DELETE', c })}><Trash2 size={15} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {dlg?.kind === 'NEW' && <NameDialog title="New category" submitLabel="Add category" onSubmit={async (n) => { await repo.admin.createCategory(n); toast.success('Category added.'); reload(); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'RENAME' && <NameDialog title="Rename category" initial={dlg.c.name} submitLabel="Save" onSubmit={async (n) => { await repo.admin.renameCategory(dlg.c.id, n); toast.success('Category renamed.'); reload(); }} onClose={() => setDlg(null)} />}
      {dlg?.kind === 'DELETE' && <ConfirmDialog title="Delete category?" message={dlg.c.courses ? `${dlg.c.courses} course(s) still use “${dlg.c.name}”. Move or rename them first.` : `“${dlg.c.name}” will be removed.`} confirmLabel="Delete" danger onConfirm={async () => { await repo.admin.deleteCategory(dlg.c.id); toast.success('Category deleted.'); reload(); }} onClose={() => setDlg(null)} />}
    </>
  );
}
