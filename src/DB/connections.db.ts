import {connect} from 'mongoose';
import { UserModel } from './models/User.model';

export const connectDB = async (): Promise<void> => {
  try {
    const result = await connect(process.env.DB_URI as string, {
      serverSelectionTimeoutMS: 30000,
    });

    await UserModel.syncIndexes();
    console.log(result.models);
    
    console.log('Connected to MongoDB successfully:');
  } catch (error) {
    console.log('Error connecting to MongoDB:XX');
  }
};

export default connectDB;