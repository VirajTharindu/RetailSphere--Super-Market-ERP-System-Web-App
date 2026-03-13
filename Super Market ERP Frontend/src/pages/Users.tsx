import React, { useEffect, useState } from 'react'
import { listUsers, deleteUser } from '../api/auth'
import { register } from '../api/auth'
import type { User } from '../types'

export default function Users() {
  const [list, setList] = useState<User[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    username: '',
    password: '',
    fullName: '',
    userRole: 'Staff' as 'Admin' | 'Manager' | 'Staff',
  })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await listUsers()
      setList(res.users ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.username.trim() || !form.password || form.password.length < 6) {
      setError('Username and password (min 6) required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      await register({
        username: form.username,
        password: form.password,
        fullName: form.fullName || undefined,
        userRole: form.userRole,
      })
      setShowForm(false)
      setForm({ username: '', password: '', fullName: '', userRole: 'Staff' })
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Registration failed')
    } finally {
      setSubmitting(false)
    }
  }

  async function handleDelete(u: User) {
    const id = u.id ?? u.UserID
    if (id == null) return
    if (!window.confirm(`Delete user "${u.username ?? u.Username}"?`)) return
    try {
      await deleteUser(id)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Users</h1>
        <button type="button" onClick={() => { setShowForm(true); setError(''); }} className="btn-primary">
          Add user
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">New user</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="form-group">
              <label>Username</label>
              <input
                value={form.username}
                onChange={(e) => setForm((f) => ({ ...f, username: e.target.value }))}
                minLength={3}
                required
              />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
                minLength={6}
                required
              />
            </div>
            <div className="form-group">
              <label>Full name (optional)</label>
              <input
                value={form.fullName}
                onChange={(e) => setForm((f) => ({ ...f, fullName: e.target.value }))}
              />
            </div>
            <div className="form-group">
              <label>Role</label>
              <select
                value={form.userRole}
                onChange={(e) => setForm((f) => ({ ...f, userRole: e.target.value as 'Admin' | 'Manager' | 'Staff' }))}
              >
                <option value="Staff">Staff</option>
                <option value="Manager">Manager</option>
                <option value="Admin">Admin</option>
              </select>
            </div>
            <div className="flex gap-2">
              <button type="submit" disabled={submitting} className="btn-primary">
                {submitting ? 'Creating…' : 'Create'}
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
              <th>Username</th>
              <th>Full name</th>
              <th>Role</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {list.map((u) => {
              const id = u.id ?? u.UserID
              return (
                <tr key={id ?? 0}>
                  <td>{id}</td>
                  <td>{u.username ?? u.Username}</td>
                  <td>{u.fullName ?? u.FullName ?? '—'}</td>
                  <td>{u.role ?? u.UserRole}</td>
                  <td>
                    <button
                      type="button"
                      onClick={() => handleDelete(u)}
                      className="text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
