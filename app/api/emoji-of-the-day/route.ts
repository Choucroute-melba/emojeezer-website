import {neon} from "@neondatabase/serverless";
import data from "emojibase-data/en/compact.json"

if(!process.env.DATABASE_URL)
    throw new Error("Missing database url")
const sql = neon(process.env.DATABASE_URL)

export async function GET() {
    const date = new Date()
    const formattedDate = `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`
    let result = await sql`SELECT * FROM emoji_of_the_day WHERE date = ${formattedDate}`
    let emoji = ""
    if(result.length === 0) {
        const randomIndex = Math.floor(Math.random() * data.length)
        await sql`INSERT INTO emoji_of_the_day (date, unicode, get_count) VALUES (${formattedDate}, ${data[randomIndex].unicode}, 1)`
        emoji = data[randomIndex].unicode
    }
    else {
        emoji = result[0].unicode
        await sql `UPDATE emoji_of_the_day SET get_count = get_count + 1 WHERE date = ${formattedDate}`
    }

    return new Response(emoji, {status: 200, headers: {"Cache-Control": "public, max-age=60000"}})
}