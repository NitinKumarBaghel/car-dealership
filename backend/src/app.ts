import express from "express";
import path from "path";                                  // helps build file paths
import authRoutes from "./routes/auth";
import vehicleRoutes from "./routes/vehicles";

const app = express();

app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/api/vehicles", vehicleRoutes);

// Folder where the built React app will be (made later by "npm run build").
const frontendPath = path.join(__dirname, "../../frontend/dist");

// Serve the React files (the page, its JavaScript and CSS).
app.use(express.static(frontendPath));

// Any other address that does not start with /api gets the React page.
app.get(/^\/(?!api).*/, (_req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

export default app;