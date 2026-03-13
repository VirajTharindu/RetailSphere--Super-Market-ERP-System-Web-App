import { useEffect, useState } from 'react'
import { getOverview, getSalesTrend, getTopProducts, getLowStock, getInventoryValuation, getTopCustomers, getExpiryForecast } from '../api/analytics'

export default function Dashboard() {
  const [overview, setOverview] = useState<Record<string, unknown> | null>(null)
  const [trend, setTrend] = useState<Array<{ period: string; sales?: number; total?: number }>>([])
  const [topProducts, setTopProducts] = useState<Array<{ ProductName?: string; productName?: string; totalQuantity?: number; unitsSold?: number; totalRevenue?: number; sales?: number }>>([])
  const [lowStock, setLowStock] = useState<Array<{ ProductName?: string; productName?: string; totalStock?: number; ReorderLevel?: number }>>([])
  const [valuation, setValuation] = useState<{ totalValue?: number } | null>(null)
  const [topCustomers, setTopCustomers] = useState<Array<{ customerId?: number; customerName?: string | null; amount?: number; orders?: number }>>([])
  const [expiringBatches, setExpiringBatches] = useState<Array<{ batchId?: number; productName?: string; quantityOnHand?: number; expiryDate?: string }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [ov, tr, top, low, val, topCust, exp] = await Promise.all([
          getOverview().then((r) => r.data),
          getSalesTrend({ period: 'day' }).then((r) => r.data),
          getTopProducts({ limit: 5 }).then((r) => r.data),
          getLowStock({ limit: 5 }).then((r) => r.data),
          getInventoryValuation().then((r) => r.data as { totalValue: number }),
          getTopCustomers({ limit: 5 }).then((r) => r.data),
          getExpiryForecast({ days: 30 }).then((r) => r.data as any[]),
        ])
        if (!cancelled) {
          setOverview(ov as Record<string, unknown>)
          setTrend(Array.isArray(tr) ? tr : [])
          setTopProducts(Array.isArray(top) ? top : [])
          setLowStock(Array.isArray(low) ? low : [])
          setValuation(val || null)
          setTopCustomers(Array.isArray(topCust) ? topCust : [])
          setExpiringBatches(Array.isArray(exp) ? exp : [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load dashboard')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  if (loading) return <div className="text-slate-500">Loading dashboard…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-sm text-slate-500">Total Sales</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {overview?.totalSales != null ? Number(overview.totalSales).toLocaleString() : '—'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Orders</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {overview?.transactions != null ? Number(overview.transactions).toLocaleString() : '—'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Profit</div>
          <div className="text-2xl font-bold text-teal-600 mt-1">
            {overview?.totalProfit != null ? Number(overview.totalProfit).toLocaleString() : '—'}
          </div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Low stock items</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">{lowStock.length}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Inventory Value</div>
          <div className="text-2xl font-bold text-slate-800 mt-1">
            {valuation?.totalValue != null ? `$${Number(valuation.totalValue).toLocaleString()}` : '—'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Top products</h2>
          {topProducts.length === 0 ? (
            <p className="text-slate-500 text-sm">No data</p>
          ) : (
            <ul className="space-y-2">
              {topProducts.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{p.ProductName ?? p.productName ?? '—'}</span>
                  <span className="text-slate-500">
                    Qty: {p.totalQuantity ?? p.unitsSold ?? 0} · {Number(p.totalRevenue ?? p.sales ?? 0).toLocaleString()}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Low stock</h2>
          {lowStock.length === 0 ? (
            <p className="text-slate-500 text-sm">No items below reorder level</p>
          ) : (
            <ul className="space-y-2">
              {lowStock.map((p, i) => (
                <li key={i} className="flex justify-between text-sm">
                  <span className="text-slate-700">{p.ProductName ?? p.productName ?? '—'}</span>
                  <span className="text-amber-600">
                    {p.totalStock ?? 0} / reorder {p.ReorderLevel ?? 0}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Top Customers</h2>
          {topCustomers.length === 0 ? (
            <p className="text-slate-500 text-sm">No data</p>
          ) : (
            <ul className="space-y-2">
              {topCustomers.map((c, i) => (
                <li key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                  <span className="text-slate-700 font-medium">{c.customerName || 'Unknown Customer'}</span>
                  <div className="text-right">
                    <div className="text-slate-600 text-xs">{c.orders} orders</div>
                    <div className="text-slate-800 font-bold">${Number(c.amount || 0).toLocaleString()}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Expiring Soon (30 Days)</h2>
          {expiringBatches.length === 0 ? (
            <p className="text-slate-500 text-sm">No expiring batches</p>
          ) : (
            <ul className="space-y-2">
              {expiringBatches.map((b, i) => {
                const daysLeft = Math.ceil((new Date(b.expiryDate!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))
                const isUrgent = daysLeft <= 7
                return (
                  <li key={i} className="flex justify-between items-center text-sm border-b pb-2 last:border-0 last:pb-0">
                    <div>
                      <span className="text-slate-700 font-medium block">{b.productName}</span>
                      <span className="text-slate-500 text-xs">Batch #{b.batchId} • {b.quantityOnHand} Qty</span>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${isUrgent ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                      {daysLeft} days
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </div>

      {trend.length > 0 && (
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-4">Sales trend (recent)</h2>
          <div className="flex flex-wrap gap-4">
            {trend.slice(0, 7).map((t, i) => (
              <div key={i} className="text-sm">
                <span className="text-slate-500">{String(t.period)}</span>
                <span className="ml-2 font-medium">{Number(t.sales ?? t.total ?? 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
