import mongoose from "mongoose";

const vehicleSchema = new mongoose.Schema({
  make: { type: String, required: true, trim: true },
  model: { type: String, required: true, trim: true },
  category: { type: String, required: true, trim: true },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, default: 0, min: 0 },
});

export default mongoose.model("Vehicle", vehicleSchema);