import dotenv from "dotenv";
import { createTransport } from 'nodemailer';

dotenv.config();

export const transport = createTransport({
    service: 'gmail',
    auth: {
        user: process.env.COMPANY_EMAIL,
        pass: process.env.COMPANY_PASS,
    },
});