import { FormEvent, useEffect, useState } from "react";
import { PackagePlus } from "lucide-react";
import { EmptyRow } from "../../components/EmptyRow";
import { adminService } from "../../services/api/adminService";
import type { Product, ProductFormState } from "../../types";
import { money } from "../../utils/formatters";

const emptyProductForm: ProductFormState = {
  id: "",
  name: "",
  catalogProductId: "",
  price: "",
  stockQuantity: "0",
  description: "",
  isActive: false,
};

export function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [form, setForm] = useState<ProductFormState>(emptyProductForm);
  const [error, setError] = useState("");

  const loadProducts = async () => {
    try {
      setError("");
      setProducts(await adminService.getProducts());
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load products.");
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const updateForm = (key: keyof ProductFormState, value: string | boolean) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const editProduct = (product: Product) => {
    setForm({
      id: product._id,
      name: product.name,
      catalogProductId: product.catalogProductId ?? "",
      price: String(product.price ?? ""),
      stockQuantity: String(product.stockQuantity ?? 0),
      description: product.description ?? "",
      isActive: product.isActive,
    });
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    try {
      setError("");
      await adminService.saveProduct(form);
      setForm(emptyProductForm);
      await loadProducts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to save product.");
    }
  };

  const togglePublishedState = async (product: Product, isActive: boolean) => {
    try {
      setError("");
      await adminService.saveProduct({
        id: product._id,
        name: product.name,
        catalogProductId: product.catalogProductId ?? "",
        price: String(product.price ?? ""),
        stockQuantity: String(product.stockQuantity ?? 0),
        description: product.description ?? "",
        isActive,
      });
      await loadProducts();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to update product status.");
    }
  };

  return (
    <section className="products-layout">
      <form className="editor-panel" onSubmit={submit}>
        <div className="editor-title">
          <PackagePlus size={19} />
          <h3>{form.id ? "Edit product" : "Add product"}</h3>
        </div>
        {error ? <div className="alert">{error}</div> : null}
        <label>Name<input value={form.name} onChange={(event) => updateForm("name", event.target.value)} required /></label>
        <label>Catalog Product ID<input value={form.catalogProductId} onChange={(event) => updateForm("catalogProductId", event.target.value)} /></label>
        <label>Price<input type="number" min="0" step="0.01" value={form.price} onChange={(event) => updateForm("price", event.target.value)} required /></label>
        <label>Stock<input type="number" min="0" step="1" value={form.stockQuantity} onChange={(event) => updateForm("stockQuantity", event.target.value)} /></label>
        <label>Description<textarea rows={4} value={form.description} onChange={(event) => updateForm("description", event.target.value)} /></label>
        <label className="check-row"><input type="checkbox" checked={form.isActive} onChange={(event) => updateForm("isActive", event.target.checked)} /> Publish in catalog</label>
        <div className="form-actions">
          <button type="submit">{form.isActive ? "Save and publish" : "Save as draft"}</button>
          {form.id ? (
            <button className="secondary-button" type="button" onClick={() => setForm(emptyProductForm)}>
              Cancel edit
            </button>
          ) : null}
        </div>
      </form>

      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Product</th>
              <th>Catalog ID</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product._id}>
                <td><strong>{product.name}</strong><small>{product.isActive ? "Published" : "Draft"}</small></td>
                <td>{product.catalogProductId ?? "-"}</td>
                <td>{money(product.price, product.currency)}</td>
                <td>{product.stockQuantity}</td>
                <td>
                  <button className="small-button" type="button" onClick={() => editProduct(product)}>Edit</button>
                  <button
                    className="small-button"
                    type="button"
                    onClick={() => togglePublishedState(product, !product.isActive)}
                  >
                    {product.isActive ? "Move to draft" : "Publish"}
                  </button>
                </td>
              </tr>
            ))}
            {!products.length ? <EmptyRow columns={5} label="No products yet." /> : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
