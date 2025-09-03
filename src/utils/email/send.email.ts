import {createTransport} from 'nodemailer';
import Mail from 'nodemailer/lib/mailer';
import { badRequestException } from '../responses/error.response';

export const sendEmail = async(data:Mail.Options):Promise<void>  => {

    if(!data.html && !data.text && !data.attachments?.length) {
        throw new badRequestException('Email must have html or text');
    }
    const transporter = createTransport({

        service: 'gmail',
        auth: {
            user: process.env.EMAIL as string,
            pass: process.env.PASSWORD as string
        }
         
    });

    const info = await transporter.sendMail({
        ...data,
        from: process.env.EMAIL as string,
})



console.log(`Email sent: ${info.messageId}`);


}

