import { createClient, RedisClientType } from "redis";
import * as bcrypt from "bcrypt";

export const client = createClient({
    username: process.env.REDIS_USERNAME,
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
    },
});

client.on("error", (err) => console.log("Redis Client Error", err));

await client.connect();

export const checkOtpCache = async (userId: number) => {
    const cachedOtp = await client.get(`otp:${userId}`);
    if (cachedOtp === null) {
        return false;
    }
    return true;
};

export const storeOtp = async (otp: number, userId: number) => {
    try {
        const hashedOtp = await bcrypt.hash(otp.toString(), 10);
        client.set(`otp:${userId}`, hashedOtp, {
            EX: 300,
        });
    } catch (err) {
        console.log("Error in storeOtp() in redis.ts");
    }
};

export const verifyOtp = async (otp: number, userId: number) => {
    try {
        const cachedOtp = await client.get(`otp:${userId}`);

        const verified = await bcrypt.compare(otp.toString(), cachedOtp!);

        return verified;
    } catch (err) {
        console.log("Error in verifyOtp");
    }
};
