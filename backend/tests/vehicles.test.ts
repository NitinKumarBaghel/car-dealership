import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";
import { connectDB } from "../src/db";
import User from "../src/models/User";
import Vehicle from "../src/models/Vehicle";

async function getToken(role: "user" | "admin") {
  const email = `${role}@test.com`;
  await request(app).post("/api/auth/register").send({ email, password: "secret123", role });
  const res = await request(app).post("/api/auth/login").send({ email, password: "secret123" });
  return res.body.token as string;
}

const addCar = (data = {}) =>
  Vehicle.create({ make: "Toyota", model: "Camry", category: "Sedan", price: 25000, quantity: 3, ...data });

beforeAll(async () => { await connectDB(); await User.init(); });
beforeEach(async () => { await User.deleteMany({}); await Vehicle.deleteMany({}); });
afterAll(async () => { await mongoose.connection.close(); });

it("blocks vehicle list without a token (401)", async () => {
  const res = await request(app).get("/api/vehicles");
  expect(res.status).toBe(401);
});

it("adds a vehicle", async () => {
  const token = await getToken("user");
  const res = await request(app).post("/api/vehicles").set("Authorization", `Bearer ${token}`)
    .send({ make: "Honda", model: "Civic", category: "Sedan", price: 22000, quantity: 5 });
  expect(res.status).toBe(201);
  expect(res.body.make).toBe("Honda");
});

it("lists all vehicles", async () => {
  const token = await getToken("user");
  await addCar();
  const res = await request(app).get("/api/vehicles").set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.length).toBe(1);
});

it("searches by make and by price range", async () => {
  const token = await getToken("user");
  await addCar();
  await addCar({ make: "BMW", model: "X5", category: "SUV", price: 60000 });

  const byMake = await request(app).get("/api/vehicles/search?make=bmw").set("Authorization", `Bearer ${token}`);
  expect(byMake.body.length).toBe(1);

  const byPrice = await request(app).get("/api/vehicles/search?minPrice=20000&maxPrice=30000").set("Authorization", `Bearer ${token}`);
  expect(byPrice.body.length).toBe(1);
  expect(byPrice.body[0].make).toBe("Toyota");
});

it("updates a vehicle", async () => {
  const token = await getToken("user");
  const car = await addCar();
  const res = await request(app).put(`/api/vehicles/${car._id}`).set("Authorization", `Bearer ${token}`).send({ price: 24000 });
  expect(res.status).toBe(200);
  expect(res.body.price).toBe(24000);
});

it("only an admin can delete a vehicle", async () => {
  const car = await addCar();
  const userToken = await getToken("user");
  const adminToken = await getToken("admin");

  const denied = await request(app).delete(`/api/vehicles/${car._id}`).set("Authorization", `Bearer ${userToken}`);
  expect(denied.status).toBe(403);

  const ok = await request(app).delete(`/api/vehicles/${car._id}`).set("Authorization", `Bearer ${adminToken}`);
  expect(ok.status).toBe(200);
});

it("purchase lowers the quantity by 1", async () => {
  const token = await getToken("user");
  const car = await addCar({ quantity: 3 });
  const res = await request(app).post(`/api/vehicles/${car._id}/purchase`).set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(200);
  expect(res.body.quantity).toBe(2);
});

it("purchase fails when quantity is 0", async () => {
  const token = await getToken("user");
  const car = await addCar({ quantity: 0 });
  const res = await request(app).post(`/api/vehicles/${car._id}/purchase`).set("Authorization", `Bearer ${token}`);
  expect(res.status).toBe(400);
});

it("only an admin can restock", async () => {
  const car = await addCar({ quantity: 1 });
  const userToken = await getToken("user");
  const adminToken = await getToken("admin");

  const denied = await request(app).post(`/api/vehicles/${car._id}/restock`).set("Authorization", `Bearer ${userToken}`).send({ amount: 5 });
  expect(denied.status).toBe(403);

  const ok = await request(app).post(`/api/vehicles/${car._id}/restock`).set("Authorization", `Bearer ${adminToken}`).send({ amount: 5 });
  expect(ok.status).toBe(200);
  expect(ok.body.quantity).toBe(6);
});