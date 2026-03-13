import { useEffect, useState } from 'react'
import { getStockBatches, issueStockByProduct, checkReorder } from '../api/stockbatch'
import type { StockBatch as StockBatchType } from '../types'

export default function StockBatch() {
  const [list, setList] = useState<StockBatchType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const [issueProductId, setIssueProductId] = useState('')
  const [issueQty, setIssueQty] = useState('')
  const [reorderProductId, setReorderProductId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const res = await getStockBatches()
      setList(res.batches ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>

  async function handleIssueStock(e: React.FormEvent) {
    e.preventDefault()
    if (!issueProductId || !issueQty) return
    setIsSubmitting(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await issueStockByProduct(Number(issueProductId), Number(issueQty))
      setSuccessMsg(res.message)
      setIssueProductId('')
      setIssueQty('')
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to issue stock')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleCheckReorder(e: React.FormEvent) {
    e.preventDefault()
    if (!reorderProductId) return
    setIsSubmitting(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await checkReorder(Number(reorderProductId))
      setSuccessMsg(`${res.message} Actions Taken: ${res.actionTaken}`)
      setReorderProductId('')
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to check reorder')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-slate-800">Stock Management</h1>
      </div>

      {error && <div className="p-4 bg-red-50 text-red-600 rounded whitespace-pre-wrap">{error}</div>}
      {successMsg && <div className="p-4 bg-emerald-50 text-emerald-700 rounded">{successMsg}</div>}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleIssueStock} className="card space-y-4">
          <h2 className="font-semibold text-slate-800">Directly Issue Stock</h2>
          <div className="flex gap-2">
            <input
              type="number"
              className="input flex-1"
              placeholder="Product ID"
              value={issueProductId}
              onChange={(e) => setIssueProductId(e.target.value)}
              required
            />
            <input
              type="number"
              className="input w-24"
              placeholder="Qty"
              value={issueQty}
              onChange={(e) => setIssueQty(e.target.value)}
              required
              min="1"
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary whitespace-nowrap">
              Issue
            </button>
          </div>
        </form>

        <form onSubmit={handleCheckReorder} className="card space-y-4">
          <h2 className="font-semibold text-slate-800">Manual Reorder Check</h2>
          <div className="flex gap-2">
            <input
              type="number"
              className="input flex-1"
              placeholder="Product ID"
              value={reorderProductId}
              onChange={(e) => setReorderProductId(e.target.value)}
              required
            />
            <button type="submit" disabled={isSubmitting} className="btn-secondary whitespace-nowrap">
              Check Reorder
            </button>
          </div>
        </form>
      </div>

      <div className="table-container shadow-sm border border-slate-200 mt-6 rounded-lg overflow-hidden bg-white">
        <table>
          <thead>
            <tr>
              <th>Batch ID</th>
              <th>Product ID</th>
              <th>PO Detail ID</th>
              <th>Cost</th>
              <th>Expiry</th>
              <th>Qty on hand</th>
            </tr>
          </thead>
          <tbody>
            {list.map((b) => (
              <tr key={b.StockBatchID ?? b.BatchID ?? b.ProductID}>
                <td>{b.StockBatchID ?? b.BatchID}</td>
                <td>{b.ProductID}</td>
                <td>{b.POrderDetailID}</td>
                <td>{b.CostPrice != null ? Number(b.CostPrice).toFixed(2) : '—'}</td>
                <td>{b.ExpiryDate ? new Date(b.ExpiryDate).toLocaleDateString() : '—'}</td>
                <td>{b.QuantityOnHand ?? b.QuantityRemaining ?? '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {list.length === 0 && <p className="text-slate-500 text-sm">No stock batches.</p>}
    </div>
  )
}
