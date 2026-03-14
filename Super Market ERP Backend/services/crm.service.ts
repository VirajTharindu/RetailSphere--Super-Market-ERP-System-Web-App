import db from "../models/index.js";
const {  Customer  } = db as any;

/**
 * ==========================================
 * CUSTOMER SERVICE METHODS
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
  return Customer.findAll();
}

export async function fetchCustomerById(id: any) {
  return Customer.findByPk(id);
}

export async function updateCustomerById(id: any, data: any) {
  return Customer.update(
    {
      FirstName: data.fName,
      LastName: data.lName,
      Phone: data.phone,
    },
    { where: { CustomerID: id } },
  );
}

export async function deleteCustomerById(id: any) {
  return Customer.destroy({ where: { CustomerID: id } });
}
