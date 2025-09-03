"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserRepository = void 0;
const db_repository_1 = require("./db.repository");
const error_response_1 = require("../../utils/responses/error.response");
class UserRepository extends db_repository_1.DatabaseRepository {
    model;
    constructor(model) {
        super(model);
        this.model = model;
    }
    async createUser({ data, options, }) {
        const [user] = (await this.model.create(data, options)) || [];
        if (!user) {
            throw new error_response_1.badRequestException("User not created");
        }
        return user;
    }
}
exports.UserRepository = UserRepository;
