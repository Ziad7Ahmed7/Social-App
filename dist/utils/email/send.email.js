"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendEmail = void 0;
const nodemailer_1 = require("nodemailer");
const error_response_1 = require("../responses/error.response");
const sendEmail = async (data) => {
    if (!data.html && !data.text && !data.attachments?.length) {
        throw new error_response_1.badRequestException('Email must have html or text');
    }
    const transporter = (0, nodemailer_1.createTransport)({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL,
            pass: process.env.PASSWORD
        }
    });
    const info = await transporter.sendMail({
        ...data,
        from: process.env.EMAIL,
    });
    console.log(`Email sent: ${info.messageId}`);
};
exports.sendEmail = sendEmail;
