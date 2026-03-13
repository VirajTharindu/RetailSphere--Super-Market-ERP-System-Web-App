import db from "../models/index.js";
const { Customer } = db;

/**
 * ==========================================
 * CUSTOMER SERVICE METHODS
 * ==========================================
 */

export async function createCustomer({ fName, lName, phone }) {
  return Customer.create({
    FirstName: fName,
    LastName: lName,
    Phone: phone,
    LoyaltyPoints: 0,
  });
}

export async function fetchAllCustomers() {
  return Customer.findAll();
}

export async function fetchCustomerById(id) {
  return Customer.findByPk(id);
}

export async function updateCustomerById(id, data) {
  return Customer.update(
    {
      FirstName: data.fName,
      LastName: data.lName,
      Phone: data.phone,
    },
    { where: { CustomerID: id } },
  );
}

export async function deleteCustomerById(id) {
  return Customer.destroy({ where: { CustomerID: id } });
}
