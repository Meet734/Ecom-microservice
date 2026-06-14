'use client';

import { useEffect, useState } from 'react';
import { productApi } from '@/lib/api';
import useAuthStore from '@/store/authStore';
import Input from '@/components/Ui/Input';
import Button from '@/components/Ui/Button';
import Alert from '@/components/Ui/Alert';

const EMPTY_FORM = { name: '', description: '', parent_id: '' };

export default function CategoriesPage() {
  const { user } = useAuthStore();
  const isAdmin = user?.role === 'admin';

  const [categories, setCategories] = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');
  const [success,    setSuccess]    = useState('');
  const [showForm,   setShowForm]   = useState(false);
  const [form,       setForm]       = useState({ ...EMPTY_FORM });
  const [saving,     setSaving]     = useState(false);

  useEffect(() => { loadCategories(); }, []);

  const loadCategories = async () => {
    setLoading(true);
    try {
      const { data } = await productApi.getCategories();
      setCategories(data.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    if (error)   setError('');
    if (success) setSuccess('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');
    try {
      await productApi.createCategory({
        name:        form.name.trim(),
        description: form.description.trim() || undefined,
        parent_id:   form.parent_id || undefined,
      });
      setSuccess(`Category "${form.name}" created successfully.`);
      setForm({ ...EMPTY_FORM });
      setShowForm(false);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create category.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Deactivate category "${name}"? Products in this category won't be deleted.`)) return;
    try {
      await productApi.deleteCategory(id);
      setSuccess(`Category "${name}" deactivated.`);
      loadCategories();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to deactivate category.');
    }
  };

  // Group categories: parents first, then their children
  const parents  = categories.filter((c) => !c.parent_id);
  const childMap = categories.reduce((acc, c) => {
    if (c.parent_id) {
      acc[c.parent_id] = [...(acc[c.parent_id] || []), c];
    }
    return acc;
  }, {});

  return (
    <div className="max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Categories</h1>
          <p className="text-sm text-zinc-500 mt-1">
            Product taxonomy — all categories available to sellers when listing products.
            <span className="ml-2 text-[10px] text-zinc-400 font-mono">Product Service → GET /api/products/categories</span>
          </p>
        </div>
        {isAdmin && !showForm && (
          <Button onClick={() => setShowForm(true)}>+ New Category</Button>
        )}
      </div>

      {/* Role notice */}
      {!isAdmin && (
        <Alert type="info" message="Categories are managed by admins. You can browse them here." />
      )}

      {error   && <Alert type="error"   message={error}   onDismiss={() => setError('')}   />}
      {success && <Alert type="success" message={success} onDismiss={() => setSuccess('')} />}

      {/* Create form — admin only */}
      {isAdmin && showForm && (
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-6 space-y-4"
        >
          <h2 className="text-sm font-semibold text-zinc-900">New Category</h2>

          <Input
            id="cat_name"
            label="Name"
            required
            autoFocus
            placeholder="e.g. Running Shoes"
            value={form.name}
            onChange={handleChange('name')}
          />

          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat_desc" className="text-sm font-medium text-zinc-700">
              Description <span className="text-zinc-400 font-normal">(optional)</span>
            </label>
            <textarea
              id="cat_desc"
              rows={2}
              placeholder="Short description of this category..."
              value={form.description}
              onChange={handleChange('description')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 placeholder:text-zinc-400 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all resize-none"
            />
          </div>

          {/* Parent category selector — only top-level parents shown to avoid deep nesting */}
          <div className="flex flex-col gap-1.5">
            <label htmlFor="cat_parent" className="text-sm font-medium text-zinc-700">
              Parent Category <span className="text-zinc-400 font-normal">(optional — leave blank for top-level)</span>
            </label>
            <select
              id="cat_parent"
              value={form.parent_id}
              onChange={handleChange('parent_id')}
              className="w-full rounded-xl border border-zinc-200 bg-white px-4 py-2.5 text-sm text-zinc-900 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            >
              <option value="">— Top-level category —</option>
              {parents.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 pt-1">
            <Button type="button" variant="secondary" onClick={() => { setShowForm(false); setForm({ ...EMPTY_FORM }); }}>
              Cancel
            </Button>
            <Button type="submit" isLoading={saving} disabled={saving || !form.name.trim()}>
              Create Category
            </Button>
          </div>
        </form>
      )}

      {/* Category list */}
      {loading ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          Loading categories...
        </div>
      ) : categories.length === 0 ? (
        <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-sm text-zinc-400">
          No categories yet.
          {isAdmin && <> Click <strong>+ New Category</strong> to add one.</>}
        </div>
      ) : (
        <div className="space-y-3">
          {parents.map((parent) => (
            <div key={parent.id} className="rounded-xl border border-zinc-200 bg-white overflow-hidden">
              {/* Parent row */}
              <div className="flex items-center justify-between px-5 py-3.5 bg-zinc-50 border-b border-zinc-100">
                <div className="flex items-center gap-3">
                  <div className="h-2 w-2 rounded-full bg-indigo-500 shrink-0" />
                  <div>
                    <p className="text-sm font-semibold text-zinc-900">{parent.name}</p>
                    {parent.description && (
                      <p className="text-xs text-zinc-400 mt-0.5">{parent.description}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[10px] text-zinc-400 font-mono">{parent.slug}</span>
                  {(childMap[parent.id]?.length > 0) && (
                    <span className="text-[10px] text-zinc-500 bg-zinc-100 px-2 py-0.5 rounded-full">
                      {childMap[parent.id].length} sub
                    </span>
                  )}
                  {isAdmin && (
                    <button
                      onClick={() => handleDelete(parent.id, parent.name)}
                      className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-1"
                      title="Deactivate"
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              {/* Children */}
              {(childMap[parent.id] || []).map((child, idx) => (
                <div
                  key={child.id}
                  className={`flex items-center justify-between px-5 py-2.5 ${idx < (childMap[parent.id].length - 1) ? 'border-b border-zinc-50' : ''}`}
                >
                  <div className="flex items-center gap-3 ml-4">
                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-300 shrink-0" />
                    <div>
                      <p className="text-sm text-zinc-700">{child.name}</p>
                      {child.description && (
                        <p className="text-[11px] text-zinc-400">{child.description}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-zinc-400 font-mono">{child.slug}</span>
                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(child.id, child.name)}
                        className="text-xs text-zinc-400 hover:text-red-500 transition-colors px-1"
                        title="Deactivate"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Orphaned categories (no matching parent in active list) */}
          {categories.filter((c) => c.parent_id && !parents.find((p) => p.id === c.parent_id)).length > 0 && (
            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4">
              <p className="text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide">Uncategorised</p>
              {categories
                .filter((c) => c.parent_id && !parents.find((p) => p.id === c.parent_id))
                .map((c) => (
                  <div key={c.id} className="flex items-center justify-between py-1.5">
                    <p className="text-sm text-zinc-600">{c.name}</p>
                    <span className="text-[10px] text-zinc-400 font-mono">{c.slug}</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Stats footer */}
      {!loading && categories.length > 0 && (
        <p className="text-xs text-zinc-400 text-right">
          {parents.length} top-level · {categories.length - parents.length} subcategories · {categories.length} total
        </p>
      )}
    </div>
  );
}
