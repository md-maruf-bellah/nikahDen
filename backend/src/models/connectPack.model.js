import mongoose from "mongoose";

const connectPackSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    connects: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true, min: 0 }, // integer BDT
    isActive: { type: Boolean, default: true },
    sortOrder: { type: Number, default: 0 },
  },
  { timestamps: true }
);

const ConnectPack = mongoose.model("ConnectPack", connectPackSchema);
export default ConnectPack;
