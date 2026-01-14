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

export default {
    async fetch(req: Request) {
        if(req.method !== "POST") return new Response("Method not allowed", {status: 405})
        const data = await req.json() as any
        const mailContent = "Emojeezer " + data.build + " has been updated to version " + data.toVersion + "."
        try {
            console.log("Sending mail:")
            await transporter.sendMail({
                from: '"Emojeezer Monitor" <vivienf@netc.fr>',
                to: 'pnom5939@gmail.com',
                subject: 'Emojeezer Update Notice',
                text: mailContent,
            });
        } catch (e) {
            console.error("Failed to send the mail", e)
            return new Response("Failed to send the mail", {status: 500})
        }

        console.log("Sent!")
        return new Response("Sent!")
    }
}