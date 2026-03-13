import React, { useEffect, useState } from 'react'
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers'
import type { Supplier } from '../types'

export default function Suppliers() {
  const [list, setList] = useState<Supplier[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Supplier | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    SupplierName: '',
    ContactPerson: '',
    Email: '',
    Phone: '',
    Address: '',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await getSuppliers()
      setList(res.suppliers ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ SupplierName: '', ContactPerson: '', Email: '', Phone: '', Address: '' })
    setShowForm(true)
  }

  function openEdit(s: Supplier) {
    setEditing(s)
    setForm({
      SupplierName: s.SupplierName,
      ContactPerson: s.ContactPerson,
      Email: s.Email,
      Phone: s.Phone,
      Address: s.Address ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.SupplierName.trim() || !form.ContactPerson.trim() || !form.Email.trim() || form.Phone.length < 10) {
      setError('Name, contact person, email and phone (min 10) required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateSupplier(editing.SupplierID, form)
      } else {
        await createSupplier(form)
      }
      setShowForm(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(s: Supplier) {
    if (!window.confirm(`Delete supplier "${s.SupplierName}"?`)) return
    try {
      await deleteSupplier(s.SupplierID)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Suppliers</h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          Add supplier
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Edit supplier' : 'New supplier'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="form-group">
              <label>Supplier name</label>
              <input
                value={form.SupplierName}
                onChange={(e) => setForm((f) => ({ ...f, SupplierName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Contact person</label>
              <input
                value={form.ContactPerson}
                onChange={(e) => setForm((f) => ({ ...f, ContactPerson: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Email</label>
              <input
                type="email"
                value={form.Email}
                onChange={(e) => setForm((f) => ({ ...f, Email: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone</label>
              <input
                value={form.Phone}
                onChange={(e) => setForm((f) => ({ ...f, Phone: e.target.value }))}
                required
                minLength={10}
              />
            </div>
            <div className="form-group">
              <label>Address (optional)</label>
              <input
                value={form.Address}
                onChange={(e) => setForm((f) => ({ ...f, Address: e.target.value }))}
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
              <th>Contact</th>
              <th>Email</th>
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={s.SupplierID}>
                <td>{s.SupplierID}</td>
                <td>{s.SupplierName}</td>
                <td>{s.ContactPerson}</td>
                <td>{s.Email}</td>
                <td>{s.Phone}</td>
                <td>
                  <button type="button" onClick={() => openEdit(s)} className="text-teal-600 hover:underline mr-2">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(s)} className="text-red-600 hover:underline">
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
