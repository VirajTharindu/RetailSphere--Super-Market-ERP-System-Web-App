import db from "../models/index.js";
const { Customer } = db as any;

/**
 * ==========================================
 * CUSTOMER SERVICE METHODS (Enhanced with FE Mapping)
 * ==========================================
 */

export async function createCustomer({ fName, lName, phone }: any) {
  return Customer.create({
    FirstName: fName,
    LastName: lName,
    Phone: phone,
    LoyaltyPoints: 0,
  });
}

export async function fetchAllCustomers() {
  const customers = await Customer.findAll();
  // Map back to FE format for consistency if needed, 
  // but FE supports both Pascal and camelCase as seen in types/index.ts.
  return customers;
}

export async function fetchCustomerById(id: any) {
  return Customer.findByPk(id);
}

export async function updateCustomerById(id: any, data: any) {
  const updateData: any = {};
  if (data.fName) updateData.FirstName = data.fName;
  if (data.lName) updateData.LastName = data.lName;
  if (data.phone) updateData.Phone = data.phone;

  return Customer.update(updateData, { where: { CustomerID: id } });
}

export async function deleteCustomerById(id: any) {
  return Customer.destroy({ where: { CustomerID: id } });
}
