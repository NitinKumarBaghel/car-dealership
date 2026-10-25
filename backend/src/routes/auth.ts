import { Router } from "express";
import bcrypt from "bcryptjs";               // hashes and checks passwords
import jwt from "jsonwebtoken";              // makes login tokens
import User from "../models/User";

const router = Router();

// ---------- REGISTER ----------
router.post("/register", async (req, res) => {
  const { email, password, role } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }
  if (password.length < 6) {                 // reject short passwords
    return res.status(400).json({ error: "Password must be at least 6 characters" });
  }

  const hash = await bcrypt.hash(password, 10);

  try {
    // Demo shortcut: anyone can ask for the admin role. A real app would NOT allow this.
    const user = await User.create({
      email,
      password: hash,
      role: role === "admin" ? "admin" : "user",
    });
    return res.status(201).json({ id: user._id, email: user.email, role: user.role });
  } catch (error: any) {
    if (error.code === 11000) {              // 11000 = duplicate email
      return res.status(409).json({ error: "Email already registered" });
    }
    throw error;
  }
});

// ---------- LOGIN ----------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  if (typeof email !== "string" || typeof password !== "string") {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() });

  // Same message for "no user" and "wrong password", so attackers learn nothing.
  if (!user || !(await bcrypt.compare(password, user.password))) {
    return res.status(401).json({ error: "Invalid email or password" });
  }

  // The token stores the user's id and role. It expires after 1 day.
  const token = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || "dev-secret",
    { expiresIn: "1d" }
  );

  res.json({ token, role: user.role });
});

export default router;