/** User & Auth */
export type UserRole = 'Admin' | 'Manager' | 'Staff'

export interface AuthUser {
  id: number
  username: string
  role: UserRole
  fullName?: string
}

export interface User extends AuthUser {
  fullName?: string
  UserID?: number
  Username?: string
  UserRole?: UserRole
  FullName?: string
}

/** Product & Category */
export interface Category {
  CategoryID: number
  CategoryName: string
  Description?: string
}

export interface Product {
  ProductID: number
  ProductName: string
  CategoryID: number
  ReorderLevel?: number
  UnitPrice: number
  Category?: Category
}

/** Customer (CRM) - API accepts fName/lName; responses may use FirstName/LastName */
export interface Customer {
  CustomerID: number
  fName?: string
  lName?: string
  phone?: string
  FirstName?: string
  LastName?: string
  Phone?: string
  LoyaltyPoints?: number
}

/** Supplier (Procurement) */
export interface Supplier {
  SupplierID: number
  SupplierName: string
  ContactPerson: string
  Email: string
  Phone: string
  Address?: string
}

/** Stock Batch (backend uses BatchID, QuantityOnHand) */
export interface StockBatch {
  StockBatchID?: number
  BatchID?: number
  ProductID: number
  SupplierID?: number
  POrderDetailID: number
  CostPrice?: number
  ExpiryDate?: string
  QuantityRemaining?: number
  QuantityOnHand?: number
  Product?: Product
}

/** Sale */
export type PaymentMethod = 'CASH' | 'CARD'
export type SaleStatus = 'COMPLETED' | 'PENDING' | 'CANCELLED' | 'REFUNDED'

export interface SaleItem {
  productId: number
  quantity: number
}

export interface SaleDetail {
  SaleDetailID?: number
  SaleID?: number
  ProductID: number
  Quantity: number
  UnitPrice?: number
  Cost?: number
  Subtotal?: number
  Profit?: number
  Product?: Product
}

export interface Sale {
  SaleID: number
  InvoiceNumber: string
  SaleDate: string
  CustomerID?: number | null
  UserID: number
  TotalAmount: number
  TotalCost?: number
  TotalProfit?: number
  PaymentMethod: PaymentMethod
  Status: SaleStatus
  SaleDetails?: SaleDetail[]
  Customer?: Customer
}

/** Purchase Order Detail */
export type PODetailStatus =
  | 'Pending'
  | 'PartiallyReceived'
  | 'Received'
  | 'Cancelled'
  | 'Refused'
  | 'Added'

export interface POrderDetail {
  PO_DetailID?: number
  PO_ID: number
  ProductID: number
  SupplierID?: number
  QuantityOrdered?: number
  QuantityRequested?: number
  QuantityReceived?: number
  Status: PODetailStatus
  CostPriceofPOD?: number
  ExpiryDate?: string | null
  Product?: Product
  Supplier?: Supplier
}

/** API payloads */
export interface CreateSalePayload {
  customerId?: number
  paymentMethod?: PaymentMethod
  status?: SaleStatus
  items: SaleItem[]
}

export interface AnalyticsOverview {
  totalSales?: number
  totalOrders?: number
  totalProfit?: number
  [key: string]: unknown
}

export interface SalesTrendPoint {
  period: string
  sales?: number
  total?: number
  profit?: number
  count?: number
}
