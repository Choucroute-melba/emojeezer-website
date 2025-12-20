import express from 'express';
import nodemailer from 'nodemailer';

console.log("Starting server...")
console.log(process.env.MAIL_HOST)
let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST as string,
    port: Number(process.env.MAIL_PORT),
    secure: true,
    auth: {
        user: process.env.MAIL_USER as string,
        pass: process.env.MAIL_PASSWORD as string
    }
});

try {
    transporter.verify().then(() => {
        console.log("Server is ready to take our messages")
    }).catch(err => {
        console.log("Failed to connect to the mail server", err)
    })
} catch (e) {
    console.log("Failed to connect to the mail server", e)
}

const app = express();
app.use(express.json());

app.post('/api/feedback', async (req, res) => {
    const { mailContent } = req.body;
    // Use nodemailer here to send the mailContent
    try  {
        await transporter.sendMail({
            from: '"Emojeezer Uninstallation" <>',
            to: 'vivien@netc.fr',
            subject: 'Feedback on Emojeezer Uninstallation',
            text: mailContent,
        });
    } catch (e) {
        console.error("Failed to send the mail", e)
    }
    res.status(200).send({ message: "Received!" });
});

app.listen(3001, () => console.log('Server running on port 3001'));