import request from "supertest";
import mongoose from "mongoose";
import app from "../src/app";
import { connectDB } from "../src/db";
import User from "../src/models/User";

beforeAll(async () => {
  await connectDB();
});

beforeEach(async () => {
  await User.deleteMany({});
});

afterAll(async () => {
  await mongoose.connection.close();
});

it("registers a new user and returns 201", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: "a@a.com", password: "secret123" });

  expect(res.status).toBe(201);
  expect(res.body.email).toBe("a@a.com");
  expect(res.body.password).toBeUndefined();
});

it("returns 409 when the email is already registered", async () => {
  await request(app)
    .post("/api/auth/register")
    .send({ email: "a@a.com", password: "secret123" });

  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: "a@a.com", password: "secret123" });

  expect(res.status).toBe(409);
  expect(res.body.error).toBe("Email already registered");
});
it("rejects a password shorter than 6 characters", async () => {
  const res = await request(app)
    .post("/api/auth/register")
    .send({ email: "a@a.com", password: "123" });
  expect(res.status).toBe(400);
});

it("logs in and returns a token", async () => {
  await request(app).post("/api/auth/register").send({ email: "a@a.com", password: "secret123" });
  const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "secret123" });
  expect(res.status).toBe(200);
  expect(res.body.token).toBeDefined();
});

it("rejects a wrong password with 401", async () => {
  await request(app).post("/api/auth/register").send({ email: "a@a.com", password: "secret123" });
  const res = await request(app).post("/api/auth/login").send({ email: "a@a.com", password: "wrongpass" });
  expect(res.status).toBe(401);
});