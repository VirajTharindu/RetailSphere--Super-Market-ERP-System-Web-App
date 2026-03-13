import React, { useEffect, useState } from 'react'
import { getCustomers, createCustomer, updateCustomer, deleteCustomer } from '../api/customers'
import type { Customer } from '../types'

function displayName(c: Customer) {
  return `${c.FirstName ?? c.fName ?? ''} ${c.LastName ?? c.lName ?? ''}`.trim() || '—'
}

function displayPhone(c: Customer) {
  return c.Phone ?? c.phone ?? '—'
}

export default function Customers() {
  const [list, setList] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Customer | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ fName: '', lName: '', phone: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await getCustomers()
      setList(res.customers ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({ fName: '', lName: '', phone: '' })
    setShowForm(true)
  }

  function openEdit(c: Customer) {
    setEditing(c)
    setForm({
      fName: c.FirstName ?? c.fName ?? '',
      lName: c.LastName ?? c.lName ?? '',
      phone: c.Phone ?? c.phone ?? '',
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.fName.trim() || !form.lName.trim() || !/^\d{10}$/.test(form.phone)) {
      setError('First name, last name and 10-digit phone required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateCustomer(editing.CustomerID, form)
      } else {
        await createCustomer(form)
      }
      setShowForm(false)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Request failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(c: Customer) {
    if (!window.confirm(`Delete customer ${displayName(c)}?`)) return
    try {
      await deleteCustomer(c.CustomerID)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Customers</h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          Add customer
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Edit customer' : 'New customer'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="form-group">
              <label>First name</label>
              <input
                value={form.fName}
                onChange={(e) => setForm((f) => ({ ...f, fName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Last name</label>
              <input
                value={form.lName}
                onChange={(e) => setForm((f) => ({ ...f, lName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Phone (10 digits)</label>
              <input
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                pattern="[0-9]{10}"
                maxLength={10}
                required
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
              <th>Phone</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((c) => (
              <tr key={c.CustomerID}>
                <td>{c.CustomerID}</td>
                <td>{displayName(c)}</td>
                <td>{displayPhone(c)}</td>
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
