import twemoji from "@twemoji/api";

export function getEmojiUrl(emoji: string) {
    const imgString = twemoji.parse(emoji, {folder: "svg", ext: ".svg"})
    const splitted = imgString.split('"')
    let url = ""
    for(let i = 1; i < splitted.length; i++) {
        if(splitted[i].includes("src=")) {
            return splitted[i+1]
        }
    }
    return url
}