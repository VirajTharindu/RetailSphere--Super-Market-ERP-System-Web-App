import { useEffect, useState } from 'react'
import { getPODetails, acceptPODetail, refusePODetail, acceptPurchaseOrder, refusePurchaseOrder } from '../api/porderDetail'
import { createStockBatch } from '../api/stockbatch'
import { getProducts } from '../api/products'
import type { POrderDetail as PODType, Product } from '../types'

type Grouped = { PO_ID: number; PODetails: PODType[] }

export default function POrderDetail() {
  const [list, setList] = useState<Grouped[]>([])
  const [products, setProducts] = useState<Record<number, Product>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Filter state
  const [statusFilter, setStatusFilter] = useState<'All' | 'Pending' | 'Received' | 'Added' | 'Refused'>('All')

  // Receive modal state
  const [receivingPod, setReceivingPod] = useState<PODType | null>(null)
  const [receiveQty, setReceiveQty] = useState<number>(0)
  const [receiveCost, setReceiveCost] = useState<string>('')
  const [receiveExpiry, setReceiveExpiry] = useState<string>('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  useEffect(() => {
    load()
  }, [])

  async function load() {
    setError('')
    try {
      const [data, prodRes] = await Promise.all([
        getPODetails(),
        getProducts().catch(() => ({ products: [] })),
      ])
      setList(Array.isArray(data) ? data : [])

      if (prodRes && Array.isArray(prodRes.products)) {
        const map: Record<number, Product> = {}
        prodRes.products.forEach((p) => {
          map[p.ProductID] = p
        })
        setProducts(map)
      }
    } catch (e: any) {
      setError(e instanceof Error ? e.message : 'Failed to load')
    } finally {
      setLoading(false)
    }
  }

  function openReceiveModal(pod: PODType) {
    setReceivingPod(pod)
    setReceiveQty(pod.QuantityRequested || pod.QuantityOrdered || 1)
    setReceiveCost(pod.CostPriceofPOD != null ? String(pod.CostPriceofPOD) : (pod.Product?.UnitPrice ? String(pod.Product.UnitPrice) : ''))
    setReceiveExpiry(pod.ExpiryDate ? pod.ExpiryDate.slice(0, 10) : '')
  }

  async function handleConfirmReceive(e: React.FormEvent) {
    e.preventDefault()
    if (!receivingPod || !receivingPod.PO_DetailID) return
    setActionLoadingId(receivingPod.PO_DetailID)
    setError('')
    setSuccessMsg('')
    try {
      await acceptPODetail(receivingPod.PO_DetailID, {
        QuantityReceived: Number(receiveQty),
        CostPriceofPOD: receiveCost ? Number(receiveCost) : undefined,
        ExpiryDate: receiveExpiry || null,
      })
      setSuccessMsg(`PO Detail #${receivingPod.PO_DetailID} accepted with ${receiveQty} units received!`)
      setReceivingPod(null)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept PO detail')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleQuickAccept(pod: PODType) {
    if (!pod.PO_DetailID) return
    setActionLoadingId(pod.PO_DetailID)
    setError('')
    setSuccessMsg('')
    try {
      const qty = pod.QuantityRequested || pod.QuantityOrdered || 1
      await acceptPODetail(pod.PO_DetailID, {
        QuantityReceived: qty,
        CostPriceofPOD: pod.CostPriceofPOD,
        ExpiryDate: pod.ExpiryDate,
      })
      setSuccessMsg(`PO Detail #${pod.PO_DetailID} accepted for full quantity (${qty} units)!`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept PO detail')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRefuse(pod: PODType) {
    if (!pod.PO_DetailID) return
    if (!confirm(`Are you sure you want to REFUSE PO Detail #${pod.PO_DetailID}?`)) return
    setActionLoadingId(pod.PO_DetailID)
    setError('')
    setSuccessMsg('')
    try {
      await refusePODetail(pod.PO_DetailID)
      setSuccessMsg(`PO Detail #${pod.PO_DetailID} has been refused.`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to refuse PO detail')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleAddToStock(pod: PODType) {
    if (!pod.PO_DetailID) return
    setActionLoadingId(pod.PO_DetailID)
    setError('')
    setSuccessMsg('')
    try {
      const res = await createStockBatch({ POrderDetailID: pod.PO_DetailID })
      const batchId = res.stockBatch?.BatchID ?? 'new'
      setSuccessMsg(`Stock Batch #${batchId} successfully added to inventory!`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to add stock batch')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleAcceptPO(poId: number) {
    if (!confirm(`Accept all line items in PO #${poId}?`)) return
    setError('')
    setSuccessMsg('')
    try {
      await acceptPurchaseOrder(poId)
      setSuccessMsg(`Entire PO #${poId} marked as accepted / received!`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept PO')
    }
  }

  async function handleRefusePO(poId: number) {
    if (!confirm(`Are you sure you want to refuse all pending items in PO #${poId}?`)) return
    setError('')
    setSuccessMsg('')
    try {
      await refusePurchaseOrder(poId)
      setSuccessMsg(`Entire PO #${poId} refused.`)
      await load()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to refuse PO')
    }
  }

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading purchase order details…</div>

  // Filter groups
  const filteredGroups = list.map((group) => {
    const matchingDetails = group.PODetails.filter((pod) => {
      if (statusFilter === 'All') return true
      if (statusFilter === 'Received') return pod.Status === 'Received' || pod.Status === 'PartiallyReceived'
      return pod.Status === statusFilter
    })
    return {
      ...group,
      matchingDetails,
    }
  }).filter((g) => g.matchingDetails.length > 0)

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Purchase Order Details & Receipt</h1>
          <p className="text-sm text-slate-500 mt-1">
            Accept supplier shipments, verify delivered quantities, refuse rejected items, and convert received POs into stock batches.
          </p>
        </div>
        <button
          onClick={load}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition self-start sm:self-auto"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Alerts */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-sm font-medium whitespace-pre-wrap">{error}</div>
          <button onClick={() => setError('')} className="text-rose-400 hover:text-rose-600 text-xs font-bold">✕</button>
        </div>
      )}
      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl flex items-start gap-3 shadow-sm">
          <svg className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <div className="flex-1 text-sm font-medium whitespace-pre-wrap">{successMsg}</div>
          <button onClick={() => setSuccessMsg('')} className="text-emerald-500 hover:text-emerald-700 text-xs font-bold">✕</button>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-auto w-fit">
        {(['All', 'Pending', 'Received', 'Added', 'Refused'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => setStatusFilter(tab)}
            className={`px-3 py-1.5 rounded-md transition ${
              statusFilter === tab
                ? 'bg-white text-slate-800 shadow-sm font-semibold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Grouped PO Cards */}
      <div className="space-y-6">
        {filteredGroups.map((group) => {
          const hasPending = group.PODetails.some((d) => d.Status === 'Pending')

          return (
            <div key={group.PO_ID} className="card p-5 border-slate-200 shadow-sm space-y-4">
              <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2 border-b border-slate-100 pb-3">
                <div className="flex items-center gap-3">
                  <span className="text-xl">📄</span>
                  <div>
                    <h2 className="text-lg font-bold text-slate-900">Purchase Order #{group.PO_ID}</h2>
                    <div className="text-xs text-slate-500">
                      {group.PODetails.length} line item{group.PODetails.length > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>

                {hasPending && (
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleAcceptPO(group.PO_ID)}
                      className="px-3 py-1 text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg transition"
                      title="Accept all pending line items in this PO"
                    >
                      Accept Entire PO
                    </button>
                    <button
                      type="button"
                      onClick={() => handleRefusePO(group.PO_ID)}
                      className="px-3 py-1 text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 rounded-lg transition"
                      title="Refuse all pending line items in this PO"
                    >
                      Refuse PO
                    </button>
                  </div>
                )}
              </div>

              <div className="table-container shadow-xs">
                <table>
                  <thead>
                    <tr>
                      <th>Line Item ID</th>
                      <th>Product</th>
                      <th>Supplier ID</th>
                      <th>Requested</th>
                      <th>Received</th>
                      <th>Cost Price</th>
                      <th>Expiry Date</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {group.matchingDetails.map((pod) => {
                      const prod = products[pod.ProductID]
                      const isPending = pod.Status === 'Pending'
                      const isReceived = pod.Status === 'Received' || pod.Status === 'PartiallyReceived'
                      const isAdded = pod.Status === 'Added'
                      const isRefused = pod.Status === 'Refused'
                      const isCancelled = pod.Status === 'Cancelled'
                      const isRowLoading = actionLoadingId === pod.PO_DetailID

                      return (
                        <tr key={pod.PO_DetailID ?? `${group.PO_ID}-${pod.ProductID}`}>
                          <td className="font-semibold text-slate-700">#{pod.PO_DetailID}</td>
                          <td>
                            <div className="font-medium text-slate-900">
                              {prod ? prod.ProductName : `Product #${pod.ProductID}`}
                            </div>
                            <div className="text-[11px] text-slate-500">ID: {pod.ProductID}</div>
                          </td>
                          <td className="text-slate-600">
                            {pod.SupplierID ? `Supplier #${pod.SupplierID}` : '—'}
                          </td>
                          <td className="font-semibold text-slate-800">
                            {pod.QuantityRequested ?? pod.QuantityOrdered ?? '—'}
                          </td>
                          <td className="font-semibold">
                            {pod.QuantityReceived != null ? (
                              <span className={pod.QuantityReceived > 0 ? 'text-emerald-700' : 'text-slate-400'}>
                                {pod.QuantityReceived}
                              </span>
                            ) : (
                              '—'
                            )}
                          </td>
                          <td>
                            {pod.CostPriceofPOD != null ? `$${Number(pod.CostPriceofPOD).toFixed(2)}` : '—'}
                          </td>
                          <td>
                            {pod.ExpiryDate ? (
                              <span className="text-slate-600">{new Date(pod.ExpiryDate).toLocaleDateString()}</span>
                            ) : (
                              <span className="text-slate-400 italic">None</span>
                            )}
                          </td>
                          <td>
                            {isPending && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-amber-100 text-amber-800 border border-amber-200">
                                Pending
                              </span>
                            )}
                            {isReceived && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-100 text-sky-800 border border-sky-200">
                                {pod.Status === 'PartiallyReceived' ? 'Partial' : 'Received'}
                              </span>
                            )}
                            {isAdded && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
                                ✓ Added to Stock
                              </span>
                            )}
                            {isRefused && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-rose-100 text-rose-800 border border-rose-200">
                                Refused
                              </span>
                            )}
                            {isCancelled && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                                Cancelled
                              </span>
                            )}
                          </td>
                          <td className="text-right">
                            {isPending && (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  type="button"
                                  disabled={isRowLoading}
                                  onClick={() => openReceiveModal(pod)}
                                  className="px-2.5 py-1 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded shadow-sm transition disabled:opacity-50"
                                  title="Enter specific received qty, cost, expiry"
                                >
                                  Accept
                                </button>
                                <button
                                  type="button"
                                  disabled={isRowLoading}
                                  onClick={() => handleQuickAccept(pod)}
                                  className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition disabled:opacity-50"
                                  title="Accept full requested quantity"
                                >
                                  Quick Full
                                </button>
                                <button
                                  type="button"
                                  disabled={isRowLoading}
                                  onClick={() => handleRefuse(pod)}
                                  className="px-2.5 py-1 text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-700 rounded border border-rose-200 transition disabled:opacity-50"
                                >
                                  Refuse
                                </button>
                              </div>
                            )}

                            {isReceived && (
                              <div className="flex items-center justify-end gap-2">
                                <button
                                  type="button"
                                  disabled={isRowLoading}
                                  onClick={() => handleAddToStock(pod)}
                                  className="px-3 py-1 text-xs font-bold bg-teal-600 hover:bg-teal-700 text-white rounded shadow-sm transition disabled:opacity-50 flex items-center gap-1"
                                >
                                  <span>+ Add to Stock</span>
                                </button>
                                <button
                                  type="button"
                                  disabled={isRowLoading}
                                  onClick={() => openReceiveModal(pod)}
                                  className="px-2 py-1 text-xs text-slate-600 hover:text-slate-900 border border-slate-200 rounded"
                                >
                                  Edit
                                </button>
                              </div>
                            )}

                            {isAdded && (
                              <span className="text-xs text-emerald-600 font-medium italic">Active in Inventory</span>
                            )}

                            {(isRefused || isCancelled) && (
                              <span className="text-xs text-slate-400 italic">No action</span>
                            )}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )
        })}
      </div>

      {filteredGroups.length === 0 && (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-xl text-slate-500">
          No purchase orders found matching the filter "{statusFilter}".
        </div>
      )}

      {/* RECEIVE / ACCEPT MODAL */}
      {receivingPod && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in duration-150">
            <div className="flex justify-between items-start border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900">
                  Accept Delivery / Receive Stock
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  PO #{receivingPod.PO_ID} — Item Line #{receivingPod.PO_DetailID}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceivingPod(null)}
                className="text-slate-400 hover:text-slate-600 text-lg leading-none"
              >
                ✕
              </button>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm space-y-1">
              <div className="font-semibold text-slate-800">
                {products[receivingPod.ProductID]?.ProductName || `Product ID: ${receivingPod.ProductID}`}
              </div>
              <div className="text-xs text-slate-600">
                Quantity Requested from Supplier:{' '}
                <span className="font-bold text-slate-800">
                  {receivingPod.QuantityRequested ?? receivingPod.QuantityOrdered} units
                </span>
              </div>
            </div>

            <form onSubmit={handleConfirmReceive} className="space-y-4">
              <div className="form-group">
                <label className="text-xs font-semibold text-slate-700">
                  Quantity Received <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  max={receivingPod.QuantityRequested ?? receivingPod.QuantityOrdered}
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={receiveQty}
                  onChange={(e) => setReceiveQty(Number(e.target.value))}
                  required
                />
                <span className="text-[11px] text-slate-500">
                  Cannot exceed requested quantity ({receivingPod.QuantityRequested ?? receivingPod.QuantityOrdered}).
                </span>
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-slate-700">Cost Price per Unit ($)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g. 15.50"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={receiveCost}
                  onChange={(e) => setReceiveCost(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label className="text-xs font-semibold text-slate-700">Batch Expiry Date (Optional)</label>
                <input
                  type="date"
                  className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-teal-500 focus:outline-none"
                  value={receiveExpiry}
                  onChange={(e) => setReceiveExpiry(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceivingPod(null)}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={actionLoadingId === receivingPod.PO_DetailID}
                  className="btn-primary text-sm font-semibold"
                >
                  {actionLoadingId === receivingPod.PO_DetailID ? 'Confirming…' : 'Confirm Receipt'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

