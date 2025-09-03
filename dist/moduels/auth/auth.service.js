"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const User_model_1 = require("../../DB/models/User.model");
const error_response_1 = require("../../utils/responses/error.response");
const user_repository_1 = require("../../DB/repository/user.repository");
const hash_security_1 = require("../../utils/security/hash.security");
const email_event_1 = require("../../utils/event/email.event");
const otp_1 = require("../../utils/otp");
const token_security_1 = require("../../utils/security/token.security");
const google_auth_library_1 = require("google-auth-library");
class AuthentcationService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    constructor() { }
    async verifyGmailAccount(idToken) {
        const client = new google_auth_library_1.OAuth2Client();
        const ticket = await client.verifyIdToken({
            idToken: idToken,
            audience: process.env.WEB_CLIENT_IDS?.split(",") || [],
        });
        const payload = ticket.getPayload();
        if (!payload?.email_verified) {
            throw new error_response_1.badRequestException("Gmail account not verified");
        }
        return payload;
    }
    signupWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const { email, family_name, given_name, picture } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email },
        });
        if (user) {
            if (user.provider === User_model_1.ProviderEnum.GOOGLE) {
                return await this.loginWithGmail(req, res, next);
            }
            throw new error_response_1.ConflictException("User already exists with this email");
        }
        const [newUser] = (await this.userModel.create({
            data: [
                {
                    firstName: given_name,
                    email: email,
                    lastName: family_name,
                    profileImage: picture,
                    confirmedAt: new Date(),
                    provider: User_model_1.ProviderEnum.GOOGLE,
                },
            ],
        })) || [];
        if (!newUser) {
            throw new error_response_1.badRequestException("User not created");
        }
        const credential = await (0, token_security_1.createLoginCredential)(newUser);
        return res
            .status(201)
            .json({ message: "signup with gmail", data: { credential } });
    };
    loginWithGmail = async (req, res, next) => {
        const { idToken } = req.body;
        const { email } = await this.verifyGmailAccount(idToken);
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.ProviderEnum.GOOGLE },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Not registered with this email");
        }
        const credential = await (0, token_security_1.createLoginCredential)(user);
        return res.json({ message: "login with gmail", data: { credential } });
    };
    signup = async (req, res, next) => {
        let { fullName, password, email } = req.body;
        console.log({ fullName, password, email });
        const checkUserExists = await this.userModel.findOne({
            filter: { email },
            select: "email",
            options: { lean: true },
        });
        console.log(checkUserExists);
        if (checkUserExists) {
            throw new error_response_1.ConflictException("User already exists with this email");
        }
        const otp = (0, otp_1.generateOtpNumber)();
        const user = await this.userModel.createUser({
            data: [
                {
                    fullName,
                    email,
                    password: await (0, hash_security_1.generateHash)(password),
                    confirmEmailOtp: await (0, hash_security_1.generateHash)(String(otp)),
                },
            ],
        });
        email_event_1.emailEvent.emit("confirmEmail", { to: email, otp: otp });
        return res
            .status(201)
            .json({ message: "User signed up successfully!", data: { user } });
    };
    confirmEmail = async (req, res, next) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                confirmEmailOtp: { $exists: true },
                confirmedAt: { $exists: false },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Invalid email or already confirmed");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.confirmEmailOtp))) {
            throw new error_response_1.ConflictException("Invalid Confirmation Code");
        }
        await this.userModel.updateOne({
            filter: { email },
            update: { $unset: { confirmEmailOtp: true }, confirmedAt: new Date() },
        });
        return res.status(200).json({ message: "User logged in successfully!" });
    };
    login = async (req, res, next) => {
        const { email, password } = req.body;
        const user = await this.userModel.findOne({
            filter: { email, provider: User_model_1.ProviderEnum.SYSTEM },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Invalid email or password");
        }
        if (!user.confirmedAt) {
            throw new error_response_1.badRequestException("Please confirm your email first");
        }
        if (!(0, hash_security_1.compareHash)(password, user.password)) {
            throw new error_response_1.notFoundException("Invalid email or password");
        }
        const credential = await (0, token_security_1.createLoginCredential)(user);
        return res
            .status(200)
            .json({ message: "User logged in successfully!", data: { credential } });
    };
    sendForgotCode = async (req, res, next) => {
        const { email } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.SYSTEM,
                confirmedAt: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Invalid account");
        }
        const otp = (0, otp_1.generateOtpNumber)();
        const result = await this.userModel.updateOne({
            filter: { email },
            update: { resetPasswordOtp: await (0, hash_security_1.generateHash)(String(otp)) },
        });
        if (!result.matchedCount) {
            throw new error_response_1.badRequestException("Something went wrong");
        }
        email_event_1.emailEvent.emit("resetPassword", { to: email, otp: otp });
        return res.status(200).json({ message: "Done" });
    };
    verifyForgotPassword = async (req, res, next) => {
        const { email, otp } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        return res.status(200).json({ message: "Done" });
    };
    resetForgotPassword = async (req, res, next) => {
        const { email, otp, password } = req.body;
        const user = await this.userModel.findOne({
            filter: {
                email,
                provider: User_model_1.ProviderEnum.SYSTEM,
                resetPasswordOtp: { $exists: true },
            },
        });
        if (!user) {
            throw new error_response_1.notFoundException("Invalid account");
        }
        if (!(await (0, hash_security_1.compareHash)(otp, user.resetPasswordOtp))) {
            throw new error_response_1.ConflictException("Invalid otp");
        }
        if (!user) {
            throw new error_response_1.notFoundException("Invalid account");
        }
        const result = await this.userModel.updateOne({
            filter: { email },
            update: {
                $unset: { resetPasswordOtp: true },
                password: await (0, hash_security_1.generateHash)(password),
                changedCredntialTime: new Date(),
            },
        });
        if (!result.matchedCount) {
            throw new error_response_1.badRequestException("Something went wrong");
        }
        return res.status(200).json({ message: "Done" });
    };
}
exports.default = new AuthentcationService();
