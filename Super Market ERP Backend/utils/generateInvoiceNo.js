import db from "../models/index.js";
import { Op } from "sequelize";

export async function generateInvoiceNo(transaction) {
  const { Sale } = db;
  const year = new Date().getFullYear();

  const lastSale = await Sale.findOne({
    where: {
      InvoiceNumber: {
        [Op.like]: `INV-${year}-%`,
      },
    },
    order: [["InvoiceNumber", "DESC"]],
    transaction,
    lock: transaction.LOCK.UPDATE,
  });

  let nextNumber = 1;

  if (lastSale) {
    const lastSequence = parseInt(lastSale.InvoiceNumber.split("-")[2], 10);
    nextNumber = lastSequence + 1;
  }

  const padded = String(nextNumber).padStart(5, "0");

  return `INV-${year}-${padded}`;
}

export default generateInvoiceNo;
