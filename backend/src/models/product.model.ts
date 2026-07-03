import { Schema, model, type HydratedDocument, type InferSchemaType } from "mongoose";

const ProductSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    catalogProductId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true,
      index: true,
    },
    price: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      required: true,
      default: "PKR",
    },
    stockQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    isActive: {
      type: Boolean,
      required: true,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export type Product = InferSchemaType<typeof ProductSchema>;
export type ProductDocument = HydratedDocument<Product>;

export const ProductModel = model<Product>("Product", ProductSchema);
