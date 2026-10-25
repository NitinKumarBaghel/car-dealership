import { Router } from "express";
import mongoose from "mongoose";
import Vehicle from "../models/Vehicle";
import { requireAuth, requireAdmin } from "../middleware/auth";

const router = Router();
router.use(requireAuth);                     // EVERY route below needs a login

const FIELDS = ["make", "model", "category", "price", "quantity"];
const escapeRegex = (t: string) => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ---- ADD ----
router.post("/", async (req, res) => {
  const { make, model, category, price, quantity } = req.body;
  if (!make || !model || !category || price === undefined) {
    return res.status(400).json({ error: "make, model, category and price are required" });
  }
  try {
    const vehicle = await Vehicle.create({ make, model, category, price, quantity });
    res.status(201).json(vehicle);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- LIST ----
router.get("/", async (_req, res) => {
  res.json(await Vehicle.find());
});

// ---- SEARCH (must be above /:id routes) ----
router.get("/search", async (req, res) => {
  const { make, model, category, minPrice, maxPrice } = req.query;
  const filter: any = {};
  if (make) filter.make = new RegExp(escapeRegex(String(make)), "i");
  if (model) filter.model = new RegExp(escapeRegex(String(model)), "i");
  if (category) filter.category = new RegExp(escapeRegex(String(category)), "i");
  if (minPrice || maxPrice) {
    filter.price = {};
    if (minPrice) filter.price.$gte = Number(minPrice);
    if (maxPrice) filter.price.$lte = Number(maxPrice);
  }
  res.json(await Vehicle.find(filter));
});

// ---- UPDATE ----
router.put("/:id", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const updates = Object.fromEntries(Object.entries(req.body).filter(([k]) => FIELDS.includes(k)));
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, updates, { new: true, runValidators: true });
    if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
    res.json(vehicle);
  } catch (err: any) {
    res.status(400).json({ error: err.message });
  }
});

// ---- DELETE (admin only) ----
router.delete("/:id", requireAdmin, async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  res.json({ message: "Vehicle deleted" });
});

// ---- PURCHASE: quantity down by 1 (only if stock > 0) ----
router.post("/:id/purchase", async (req, res) => {
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const vehicle = await Vehicle.findOneAndUpdate(
    { _id: req.params.id, quantity: { $gt: 0 } },
    { $inc: { quantity: -1 } },
    { new: true }
  );
  if (!vehicle) {
    const exists = await Vehicle.exists({ _id: req.params.id });
    return exists
      ? res.status(400).json({ error: "Out of stock" })
      : res.status(404).json({ error: "Vehicle not found" });
  }
  res.json(vehicle);
});

// ---- RESTOCK (admin only): quantity up ----
router.post("/:id/restock", requireAdmin, async (req, res) => {
  const amount = Number(req.body.amount);
  if (!Number.isInteger(amount) || amount <= 0) {
    return res.status(400).json({ error: "amount must be a positive whole number" });
  }
  if (!mongoose.isValidObjectId(req.params.id)) {
    return res.status(404).json({ error: "Vehicle not found" });
  }
  const vehicle = await Vehicle.findByIdAndUpdate(req.params.id, { $inc: { quantity: amount } }, { new: true });
  if (!vehicle) return res.status(404).json({ error: "Vehicle not found" });
  res.json(vehicle);
});

export default router;