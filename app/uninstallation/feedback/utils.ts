import {questions} from "@/app/uninstallation/feedback/questions";

export function writeMail(answers: Map<string, string>, precisionPrefix: string): string {
    let mail = "Subject: Feedback on Emojeezer Uninstallation\n\n"
    for(const [question, answer] of answers) {
        const questionIndex = questions.findIndex(q => q.text === question)
        mail += question + ": " + "\n"
        const {form, other} = extractOtherPrecision(answer, precisionPrefix)
        const splitAnswer = form.split("; ")
        for(const ans of splitAnswer) {
            const ansText = questions[questionIndex].answers.find((a: {name: string}) => a.name === ans)
            if(ansText) mail += "\t- " + ansText.text + "\n"
        }
        if(other !== "") mail += "\t- " + other + "\n"
        mail += "\n"
    }
    mail += "\n##JSON_DATA\n"
    mail += writeAnswerJSON(answers, precisionPrefix)
    return mail
}

export function writeAnswerJSON(answers: Map<string, string>, precisionPrefix: string): string {
    const obj: {question: string, answer: string[]}[] = []
    for(const [question, answer] of answers) {
        const elt = {
            question: question,
            answer: answer.split("; ")
        }
        elt.answer = elt.answer.filter(a => {
            return (a !== " " && a !== " ;" && a !== ";" && a !== "; " && a !== "" && a !== "precision:" && a !== precisionPrefix);
        })
        obj.push(elt)
    }
    return JSON.stringify(obj, null, 2)
}

export function extractOtherPrecision(answer: string, precisionPrefix: string): { form: string, other: string } {
    const start = answer.indexOf(precisionPrefix);
    if (start === -1) return { form: answer, other: "" };

    // The 'form' is everything before the prefix (removing the trailing "; " if it exists)
    const formPart = answer.substring(0, start).replace(/;\s*$/, "");

    // The 'other' is everything after the prefix
    const otherPart = answer.substring(start + precisionPrefix.length);

    return { form: formPart, other: otherPart };
}
