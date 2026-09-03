import { useEffect, useState } from 'react'
import { getSales, createSale } from '../api/sales'
import { getProducts } from '../api/products'
import { getCustomers } from '../api/customers'
import type { Sale, Product, Customer, SaleItem } from '../types'

export default function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [cart, setCart] = useState<SaleItem[]>([])
  const [customerId, setCustomerId] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD'>('CASH')
  const [creating, setCreating] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      try {
        const [salesRes, productsRes, customersRes] = await Promise.all([
          getSales(),
          getProducts(),
          getCustomers(),
        ])
        if (!cancelled) {
          setSales(Array.isArray((salesRes as { data?: Sale[] }).data) ? (salesRes as { data: Sale[] }).data : [])
          setProducts(productsRes.products ?? [])
          setCustomers(customersRes.customers ?? [])
        }
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    load()
    return () => { cancelled = true }
  }, [])

  function addToCart(productId: number, qty: number) {
    if (qty < 1) return
    setCart((prev) => {
      const i = prev.findIndex((x) => x.productId === productId)
      const next = [...prev]
      if (i >= 0) {
        next[i] = { ...next[i], quantity: next[i].quantity + qty }
      } else {
        next.push({ productId, quantity: qty })
      }
      return next
    })
  }

  function removeFromCart(productId: number) {
    setCart((prev) => prev.filter((x) => x.productId !== productId))
  }

  async function handleCheckout() {
    if (cart.length === 0) {
      setMessage('Add at least one item')
      return
    }
    setCreating(true)
    setMessage('')
    try {
      await createSale({
        items: cart,
        customerId: customerId ? parseInt(customerId, 10) : undefined,
        paymentMethod,
        status: 'COMPLETED',
      })
      setCart([])
      setCustomerId('')
      setMessage('Sale completed successfully.')
      const salesRes = await getSales()
      setSales(
        Array.isArray((salesRes as { data?: Sale[] }).data) ? (salesRes as { data: Sale[] }).data : []
      )
    } catch (e) {
      setMessage(e instanceof Error ? e.message : 'Sale failed')
    } finally {
      setCreating(false)
    }
  }

  const cartTotal = cart.reduce((sum, item) => {
    const p = products.find((x) => x.ProductID === item.productId)
    return sum + (p ? Number(p.UnitPrice) * item.quantity : 0)
  }, 0)

  if (loading) return <div className="text-slate-500">Loading…</div>
  if (error) return <div className="text-red-600">{error}</div>

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-slate-800">Sales</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3">New sale</h2>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="form-group col-span-2">
                <label>Customer (required)</label>
                <select
                  value={customerId}
                  onChange={(e) => setCustomerId(e.target.value)}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="">Walk-in</option>
                  {customers.map((c) => (
                    <option key={c.CustomerID} value={String(c.CustomerID)}>
                      {(c.FirstName ?? c.fName) ?? ''} {(c.LastName ?? c.lName) ?? ''} ({c.Phone ?? c.phone})
                    </option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Payment</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value as 'CASH' | 'CARD')}
                  className="border rounded-lg px-3 py-2"
                >
                  <option value="CASH">Cash</option>
                  <option value="CARD">Card</option>
                </select>
              </div>
            </div>
            <div className="border rounded-lg p-2 max-h-48 overflow-y-auto space-y-1">
              {products.map((p) => (
                <div key={p.ProductID} className="flex justify-between items-center text-sm">
                  <span>{p.ProductName}</span>
                  <span className="text-slate-500">{Number(p.UnitPrice).toFixed(2)}</span>
                  <div className="flex items-center gap-1">
                    <input
                      type="number"
                      min={1}
                      defaultValue={1}
                      className="w-14 border rounded px-2 py-1 text-right"
                      onBlur={(e) => {
                        const v = parseInt(e.target.value, 10)
                        if (!Number.isNaN(v) && v > 0) addToCart(p.ProductID, v)
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => addToCart(p.ProductID, 1)}
                      className="btn-primary py-1 px-2 text-xs"
                    >
                      Add
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="card">
            <h2 className="font-semibold text-slate-800 mb-3">Cart</h2>
            {cart.length === 0 ? (
              <p className="text-slate-500 text-sm">Cart is empty</p>
            ) : (
              <ul className="space-y-2">
                {cart.map((item) => {
                  const p = products.find((x) => x.ProductID === item.productId)
                  return (
                    <li key={item.productId} className="flex justify-between items-center text-sm">
                      <span>{p?.ProductName ?? item.productId}</span>
                      <span>{item.quantity} × {p ? Number(p.UnitPrice).toFixed(2) : ''}</span>
                      <button
                        type="button"
                        onClick={() => removeFromCart(item.productId)}
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </li>
                  )
                })}
              </ul>
            )}
            <div className="mt-3 pt-3 border-t font-semibold">
              Total: {cartTotal.toFixed(2)}
            </div>
            {message && <p className={`text-sm mt-2 ${message.startsWith('Sale') ? 'text-green-600' : 'text-red-600'}`}>{message}</p>}
            <button
              type="button"
              onClick={handleCheckout}
              disabled={creating || cart.length === 0}
              className="btn-primary mt-3 w-full disabled:opacity-50"
            >
              {creating ? 'Processing…' : 'Complete sale'}
            </button>
          </div>
        </div>
        <div className="card">
          <h2 className="font-semibold text-slate-800 mb-3">Recent transactions</h2>
          <div className="overflow-x-auto max-h-96 overflow-y-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-slate-600">
                  <th className="text-left py-2">Invoice</th>
                  <th className="text-right py-2">Amount</th>
                </tr>
              </thead>
              <tbody>
                {sales.slice(0, 20).map((s) => (
                  <tr key={s.SaleID} className="border-b border-slate-100">
                    <td className="py-2">{s.InvoiceNumber}</td>
                    <td className="text-right py-2">{Number(s.TotalAmount).toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
