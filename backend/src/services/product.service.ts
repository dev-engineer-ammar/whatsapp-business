import { ProductModel, type ProductDocument } from "../models/product.model.js";
import { env } from "../config/env.js";

export interface ProductInput {
  name: string;
  description?: string;
  catalogProductId?: string;
  price: number;
  currency?: string;
  stockQuantity?: number;
  isActive?: boolean;
}

export class DuplicateProductCatalogIdError extends Error {
  constructor(catalogProductId: string) {
    super(`A product with catalog product ID "${catalogProductId}" already exists.`);
    this.name = "DuplicateProductCatalogIdError";
  }
}

export class ProductService {
  async listProducts(): Promise<ProductDocument[]> {
    return ProductModel.find().sort({ createdAt: -1 }).exec();
  }

  async createProduct(input: ProductInput): Promise<ProductDocument> {
    await this.ensureUniqueCatalogProductId(input.catalogProductId);

    return ProductModel.create({
      ...input,
      currency: input.currency ?? env.payment.defaultCurrency,
      stockQuantity: input.stockQuantity ?? 0,
      isActive: input.isActive ?? false,
    });
  }

  async updateProduct(productId: string, input: Partial<ProductInput>): Promise<ProductDocument | null> {
    await this.ensureUniqueCatalogProductId(input.catalogProductId, productId);

    return ProductModel.findByIdAndUpdate(productId, input, {
      new: true,
      runValidators: true,
    }).exec();
  }

  private async ensureUniqueCatalogProductId(
    catalogProductId?: string,
    currentProductId?: string
  ): Promise<void> {
    if (!catalogProductId) {
      return;
    }

    const existingProduct = await ProductModel.findOne({ catalogProductId }).select("_id").exec();

    if (existingProduct && existingProduct._id.toString() !== currentProductId) {
      throw new DuplicateProductCatalogIdError(catalogProductId);
    }
  }
}
