import { createTransport } from "nodemailer";

const transporter = createTransport({
    secure: true,
    host: "smtp.gmail.com",
    port: 465,
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD,
    },
});

const sendMail = async (to: string, sub: string, msg: string) => {
    await transporter.sendMail({
        from: '"netCafe" astaworkmail365+netCafeCorp@gmail.com',
        to: to,
        subject: sub,
        html: msg,
    });

    console.log("Email sent");
};

export const sendOtp = async (to: string) => {
    const otp = Math.floor(100000 + Math.random() * 900000);

    await sendMail(
        to,
        "Email Verification",
        `Your OTP for email verification is : ${otp}`,
    );

    return otp;
};
