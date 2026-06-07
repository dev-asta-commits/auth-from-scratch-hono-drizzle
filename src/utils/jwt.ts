import { sign } from "hono/jwt";
import { Context } from "hono";
import { setCookie } from "hono/cookie";

export const generateAuthToken = async (userID: number, c: Context) => {
    const payload = {
        sub: userID,
        expiresIn: "7d",
    };

    const secret = process.env.JWT_SECRET! || "development";
    const token = await sign(payload, secret, "HS512");

    setCookie(c, "session_token", token, {
        httpOnly: true,
        secure: true,
        maxAge: 7 * 24 * 60 * 60,
        path: "/",
        sameSite: "Strict",
    });

    return token;
};
