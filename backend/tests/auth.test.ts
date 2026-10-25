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