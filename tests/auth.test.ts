import { describe, test, expect, beforeAll } from "bun:test";
import { testClient } from "hono/testing";

import app from "@/index";

const client = testClient(app);

describe("Auth Register Route", () => {
    const validUser = {
        username: "rexoslicer",
        email: "rexoslicer@mail.com",
        password: "rexopassword123",
    };

    test("should register a new user", async () => {
        const res = await client.auth.register.$post({
            json: validUser,
        });

        expect(res.status).toBe(201);

        const body = await res.json();

        expect(body).toHaveProperty("message");
        expect(body).toHaveProperty("user");
        expect(body.user.email).toBe(validUser.email);
    });

    test("should fail when username is missing", async () => {
        const res = await client.auth.register.$post({
            json: {
                email: validUser.email,
                password: validUser.password,
            } as any,
        });

        expect(res.status).toBe(400);
    });

    test("should fail when email is missing", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: validUser.username,
                password: validUser.password,
            } as any,
        });

        expect(res.status).toBe(400);
    });

    test("should fail when password is missing", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: validUser.username,
                email: validUser.email,
            } as any,
        });

        expect(res.status).toBe(400);
    });

    test("should fail with invalid email", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "john",
                email: "invalid-email",
                password: "password123",
            },
        });

        expect(res.status).toBe(400);
    });

    test("should fail with empty username", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "",
                email: "john@mail.com",
                password: "password123",
            },
        });

        expect(res.status).toBe(400);
    });

    test("should fail with empty password", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "john",
                email: "john@mail.com",
                password: "",
            },
        });

        expect(res.status).toBe(400);
    });

    test("should fail when password is too short", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "john",
                email: "john@mail.com",
                password: "123",
            },
        });

        expect(res.status).toBe(400);
    });

    test("should fail when email already exists", async () => {
        await client.auth.register.$post({
            json: {
                username: "user1",
                email: "duplicate@mail.com",
                password: "password123",
            },
        });

        const res = await client.auth.register.$post({
            json: {
                username: "user2",
                email: "duplicate@mail.com",
                password: "password123",
            },
        });

        expect([400, 409]).toContain(res.status);
    });

    test("should fail when username already exists", async () => {
        await client.auth.register.$post({
            json: {
                username: "duplicateuser",
                email: "user1@mail.com",
                password: "password123",
            },
        });

        const res = await client.auth.register.$post({
            json: {
                username: "duplicateuser",
                email: "user2@mail.com",
                password: "password123",
            },
        });

        expect([400, 409]).toContain(res.status);
    });

    test("should reject empty request body", async () => {
        const res = await app.request("/auth/register", {
            method: "POST",
            body: JSON.stringify({}),
            headers: {
                "Content-Type": "application/json",
            },
        });

        expect(res.status).toBe(400);
    });

    test("should reject invalid JSON", async () => {
        const res = await app.request("/auth/register", {
            method: "POST",
            body: "{invalid json}",
            headers: {
                "Content-Type": "application/json",
            },
        });

        expect([400, 422]).toContain(res.status);
    });

    test("should return JSON response", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "jsonuser",
                email: "json@mail.com",
                password: "password123",
            },
        });

        expect(res.headers.get("content-type")).toContain("application/json");
    });

    test("should trim whitespace if supported", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "   trimuser   ",
                email: "   trim@mail.com   ",
                password: "password123",
            },
        });

        expect([200, 201, 400]).toContain(res.status);
    });

    test("should reject extremely long username", async () => {
        const res = await client.auth.register.$post({
            json: {
                username: "a".repeat(300),
                email: "long@mail.com",
                password: "password123",
            },
        });

        expect(res.status).toBe(400);
    });
});
