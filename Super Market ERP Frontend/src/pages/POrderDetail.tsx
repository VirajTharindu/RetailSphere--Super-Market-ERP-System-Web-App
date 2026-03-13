import { useEffect, useState } from 'react'
import { getPODetails } from '../api/porderDetail'
import type { POrderDetail as PODType } from '../types'

type Grouped = { PO_ID: number; PODetails: PODType[] }

export default function POrderDetail() {
  const [list, setList] = useState<Grouped[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    load()
  }, [])

  async function load() {
    try {
      const data = await getPODetails()
      setList(Array.isArray(data) ? data : [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <div className="text-slate-500">Loading…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Purchase Order Details</h1>
      <div className="space-y-4">
        {list.map((group) => (
          <div key={group.PO_ID} className="card">
            <h2 className="font-semibold text-slate-800 mb-3">PO #{group.PO_ID}</h2>
            <div className="table-container">
              <table>
                <thead>
                  <tr>
                    <th>Product ID</th>
                    <th>Supplier ID</th>
                    <th>Qty requested</th>
                    <th>Qty received</th>
                    <th>Status</th>
                    <th>Cost</th>
                    <th>Expiry</th>
                  </tr>
                </thead>
                <tbody>
                  {group.PODetails.map((pod, i) => (
                    <tr key={`${group.PO_ID}-${i}`}>
                      <td>{pod.ProductID}</td>
                      <td>{pod.SupplierID}</td>
                      <td>{pod.QuantityOrdered ?? pod.QuantityRequested ?? '—'}</td>
                      <td>{pod.QuantityReceived ?? '—'}</td>
                      <td>{pod.Status}</td>
                      <td>{pod.CostPriceofPOD != null ? Number(pod.CostPriceofPOD).toFixed(2) : '—'}</td>
                      <td>{pod.ExpiryDate ? new Date(pod.ExpiryDate).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
      {list.length === 0 && <p className="text-slate-500 text-sm">No PO details.</p>}
    </div>
  )
}
