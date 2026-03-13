import React, { useEffect, useState } from 'react'
import { getProducts, createProduct, updateProduct, deleteProduct } from '../api/products'
import { getCategories } from '../api/categories'
import type { Product, Category } from '../types'

export default function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState<Product | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ ProductName: '', CategoryID: 0, ReorderLevel: 10, UnitPrice: '' })
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const [pRes, cRes] = await Promise.all([getProducts(), getCategories()])
      setProducts(pRes.products ?? [])
      setCategories(cRes.categories ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function openCreate() {
    setEditing(null)
    setForm({
      ProductName: '',
      CategoryID: categories[0]?.CategoryID ?? 0,
      ReorderLevel: 10,
      UnitPrice: '',
    })
    setShowForm(true)
  }

  function openEdit(p: Product) {
    setEditing(p)
    setForm({
      ProductName: p.ProductName,
      CategoryID: p.CategoryID,
      ReorderLevel: p.ReorderLevel ?? 10,
      UnitPrice: String(p.UnitPrice ?? ''),
    })
    setShowForm(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const unitPrice = parseFloat(form.UnitPrice)
    if (!form.ProductName || form.CategoryID <= 0 || !Number.isFinite(unitPrice) || unitPrice <= 0) {
      setError('Product name, category and positive unit price required')
      return
    }
    setSubmitting(true)
    setError('')
    try {
      if (editing) {
        await updateProduct(editing.ProductID, {
          ProductName: form.ProductName,
          CategoryID: form.CategoryID,
          ReorderLevel: form.ReorderLevel,
          UnitPrice: unitPrice,
        })
      } else {
        await createProduct({
          ProductName: form.ProductName,
          CategoryID: form.CategoryID,
          ReorderLevel: form.ReorderLevel,
          UnitPrice: unitPrice,
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

  async function handleDelete(p: Product) {
    if (!window.confirm(`Delete product "${p.ProductName}"?`)) return
    try {
      await deleteProduct(p.ProductID)
      load()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Delete failed')
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Products</h1>
        <button type="button" onClick={openCreate} className="btn-primary">
          Add product
        </button>
      </div>
      {error && <div className="text-red-600 text-sm">{error}</div>}

      {showForm && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">{editing ? 'Edit product' : 'New product'}</h2>
          <form onSubmit={handleSubmit} className="space-y-4 max-w-md">
            <div className="form-group">
              <label>Name</label>
              <input
                value={form.ProductName}
                onChange={(e) => setForm((f) => ({ ...f, ProductName: e.target.value }))}
                required
              />
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={form.CategoryID}
                onChange={(e) => setForm((f) => ({ ...f, CategoryID: parseInt(e.target.value, 10) }))}
              >
                {categories.map((c) => (
                  <option key={c.CategoryID} value={c.CategoryID}>{c.CategoryName}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Reorder level</label>
              <input
                type="number"
                min={0}
                value={form.ReorderLevel}
                onChange={(e) => setForm((f) => ({ ...f, ReorderLevel: parseInt(e.target.value, 10) || 0 }))}
              />
            </div>
            <div className="form-group">
              <label>Unit price</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={form.UnitPrice}
                onChange={(e) => setForm((f) => ({ ...f, UnitPrice: e.target.value }))}
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
              <th>Category</th>
              <th>Reorder</th>
              <th>Unit price</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.ProductID}>
                <td>{p.ProductID}</td>
                <td>{p.ProductName}</td>
                <td>{categories.find((c) => c.CategoryID === p.CategoryID)?.CategoryName ?? p.CategoryID}</td>
                <td>{p.ReorderLevel ?? 0}</td>
                <td>{Number(p.UnitPrice).toFixed(2)}</td>
                <td>
                  <button type="button" onClick={() => openEdit(p)} className="text-teal-600 hover:underline mr-2">
                    Edit
                  </button>
                  <button type="button" onClick={() => handleDelete(p)} className="text-red-600 hover:underline">
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
