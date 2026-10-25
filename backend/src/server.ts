import app from "./app";
import { connectDB } from "./db";

async function start() {
  await connectDB();
  app.listen(3000, () => {
    console.log("Server running on http://localhost:3000");
  });
}

start();