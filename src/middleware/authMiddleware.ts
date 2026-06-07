import { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { verify } from "hono/jwt";
import db from "@/db/db";
import { usersTable } from "@/db/schema";
import { eq } from "drizzle-orm";

export const requireVerification = async (c: Context, next: Next) => {
    try {
        const sessionToken = getCookie(c, "session_token");

        if (!sessionToken) {
            return c.json(
                { message: "Unauthorized: Missing session token" },
                401,
            );
        }

        const secret = process.env.JWT_SECRET! || "development";

        const { sub } = await verify(sessionToken, secret, "HS512");

        const [user] = await db
            .select()
            .from(usersTable)
            .where(eq(usersTable.id, Number(sub)));

        if (!user) {
            return c.json({ message: "User not found" }, 401);
        }

        if (!user.isVerified) {
            return c.json(
                {
                    message: "Access denied. Please verify your email first.",
                },
                403,
            );
        }

        c.set("user", user);

        await next();
    } catch (err) {
        return c.json({ message: "Invalid or expired token" }, 401);
    }
};
