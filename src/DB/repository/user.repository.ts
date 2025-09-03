import { CreateOptions, HydratedDocument, Model } from "mongoose";
import { IUser as IDocument } from "../models/User.model";
import { DatabaseRepository } from "./db.repository";
import { badRequestException } from "../../utils/responses/error.response";



export class UserRepository extends DatabaseRepository<IDocument> {
  constructor(protected override readonly model: Model<IDocument>) {
    super(model);
  }

 


  async createUser({
    data,
    options,
  }: {
    data: Partial<IDocument>[];
    options?: CreateOptions;
  }): Promise<HydratedDocument<IDocument>> {
    const [user] = (await this.model.create(data, options)) || [];
    if (!user) {
      throw new badRequestException("User not created");
    }
    return user;
  }
}