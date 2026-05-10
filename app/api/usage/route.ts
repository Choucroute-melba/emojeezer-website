import {NextRequest} from "next/server";
import {UsageRequest} from "@/lib/types/types";
import nodemailer from "nodemailer"
import {neon} from "@neondatabase/serverless"
import {validateVersion} from "@/lib/utils/validation";

export async function POST(req: NextRequest) {
    const data = await req.json() as UsageRequest;
    const version = data.version
    if(!validateVersion(version)) {
        return Response.json({reason : "Invalid version"}, {status: 400})
    }

    const sql = neon(`${process.env.DATABASE_URL}`)
    const result = await sql`INSERT INTO activity_record (timestamp, type, version, build_type) VALUES (current_timestamp, ${data.action}, ${version}, ${data.beta ? "beta" : "release"}) RETURNING id, timestamp`

    const sqlResponse = await sql`SELECT * FROM addon_activity WHERE version = ${version}`
    if(sqlResponse.length > 0) {
        const versionData = sqlResponse[0]
        let value = 0
        switch (data.action) {
            case "installation":
                value = versionData.install_count + 1
                break
            case "uninstallation":
                value = versionData.uninstall_count + 1
                break
            case "update":
                value = versionData.update_count + 1
                break
        }
        try {

            if (data.action === "installation") {
                await sql`UPDATE addon_activity SET install_count = ${value} WHERE version = ${version}`
            } else if (data.action === "uninstallation") {
                await sql`UPDATE addon_activity SET uninstall_count = ${value} WHERE version = ${version}`
            } else if (data.action === "update") {
                await sql`UPDATE addon_activity SET update_count = ${value} WHERE version = ${version}`
            }
        } catch (e) {
            console.error("Failed to update the database", e)
            return Response.json({reason : "Failed to update the database"}, {status: 500})
        }
    }
    else {
        try {
            await sql`INSERT INTO addon_activity (version, install_count, uninstall_count, update_count) VALUES (${version}, ${data.action === "installation" ? 1 : 0}, ${data.action === "uninstallation" ? 1 : 0}, ${data.action === "update" ? 1 : 0})`
        } catch (e) {
            console.error("Failed to update the database", e)
            return Response.json({reason : "Failed to update the database"}, {status: 500})
        }
    }

    // write email

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
        await transporter.verify()
        console.log("Server is ready to take our messages")
    } catch (e) {
        console.log("Failed to connect to the mail server", e)
        return Response.json({reason : "Failed to connect to the mail server"}, {status: 500})
    }

    const mailContent = "Emojeezer " + (data.beta ? "Beta " : " ") + data.action + "\n Version : " + data.version;
    try {
        console.log("Sending mail:")
        await transporter.sendMail({
            from: '"Emojeezer Monitor" <vivienf@netc.fr>',
            to: 'pnom5939@gmail.com',
            subject: 'Emojeezer ' + data.action + ' Notice',
            text: mailContent,
        });
    } catch (e) {
        console.error("Failed to send the mail", e)
        return new Response("Failed to send the mail", {status: 500})
    }

    console.log("Sent!")
    return new Response(JSON.stringify({record_id: result[0].id}), {status: 200, headers :{
        "Content-Type": "application/json"
        }});
}