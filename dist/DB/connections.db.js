"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectDB = void 0;
const mongoose_1 = require("mongoose");
const User_model_1 = require("./models/User.model");
const connectDB = async () => {
    try {
        const result = await (0, mongoose_1.connect)(process.env.DB_URI, {
            serverSelectionTimeoutMS: 30000,
        });
        await User_model_1.UserModel.syncIndexes();
        console.log(result.models);
        console.log('Connected to MongoDB successfully:');
    }
    catch (error) {
        console.log('Error connecting to MongoDB:XX');
    }
};
exports.connectDB = connectDB;
exports.default = exports.connectDB;
