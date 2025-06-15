import mongoose, { Document, Schema } from "mongoose";

export interface ProductDocument extends Document {
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  filename: string;
  category: mongoose.Types.ObjectId;
  outOfStock: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<ProductDocument>({
  name: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: { type: Schema.Types.ObjectId, ref: "Category", required: true },
  outOfStock: {
    type: Boolean,
    required: true,
    default: false,
  },
  imageUrl: {
    type: String,
    required: true,
  },
  filename: {
    type: String,
    required: true
  }
}, {
  timestamps: true,
});

const ProductModel = mongoose.model<ProductDocument>("Product", productSchema);

export default ProductModel;