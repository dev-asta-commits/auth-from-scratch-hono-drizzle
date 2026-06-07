import db from "@/db/db";
import { usersTable } from "@/db/schema";
import { hashPassword } from "@/utils/bcrypt";
import { eq, or } from "drizzle-orm";
import { Context } from "hono";
import * as bcrypt from "bcrypt";
import { generateAuthToken } from "@/utils/jwt";
import { deleteCookie, getCookie } from "hono/cookie";
import { sendOtp } from "@/utils/nodemailer";
import { verify } from "hono/jwt";

const totp: Number[] = [];

export const register = async (c: Context) => {
    try {
        const { username, email, password } = await c.req.json();
        const existingUsers = await db
            .select()
            .from(usersTable)
            .where(
                or(
                    eq(usersTable.email, email),
                    eq(usersTable.username, username),
                ),
            );

        if (existingUsers.length > 0) {
            const user = existingUsers[0];
            if (user.email === email) {
                return c.json({ message: "User already exists" }, 409);
            }
            if (user.username === username) {
                return c.json({ message: "Username not available" }, 409);
            }
        }

        const hashedPassword = await hashPassword(password);

        const [userId] = await db
            .insert(usersTable)
            .values({ username, email, password: hashedPassword })
            .returning({ insertedId: usersTable.id });

        const thisotp = await sendOtp(email);
        totp.push(thisotp);

        await generateAuthToken(userId.insertedId, c);

        console.log("user created with UserId : ", userId);

        return c.json({ message: "User registered successfully!" }, 201);
    } catch (err) {
        console.log("Error in auth controller when signing up", err);

        return c.json(
            { message: "Error signing up. Internal server error." },
            500,
        );
    }
};

export const verifyEmail = async (c: Context) => {
    const sessionToken = getCookie(c, "session_token");

    if (!sessionToken) {
        return c.json({ message: "Unauthorized: Missing session token" }, 401);
    }

    const secret = process.env.JWT_SECRET! || "development";

    const { sub } = await verify(sessionToken, secret, "HS512");

    const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, Number(sub)));

    const savedOtp = totp[0];

    const { otp } = await c.req.json();

    if (otp !== savedOtp) {
        return c.json({ message: "Invalid OTP" }, 400);
    }

    await db
        .update(usersTable)
        .set({ isVerified: true })
        .where(eq(usersTable.id, user.id));

    return c.json({ message: "Email verified" }, 200);
};

export const login = async (c: Context) => {
    const { email, password } = await c.req.json();
    const sessionToken = getCookie(c, "session_token");

    if (sessionToken) {
        return c.json({ message: "User already logged in." }, 409);
    }

    try {
        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(email, usersTable.email));

        console.log("db queried");

        if (!user) {
            console.log("invalid mail or pass");
            return c.json({ message: "Invalid email or password" }, 404);
        }

        const result = await bcrypt.compare(password, user.password);

        if (result) {
            await generateAuthToken(user.id, c);
            console.log("auth token generaated");
            return c.json({ message: "Logged in successfully" }, 200);
        } else {
            return c.json({ message: "Invalid email or password" }, 404);
        }
    } catch (err) {
        console.log("Error in auth controller when signing up", err);

        return c.json(
            { message: "Error signing in. Internal server error." },
            500,
        );
    }
};

export const logout = async (c: Context) => {
    try {
        deleteCookie(c, "session_token");
        return c.json({ message: "Logged out successfully" }, 200);
    } catch (error) {
        console.log("Error in auth controller while logging out.", error);
        return c.json({ message: "Internal server error." }, 500);
    }
};
