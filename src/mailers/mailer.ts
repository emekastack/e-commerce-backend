import { createTransport } from "nodemailer";
import { config } from "../config/app.config";

type Params = {
  to: string | string[];
  subject: string;
  text: string;
  html: string;
  from?: string;
};

const transporter = createTransport({
    host: config.BREVO_HOST_URL,
    port: 465,
    auth: {
        user: config.BREVO_USER,
        pass: config.BREVO_PASS_KEY,
    }    
})

export const sendEmail = async ({
    to,
    subject,
    text,
    html,
    from = config.BREVO_USER
}: Params) => {
    try {
        const info = await transporter.sendMail({
            from,
            to: Array.isArray(to) ? to.join(", ") : to,
            subject,
            text,
            html
        });
        console.log("Email sent: ", info.messageId);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Failed to send email");
    }
}