import express from "express";
import authRoutes from "./routes/auth";
import vehicleRoutes from "./routes/vehicles";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

export default app;