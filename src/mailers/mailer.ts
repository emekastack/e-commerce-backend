import sendMail from "@sendgrid/mail"
import { config } from "../config/app.config";

sendMail.setApiKey(config.SENDGRID_API_KEY);

type Params = {
    to: string | string[];
    subject: string;
    text: string;
    html: string;
    from?: string;
};

export const sendEmail = async (data: Params) => {
    try {
        await sendMail.send({
            to: data.to,
            subject: data.subject,
            text: data.text,
            html: data.html,
            from: data.from || config.DEFAULT_EMAIL_FROM,
        });
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Failed to send email");
    }
}