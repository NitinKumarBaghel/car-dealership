import { Router } from "express";
import bcrypt from "bcryptjs";
import User from "../models/User";

const router = Router();

router.post("/register", async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and password are required" });
  }

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ email, password: hash });

  res.status(201).json({ id: user._id, email: user.email });
});

export default router;