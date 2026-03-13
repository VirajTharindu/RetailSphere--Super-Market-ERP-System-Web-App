import React, { useEffect, useState } from 'react'
import { getCategories, createCategory, updateCategory, deleteCategory } from '../api/categories'
import type { Category } from '../types'

export default function Categories() {
  const [list, setList] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Category | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ CategoryName: '', Description: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await getCategories()
      setList(res.categories ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ CategoryName: '', Description: '' })
    setShowForm(true)
  }

  function openEdit(c: Category) {
    setEditing(c)
    setForm({ CategoryName: c.CategoryName, Description: c.Description ?? '' })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.CategoryName.trim()) return
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateCategory(editing.CategoryID, {
          CategoryName: form.CategoryName,
          Description: form.Description || undefined,
        })
      } else {
        await createCategory({
          CategoryName: form.CategoryName,
          Description: form.Description || undefined,
        })
      }
      setShowForm(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c: Category) {
    if (!window.confirm(`Delete category "${c.CategoryName}"?`)) return
    try {
      await deleteCategory(c.CategoryID)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Categories</h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          Add category
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Edit category' : 'New category'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.CategoryName}
                onChange={(e) => setForm((f) => ({ ...f, CategoryName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Description (optional)</label>
              <textarea
                value={form.Description}
                onChange={(e) => setForm((f) => ({ ...f, Description: e.target.value }))}
                rows={2}
              />
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Saving…' : 'Save'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Name</th>
              <th>Description</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.CategoryID}>
                <td>{c.CategoryID}</td>
                <td>{c.CategoryName}</td>
                <td>{c.Description ?? '—'}</td>
                <td>
                  <button type="button" onClick={() => openEdit(c)} className="text-teal-600 hover:underline mr-2">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(c)} className="text-red-600 hover:underline">
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
