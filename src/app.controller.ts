import {resolve} from 'path';
import {config} from 'dotenv';
config({path: resolve(__dirname, '../config/.env.development')});

import type { Express, Request,Response,NextFunction } from 'express';
import express from 'express';
import cors from 'cors';
import authController from './moduels/auth/auth.controller';
import userController from './moduels/user/user.controller';
import helmet from 'helmet';
import { rateLimit } from 'express-rate-limit';
import { globalErrorHandling } from './utils/responses/error.response';
import connectDB from './DB/connections.db';


const limiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  limit: 2000, // Limit each IP to 2000 requests per `window` (here, per hour)
  message: 'Too many requests from this IP, please try again after an hour',
  statusCode: 429, // 429 status = Too Many Requests

});

const bootstrap = async ():Promise<void> => {
  const app:Express = express();
  const port: string | number= process.env.PORT||5000;
  app.use(express.json(), cors(), helmet(), limiter);
  

    app.get('/', (req: Request, res: Response, next: NextFunction) => {
        return res.status(200).json({message: 'Welcome to the TypeScript Application!'})
});

app.use('/auth', authController);
app.use('/user', userController);

app.use(globalErrorHandling); 


await connectDB();

  app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
  });
}
export default bootstrap;