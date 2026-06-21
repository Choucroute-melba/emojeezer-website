import nodemailer from 'nodemailer';
import {NextRequest} from "next/server";
import {neon} from "@neondatabase/serverless";

console.log("Starting server...")
console.log(process.env.MAIL_HOST)
const transporter = nodemailer.createTransport({
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

export async function POST(req: NextRequest) {
    const json = await req.json() as any
    if(!json.json || !json.mailContent)
        return new Response("Bad Request", {status: 400})
    if(!process.env.DATABASE_URL)
        return new Response("Internal Error (bad env)", {status: 500})

    const sql = neon(process.env.DATABASE_URL)
    try {
        await sql`
            INSERT INTO offboard_survey (record_entry, data, reply_to)
            VALUES (${json.recordId}, ${json.json}, ${json.replyTo})
        `
    }
    catch (e) {
        console.error("Failed to insert the record", e)
        return new Response("Internal Error (database)", {status: 500})
    }

    console.log("Received mail content")
    const mailContent = json.mailContent + "\n\nRecord #" + json.recordId
    try {
        console.log("Sending mail:")
        await transporter.sendMail({
            from: '"Emojeezer Uninstallation" <vivienf@netc.fr>',
            to: 'vivien@netc.fr, pnom5939@gmail.com',
            subject: 'Feedback on Emojeezer Uninstallation',
            text: mailContent,
        });
    } catch (e) {
        console.error("Failed to send the mail", e)
        return new Response("Failed to send the mail", {status: 500})
    }

    console.log("Sent!")
    return new Response("Sent!")
}