import React, { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../api/auth'

export default function Profile() {
  const { user } = useAuth()
  const [username, setUsername] = useState(user?.username || '')
  const [fullName, setFullName] = useState(user?.fullName || '')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    try {
      const payload: { username?: string; fullName?: string; password?: string } = {}
      if (username !== user?.username) payload.username = username
      if (fullName !== user?.fullName) payload.fullName = fullName
      if (password) payload.password = password

      if (Object.keys(payload).length === 0) {
        setSuccess('No changes to update.')
        setLoading(false)
        return
      }

      const res = await updateProfile(payload)
      setSuccess(res.message || 'Profile updated successfully! Next time you sign in, your changes will take full effect.')
      setPassword('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to update profile')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg mx-auto mt-6">
      <h1 className="text-2xl font-bold text-slate-800 mb-6">My Profile</h1>
      
      {error && <div className="p-4 bg-red-50 text-red-600 rounded mb-4 whitespace-pre-wrap">{error}</div>}
      {success && <div className="p-4 bg-emerald-50 text-emerald-700 rounded mb-4">{success}</div>}

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
          <input
            type="text"
            className="input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
          <input
            type="text"
            className="input"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
        <hr className="border-slate-200 my-4" />
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">New Password</label>
          <input
            type="password"
            className="input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Leave blank to keep unchanged"
            minLength={6}
          />
          <p className="text-xs text-slate-500 mt-1">
            If you change your password, you will use it next time you sign in.
          </p>
        </div>

        <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  )
}
