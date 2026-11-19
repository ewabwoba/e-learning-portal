import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowDown, ArrowUp, ChevronLeft, Plus, Save, Trash2 } from 'lucide-react';
import { useRepo } from '../../../application/DataContext';
import { useAsync } from '../../../application/useAsync';
import { useToast } from '../../../application/ToastContext';
import { useDocumentTitle } from '../../../application/useDocumentTitle';
import PageHeader from '../../components/PageHeader';
import { Field } from '../../components/Field';
import { ErrorState, Skeleton } from '../../components/States';
import { CATEGORIES, LEVELS, validateCourseDraft, formatDuration, curriculumStats } from '../../../domain/course';

const blank = { title: '', category: '', level: 'Beginner', description: '', price: '', originalPrice: '', imageUrl: '', status: 'DRAFT', modules: [{ title: 'Introduction', lessons: [{ title: '', type: 'VIDEO', durationMinutes: 10, content: '' }] }] };
const move = (arr, i, d) => { const j = i + d; if (j < 0 || j >= arr.length) return arr; const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]; return c; };

export default function CourseEditor() {
  const { id } = useParams();
  const isNew = !id;
  useDocumentTitle(isNew ? 'New course' : 'Edit course');
  const repo = useRepo();
  const nav = useNavigate();
  const toast = useToast();
  const loaded = useAsync(() => (isNew ? Promise.resolve(blank) : repo.instructor.course(id)), [repo, id]);
  const [draft, setDraft] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  useEffect(() => { if (loaded.data) setDraft(structuredClone(loaded.data)); }, [loaded.data]);

  if (loaded.loading || (!draft && !loaded.error)) return <><Skeleton w="30%" h={30} /><div style={{ height: 20 }} /><Skeleton h={360} r={14} /></>;
  if (loaded.error) return <ErrorState error={loaded.error} onRetry={loaded.reload} title="We could not open this course" />;

  const set = (k) => (e) => setDraft((d) => ({ ...d, [k]: e.target.value }));
  const setModule = (mi, patch) => setDraft((d) => ({ ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, ...patch } : m)) }));
  const setLesson = (mi, li, patch) => setDraft((d) => ({ ...d, modules: d.modules.map((m, i) => (i === mi ? { ...m, lessons: m.lessons.map((l, j) => (j === li ? { ...l, ...patch } : l)) } : m)) }));
  const stats = curriculumStats(draft.modules);

  const save = async (e) => {
    e.preventDefault();
    const v = validateCourseDraft(draft);
    setErrors(v);
    if (Object.keys(v).length) { toast.error('Please fix the highlighted fields.'); document.querySelector('[aria-invalid="true"]')?.focus(); return; }
    setSaving(true);
    try {
      const saved = await repo.instructor.save(draft);
      toast.success(isNew ? 'Course created as a draft.' : 'Changes saved.');
      if (isNew) nav(`/app/teach/courses/${saved.id}`, { replace: true }); else { setDraft(structuredClone(saved)); }
    } catch (err) { toast.error(err.message); setErrors(err.fields || {}); } finally { setSaving(false); }
  };

  return (
    <form onSubmit={save} noValidate className="editor">
      <Link to="/app/teach/courses" className="back-link"><ChevronLeft size={16} aria-hidden /> My courses</Link>
      <PageHeader eyebrow={isNew ? 'New course' : draft.status === 'PUBLISHED' ? 'Published course' : 'Draft course'} title={isNew ? 'Create a course' : draft.title || 'Edit course'}
        actions={<button className="btn btn-primary" disabled={saving}>{saving ? <><span className="spinner" aria-hidden /> Saving…</> : <><Save size={17} aria-hidden /> {isNew ? 'Create draft' : 'Save changes'}</>}</button>}>
        {isNew ? 'Start with the basics. You can add lessons now or later.' : 'Update your course details and curriculum.'}
      </PageHeader>

      <section className="panel editor-section" aria-labelledby="e-basics">
        <h2 id="e-basics">Course basics</h2>
        <Field label="Title" value={draft.title} onChange={set('title')} error={errors.title} maxLength={120} placeholder="e.g. Landscape Photography: Capture Beautiful Scenes" />
        <div className="grid-2">
          <Field as="select" label="Category" value={draft.category} onChange={set('category')} error={errors.category}><option value="">Choose a category</option>{CATEGORIES.map((c) => <option key={c}>{c}</option>)}</Field>
          <Field as="select" label="Level" value={draft.level} onChange={set('level')}>{LEVELS.map((c) => <option key={c}>{c}</option>)}</Field>
        </div>
        <Field as="textarea" label="Description" value={draft.description} onChange={set('description')} error={errors.description} hint="What will learners be able to do after this course?" maxLength={1000} />
        <Field label="Cover image URL" type="url" value={draft.imageUrl || ''} onChange={set('imageUrl')} hint="Optional. A clean illustration is shown if you leave this empty." placeholder="https://" />
      </section>

      <section className="panel editor-section" aria-labelledby="e-price">
        <h2 id="e-price">Pricing</h2>
        <div className="grid-2">
          <Field label="Price (USD)" type="number" min="0" step="0.01" inputMode="decimal" value={draft.price} onChange={set('price')} error={errors.price} hint="Enter 0 for a free course." />
          <Field label="Original price (optional)" type="number" min="0" step="0.01" inputMode="decimal" value={draft.originalPrice ?? ''} onChange={set('originalPrice')} error={errors.originalPrice} hint="Shown struck through to highlight a discount." />
        </div>
      </section>

      <section className="panel editor-section" aria-labelledby="e-cur">
        <div className="panel-head"><div><h2 id="e-cur">Curriculum</h2><p className="muted">{stats.modules} modules · {stats.lessons} lessons · {formatDuration(stats.minutes)}</p></div>
          <button type="button" className="btn btn-outline btn-sm" onClick={() => setDraft((d) => ({ ...d, modules: [...d.modules, { title: '', lessons: [] }] }))}><Plus size={16} aria-hidden /> Add module</button></div>
        {draft.modules.length === 0 && <p className="muted pad">No modules yet. Add one to start building your curriculum.</p>}
        {draft.modules.map((m, mi) => (
          <fieldset className="module" key={m.id || `n${mi}`}>
            <legend className="sr-only">Module {mi + 1}</legend>
            <div className="module-head">
              <span className="module-no">{mi + 1}</span>
              <input className="input" aria-label={`Module ${mi + 1} title`} placeholder="Module title" value={m.title} onChange={(e) => setModule(mi, { title: e.target.value })} />
              <button type="button" className="icon-btn" aria-label="Move module up" disabled={mi === 0} onClick={() => setDraft((d) => ({ ...d, modules: move(d.modules, mi, -1) }))}><ArrowUp size={16} /></button>
              <button type="button" className="icon-btn" aria-label="Move module down" disabled={mi === draft.modules.length - 1} onClick={() => setDraft((d) => ({ ...d, modules: move(d.modules, mi, 1) }))}><ArrowDown size={16} /></button>
              <button type="button" className="icon-btn danger" aria-label={`Delete module ${mi + 1}`} onClick={() => setDraft((d) => ({ ...d, modules: d.modules.filter((_, i) => i !== mi) }))}><Trash2 size={16} /></button>
            </div>
            <ul className="lesson-rows">
              {m.lessons.map((l, li) => (
                <li key={l.id || `n${li}`}>
                  <input className="input" aria-label={`Module ${mi + 1} lesson ${li + 1} title`} placeholder="Lesson title" value={l.title} onChange={(e) => setLesson(mi, li, { title: e.target.value })} />
                  <select className="select" aria-label="Lesson type" value={l.type} onChange={(e) => setLesson(mi, li, { type: e.target.value })}><option value="VIDEO">Video</option><option value="READING">Reading</option></select>
                  <div className="mins"><input className="input" type="number" min="0" aria-label="Duration in minutes" value={l.durationMinutes} onChange={(e) => setLesson(mi, li, { durationMinutes: e.target.value })} /><span>min</span></div>
                  <button type="button" className="icon-btn" aria-label="Move lesson up" disabled={li === 0} onClick={() => setModule(mi, { lessons: move(m.lessons, li, -1) })}><ArrowUp size={16} /></button>
                  <button type="button" className="icon-btn" aria-label="Move lesson down" disabled={li === m.lessons.length - 1} onClick={() => setModule(mi, { lessons: move(m.lessons, li, 1) })}><ArrowDown size={16} /></button>
                  <button type="button" className="icon-btn danger" aria-label="Delete lesson" onClick={() => setModule(mi, { lessons: m.lessons.filter((_, j) => j !== li) })}><Trash2 size={16} /></button>
                </li>
              ))}
            </ul>
            <button type="button" className="text-link add-lesson" onClick={() => setModule(mi, { lessons: [...m.lessons, { title: '', type: 'VIDEO', durationMinutes: 10, content: '' }] })}><Plus size={15} aria-hidden /> Add lesson</button>
          </fieldset>
        ))}
      </section>

      <div className="editor-foot">
        <p className="muted">{isNew ? 'New courses are saved as drafts. Publish from My courses when you are ready.' : 'Publish or unpublish from My courses.'}</p>
        <button className="btn btn-primary" disabled={saving}>{saving ? 'Saving…' : isNew ? 'Create draft' : 'Save changes'}</button>
      </div>
    </form>
  );
}
