import { useEffect, useState } from 'react'
import { getStockBatches, issueStockByProduct, checkReorder, createStockBatch } from '../api/stockbatch'
import { getPODetails, acceptPODetail, refusePODetail } from '../api/porderDetail'
import { getProducts } from '../api/products'
import type { StockBatch as StockBatchType, POrderDetail as PODType, Product } from '../types'

export default function StockBatch() {
  const [list, setList] = useState<StockBatchType[]>([])
  const [poList, setPoList] = useState<PODType[]>([])
  const [products, setProducts] = useState<Record<number, Product>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  // Form states
  const [issueProductId, setIssueProductId] = useState('')
  const [issueQty, setIssueQty] = useState('')
  const [reorderProductId, setReorderProductId] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Filter state for PO items
  const [poFilter, setPoFilter] = useState<'All' | 'Pending' | 'Received' | 'Added' | 'Refused'>('All')

  // Modal state for receiving PO detail
  const [receivingPod, setReceivingPod] = useState<PODType | null>(null)
  const [receiveQty, setReceiveQty] = useState<number>(0)
  const [receiveCost, setReceiveCost] = useState<string>('')
  const [receiveExpiry, setReceiveExpiry] = useState<string>('')
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null)

  useEffect(() => {
    loadAll()
  }, [])

  async function loadAll() {
    setError('')
    try {
      const [batchRes, podRes, prodRes] = await Promise.all([
        getStockBatches().catch(() => ({ batches: [] })),
        getPODetails().catch(() => []),
        getProducts().catch(() => ({ products: [] })),
      ])

      setList(batchRes.batches ?? [])

      // Flatten grouped PO details
      const allPods: PODType[] = []
      if (Array.isArray(podRes)) {
        podRes.forEach((group: any) => {
          if (Array.isArray(group.PODetails)) {
            allPods.push(...group.PODetails)
          }
        })
      }
      setPoList(allPods)

      if (prodRes && Array.isArray(prodRes.products)) {
        const map: Record<number, Product> = {}
        prodRes.products.forEach((p) => {
          map[p.ProductID] = p
        })
        setProducts(map)
      }
    } catch (e: any) {
      setError(e.message || 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  async function handleIssueStock(e: React.FormEvent) {
    e.preventDefault()
    if (!issueProductId || !issueQty) return
    setIsSubmitting(true)
    setError('')
    setSuccessMsg('')
    try {
      const res = await issueStockByProduct(Number(issueProductId), Number(issueQty))
      setSuccessMsg(res.message || 'Stock issued successfully')
      setIssueProductId('')
      setIssueQty('')
      await loadAll()
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
      setSuccessMsg(`${res.message} Actions: ${res.actionTaken || 'Reorder generated'}`)
      setReorderProductId('')
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to check reorder')
    } finally {
      setIsSubmitting(false)
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
      setSuccessMsg(`PO Line #${receivingPod.PO_DetailID} successfully accepted with ${receiveQty} units received!`)
      setReceivingPod(null)
      await loadAll()
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
      setSuccessMsg(`PO Line #${pod.PO_DetailID} accepted for full requested quantity (${qty} units)!`)
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to accept PO detail')
    } finally {
      setActionLoadingId(null)
    }
  }

  async function handleRefuse(pod: PODType) {
    if (!pod.PO_DetailID) return
    if (!confirm(`Are you sure you want to REFUSE PO Line #${pod.PO_DetailID}?`)) return
    setActionLoadingId(pod.PO_DetailID)
    setError('')
    setSuccessMsg('')
    try {
      await refusePODetail(pod.PO_DetailID)
      setSuccessMsg(`PO Line #${pod.PO_DetailID} has been refused.`)
      await loadAll()
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
      setSuccessMsg(`Stock batch #${batchId} successfully created into inventory with ${pod.QuantityReceived ?? pod.QuantityRequested} units!`)
      await loadAll()
    } catch (err: any) {
      setError(err.response?.data?.error || err.response?.data?.message || err.message || 'Failed to add stock batch')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredPods = poList.filter((pod) => {
    if (poFilter === 'All') return true
    if (poFilter === 'Received') return pod.Status === 'Received' || pod.Status === 'PartiallyReceived'
    return pod.Status === poFilter
  })

  const pendingCount = poList.filter((p) => p.Status === 'Pending').length
  const receivedCount = poList.filter((p) => p.Status === 'Received' || p.Status === 'PartiallyReceived').length

  if (loading) return <div className="p-6 text-slate-500 font-medium">Loading stock management data…</div>

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 border-b border-slate-200 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Stock Management & Receiving</h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor inventory, process incoming supplier deliveries, accept/refuse POs, and issue stock.
          </p>
        </div>
        <button
          onClick={loadAll}
          className="inline-flex items-center gap-2 px-3 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 shadow-sm transition"
        >
          <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh Data
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

      {/* Quick Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">Live Stock Batches</div>
            <div className="text-2xl font-bold text-slate-800 mt-1">{list.length}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-teal-50 text-teal-600 flex items-center justify-center font-bold">
            📦
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-amber-600">POs Awaiting Acceptance</div>
            <div className="text-2xl font-bold text-amber-700 mt-1">{pendingCount}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            ⏳
          </div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm flex items-center justify-between">
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-600">Ready to Add to Stock</div>
            <div className="text-2xl font-bold text-blue-700 mt-1">{receivedCount}</div>
          </div>
          <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            📥
          </div>
        </div>
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <form onSubmit={handleIssueStock} className="card space-y-4 border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">📤</span>
            <h2 className="font-semibold text-slate-800 text-base">Directly Issue Stock</h2>
          </div>
          <p className="text-xs text-slate-500">Reduce stock for sales, damage, or internal requisition directly by Product ID.</p>
          <div className="flex gap-2 pt-1">
            <input
              type="number"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Product ID"
              value={issueProductId}
              onChange={(e) => setIssueProductId(e.target.value)}
              required
            />
            <input
              type="number"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm w-24 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Qty"
              value={issueQty}
              onChange={(e) => setIssueQty(e.target.value)}
              required
              min="1"
            />
            <button type="submit" disabled={isSubmitting} className="btn-primary whitespace-nowrap text-sm">
              {isSubmitting ? 'Issuing…' : 'Issue Stock'}
            </button>
          </div>
        </form>

        <form onSubmit={handleCheckReorder} className="card space-y-4 border-slate-200 shadow-sm">
          <div className="flex items-center gap-2">
            <span className="text-lg">🔄</span>
            <h2 className="font-semibold text-slate-800 text-base">Manual Reorder Check</h2>
          </div>
          <p className="text-xs text-slate-500">Inspect product inventory level against threshold and generate Purchase Order if low.</p>
          <div className="flex gap-2 pt-1">
            <input
              type="number"
              className="border border-slate-300 rounded-lg px-3 py-2 text-sm flex-1 focus:ring-2 focus:ring-teal-500 focus:outline-none"
              placeholder="Product ID"
              value={reorderProductId}
              onChange={(e) => setReorderProductId(e.target.value)}
              required
            />
            <button type="submit" disabled={isSubmitting} className="btn-secondary whitespace-nowrap text-sm font-medium">
              {isSubmitting ? 'Checking…' : 'Check Reorder'}
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 1: INCOMING PURCHASE ORDERS & STOCK-IN VERIFICATION */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-slate-800">Incoming Purchase Orders (Stock In)</h2>
              {pendingCount > 0 && (
                <span className="bg-amber-100 text-amber-800 text-xs px-2.5 py-0.5 rounded-full font-semibold">
                  {pendingCount} Pending Action
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Review, accept deliveries, specify received quantities, or refuse incoming purchase orders.
            </p>
          </div>

          {/* Filter tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 text-xs font-medium self-start sm:self-auto">
            {(['All', 'Pending', 'Received', 'Added', 'Refused'] as const).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPoFilter(tab)}
                className={`px-3 py-1.5 rounded-md transition ${
                  poFilter === tab
                    ? 'bg-white text-slate-800 shadow-sm font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tab}
                {tab === 'Pending' && pendingCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-amber-500 text-white rounded-full text-[10px]">
                    {pendingCount}
                  </span>
                )}
                {tab === 'Received' && receivedCount > 0 && (
                  <span className="ml-1.5 px-1.5 py-0.2 bg-blue-500 text-white rounded-full text-[10px]">
                    {receivedCount}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="table-container shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table>
            <thead>
              <tr>
                <th>PO # / Line</th>
                <th>Product</th>
                <th>Requested</th>
                <th>Received</th>
                <th>Cost</th>
                <th>Expiry</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredPods.map((pod) => {
                const prod = products[pod.ProductID]
                const isPending = pod.Status === 'Pending'
                const isReceived = pod.Status === 'Received' || pod.Status === 'PartiallyReceived'
                const isAdded = pod.Status === 'Added'
                const isRefused = pod.Status === 'Refused'
                const isCancelled = pod.Status === 'Cancelled'
                const isRowLoading = actionLoadingId === pod.PO_DetailID

                return (
                  <tr key={pod.PO_DetailID ?? `${pod.PO_ID}-${pod.ProductID}`}>
                    <td className="font-semibold text-slate-800">
                      <div>PO #{pod.PO_ID}</div>
                      <div className="text-[11px] text-slate-400 font-normal">Item #{pod.PO_DetailID}</div>
                    </td>
                    <td>
                      <div className="font-medium text-slate-800">
                        {prod ? prod.ProductName : `Product #${pod.ProductID}`}
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {pod.ProductID}</div>
                    </td>
                    <td className="font-semibold text-slate-700">
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
                    <td>{pod.CostPriceofPOD != null ? `$${Number(pod.CostPriceofPOD).toFixed(2)}` : '—'}</td>
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
                            title="Open detailed receipt modal"
                          >
                            Accept
                          </button>
                          <button
                            type="button"
                            disabled={isRowLoading}
                            onClick={() => handleQuickAccept(pod)}
                            className="px-2 py-1 text-xs font-medium bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 transition disabled:opacity-50"
                            title="Accept full requested quantity with 1 click"
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
        {filteredPods.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            No incoming PO details match the "{poFilter}" filter.
          </div>
        )}
      </div>

      {/* SECTION 2: CURRENT STOCK BATCHES IN INVENTORY */}
      <div className="space-y-4 pt-4 border-t border-slate-200">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Current Stock Batches (On-Hand)</h2>
            <p className="text-xs text-slate-500 mt-0.5">Inventory batches currently available for sale or direct issuance.</p>
          </div>
          <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
            {list.length} Batches Total
          </span>
        </div>

        <div className="table-container shadow-sm border border-slate-200 rounded-xl overflow-hidden bg-white">
          <table>
            <thead>
              <tr>
                <th>Batch ID</th>
                <th>Product</th>
                <th>Source PO Detail</th>
                <th>Cost Price</th>
                <th>Expiry Date</th>
                <th>Qty On Hand</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {list.map((b) => {
                const prod = products[b.ProductID]
                const qty = b.QuantityOnHand ?? b.QuantityRemaining ?? 0
                const isExp = b.ExpiryDate && new Date(b.ExpiryDate) < new Date()

                return (
                  <tr key={b.StockBatchID ?? b.BatchID ?? b.ProductID}>
                    <td className="font-bold text-slate-800">#{b.StockBatchID ?? b.BatchID}</td>
                    <td>
                      <div className="font-medium text-slate-800">
                        {prod ? prod.ProductName : `Product #${b.ProductID}`}
                      </div>
                      <div className="text-[11px] text-slate-500">ID: {b.ProductID}</div>
                    </td>
                    <td>{b.POrderDetailID ? `#${b.POrderDetailID}` : 'Direct Stock In'}</td>
                    <td className="font-medium">{b.CostPrice != null ? `$${Number(b.CostPrice).toFixed(2)}` : '—'}</td>
                    <td>
                      {b.ExpiryDate ? (
                        <span className={isExp ? 'text-rose-600 font-semibold' : 'text-slate-600'}>
                          {new Date(b.ExpiryDate).toLocaleDateString()} {isExp && '(Expired)'}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`font-bold text-sm ${qty > 0 ? 'text-slate-800' : 'text-rose-600'}`}>
                        {qty} units
                      </span>
                    </td>
                    <td>
                      {qty > 0 && !isExp && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
                          Active
                        </span>
                      )}
                      {qty === 0 && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                          Depleted
                        </span>
                      )}
                      {isExp && (
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                          Expired
                        </span>
                      )}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        {list.length === 0 && (
          <div className="p-8 text-center bg-white border border-slate-200 rounded-xl text-slate-500 text-sm">
            No stock batches available. Accept an incoming PO above and click "Add to Stock" to create inventory.
          </div>
        )}
      </div>

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

