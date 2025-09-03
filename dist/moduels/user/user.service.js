"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const token_security_1 = require("../../utils/security/token.security");
const User_model_1 = require("../../DB/models/User.model");
const user_repository_1 = require("../../DB/repository/user.repository");
const token_repository_1 = require("../../DB/repository/token.repository");
const Token_model_1 = require("../../DB/models/Token.model");
class UserService {
    userModel = new user_repository_1.UserRepository(User_model_1.UserModel);
    TokenModel = new token_repository_1.TokenRepository(Token_model_1.TokenModel);
    constructor() { }
    profile = async (req, res) => {
        return res.json({
            message: "User profile fetched successfully",
            data: { user: req.user?._id, decoded: req.decoded?.iat },
        });
    };
    logout = async (req, res) => {
        const { flag } = req.body;
        let statusCode = 200;
        const update = {};
        switch (flag) {
            case token_security_1.LogoutEnum.all:
                update.changedCredntialTime = new Date();
                break;
            default:
                await (0, token_security_1.createRevokedToken)(req.decoded);
                statusCode = 201;
                break;
        }
        await this.userModel.updateOne({
            filter: { _id: req.decoded?._id },
            update,
        });
        return res.status(statusCode).json({
            message: "User profile fetched successfully",
        });
    };
    refreshToken = async (req, res) => {
        const credential = await (0, token_security_1.createLoginCredential)(req.user);
        await (0, token_security_1.createRevokedToken)(req.decoded);
        return res.status(201).json({
            message: "Token refreshed successfully",
            data: { credential },
        });
    };
}
exports.default = new UserService();
