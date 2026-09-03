import {
  createProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  getAllProducts,
} from "../services/product.service.js";

// Health Check
export function healthCheck(req: any, res: any) {
  res.json({ status: "ok", message: "Product service live 🚀" });
}

// Create Product
export async function createProductController(req: any, res: any) {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Get All Products
export async function getAllProductsController(req: any, res: any) {
  try {
    const products = await getAllProducts();
    res.status(200).json({
      success: true,
      message: ` ${products.length} Products found successfully`,
      products,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
}

// Get Product by ID
export async function getProductByIdController(req: any, res: any) {
  try {
    const { id } = req.params;
    const product = await getProductById(id);
    res.status(200).json({ success: true, product });
  } catch (err: any) {
    res.status(404).json({ success: false, error: err.message });
  }
}

// Update Product
export async function updateProductController(req: any, res: any) {
  try {
    const { id } = req.params;
    const product = await updateProduct(id, req.validated);
    res.status(200).json({ success: true, product });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}

// Delete Product (SAFE)
export async function deleteProductController(req: any, res: any) {
  try {
    await deleteProduct(req.params.id);
    res.status(200).json({ success: true, message: "Product deleted safely" });
  } catch (err: any) {
    res.status(400).json({ success: false, error: err.message });
  }
}
