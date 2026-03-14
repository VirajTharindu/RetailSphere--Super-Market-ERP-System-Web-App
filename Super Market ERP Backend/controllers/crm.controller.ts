import {
  createCustomer,
  fetchAllCustomers,
  fetchCustomerById,
  updateCustomerById,
  deleteCustomerById,
} from "../services/crm.service.js";

/**
 * ==========================================
 * CUSTOMER CONTROLLER METHODS
 * ==========================================
 */

// Health Check
export function healthCheck(req: any, res: any) {
  res.json({ status: "ok", message: "CRM service live 🚀" });
}

// Add Customer
export async function createCustomerController(req: any, res: any) {
  try {
    const { fName, lName, phone } = req.validated;

    const customer = await createCustomer({ fName, lName, phone });

    res.status(201).json({
      success: true,
      customer: {
        CustomerID: customer.CustomerID,
        FirstName: customer.FirstName,
        LastName: customer.LastName,
        Phone: customer.Phone,
        LoyaltyPoints: customer.LoyaltyPoints,
      },
      message: `Customer created successfully with ID ${customer.CustomerID}`,
    });
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res.status(400).json({
        success: false,
        message: "Phone number already exists",
      });
    }
    res.status(500).json({
      success: false,
      message: "Failed to create customer",
      error: err.message,
    });
  }
}

// Get All Customers
export async function getAllCustomersController(req: any, res: any) {
  try {
    const customers = await fetchAllCustomers();
    res.status(200).json({
      success: true,
      customers,
      message: `${customers.length} customer(s: any) retrieved successfully`,
    });
  } catch (err: any) {
    res.status(500).json({
      success: false,
      message: "Failed to retrieve customers",
      error: err.message,
    });
  }
}

// Get Customer by ID
export async function getCustomerByIdController(req: any, res: any) {
  try {
    const { id } = req.validated;
    const customer = await fetchCustomerById(id);

    if (!customer) {
      return res
        .status(404)
        .json({ success: false, message: `Customer not found with ID ${id}` });
    }

    res.status(200).json({
      success: true,
      customer,
      message: `Customer retrieved successfully`,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: "Server error", error: err.message });
  }
}

// Update Customer
export async function updateCustomerController(req: any, res: any) {
  try {
    const { id } = req.params;
    const data = req.validated;

    const [updated] = await updateCustomerById(id, data);

    if (!updated) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      customer: data,
      message: `Customer updated successfully with ID ${id}`,
    });
  } catch (err: any) {
    if (err.name === "SequelizeUniqueConstraintError") {
      return res
        .status(400)
        .json({ success: false, message: "Phone number already exists" });
    }
    res
      .status(500)
      .json({ success: false, message: "Update failed", error: err.message });
  }
}

// Delete Customer
export async function deleteCustomerByIdController(req: any, res: any) {
  try {
    const { id } = req.validated;
    const deleted = await deleteCustomerById(id);

    if (!deleted) {
      return res
        .status(404)
        .json({ success: false, message: "Customer not found" });
    }

    res.status(200).json({
      success: true,
      message: `Customer deleted successfully with ID ${id}`,
    });
  } catch (err: any) {
    res
      .status(500)
      .json({ success: false, message: "Delete failed", error: err.message });
  }
}
