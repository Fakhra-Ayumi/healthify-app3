import { expect } from "chai";
import request from "supertest";
import mongoose from "mongoose";
import { app, testUser } from "../helpers";

describe("Integration: Registration & Login", () => {
  before(async function () {
    this.timeout(30000);
    await mongoose.connection.dropDatabase();
  });

  it("should register a new user successfully", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).to.equal(201);
    expect(res.body).to.have.property("token");
    expect(res.body.user).to.have.property("username", "testuser");
  });

  it("should reject duplicate registration (same email/username)", async () => {
    const res = await request(app).post("/api/auth/register").send(testUser);
    expect(res.status).to.equal(400);
    expect(res.body.message).to.include("already exists");
  });

  it("should reject registration with mismatched emails", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ...testUser,
        email: "other@mail.com",
        confirmEmail: "mismatch@mail.com",
        username: "newuser",
      });
    expect(res.status).to.equal(400);
  });

  it("should reject registration with short password (< 6 chars)", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({
        ...testUser,
        email: "short@mail.com",
        confirmEmail: "short@mail.com",
        username: "shortpw",
        password: "123",
        confirmPassword: "123",
      });
    expect(res.status).to.equal(400);
  });

  it("should login with correct credentials", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: testUser.password,
    });
    expect(res.status).to.equal(200);
    expect(res.body).to.have.property("token");
    expect(res.body.user).to.have.property("id");
  });

  it("should reject login with wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: testUser.username,
      password: "WrongPassword",
    });
    expect(res.status).to.equal(400);
  });

  it("should reject login with non-existent user", async () => {
    const res = await request(app).post("/api/auth/login").send({
      username: "noexist",
      password: "Password123",
    });
    expect(res.status).to.equal(400);
  });
});

describe("Integration: Token Protection", () => {
  it("should reject profile access without token", async () => {
    const res = await request(app).get("/api/auth/profile");
    expect(res.status).to.equal(401);
  });

  it("should reject profile access with invalid token", async () => {
    const res = await request(app)
      .get("/api/auth/profile")
      .set("Authorization", "Bearer invalidtoken123");
    expect(res.status).to.equal(403);
  });

  it("should reject workout access without token", async () => {
    const res = await request(app).get("/api/workouts");
    expect(res.status).to.equal(401);
  });
});
