'use client'
import {useState, useEffect, Suspense} from 'react'
import './page.css'
import { questions } from "./questions";
import {useSearchParams} from "next/navigation";
import {validateVersion} from "@/lib/utils/validation";
import {UsageRequest} from "@/lib/types/types";
import {extractOtherPrecision, writeAnswerJSON, writeMail} from "@/app/uninstallation/feedback/utils";

const precisionPrefix = "precision: "

export default function Page() {
    return (
        <Suspense>
            <App />
        </Suspense>
    )
}

export function App() {
    const searchParams = useSearchParams()
    const version = searchParams.get("version")
    const buildType = searchParams.get("buildtype")

    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const [steps, setSteps] = useState([0, 3, 5])
    const [answers, setAnswers] = useState<Map<string, string>>(new Map())
    const [finished, setFinished] = useState(false)
    const [sent, setSent] = useState(false)

    const [recordId, setRecordId] = useState<number | null>(null)

    useEffect(() => {
        if(!version || !buildType || !validateVersion(version)) return
        fetch("/api/usage", {
            method: "POST",
            body: JSON.stringify({
                version: version,
                action: "uninstallation",
                beta: (buildType === "debug"),
            } as UsageRequest)
        })
            .then(res => res.json())
            .then(data => {
                setRecordId(data.record_id)
            })
    }, [])

    if(!version || !buildType) {
        return <h1>Invalid Usage</h1>
    }
    if(!validateVersion(version)) {
        return <h1>Invalid Version {version}</h1>
    }

    const addStep = (step: number, stepsList: number[]): number[] => {
        if(stepsList.includes(step)) return stepsList
        // insert step after currentIndex
        const newSteps = [...stepsList]
        newSteps.splice(currentStepIndex + 1, 0, step)
        return newSteps
    }
    const onAnswer = (answer: string) => {
        console.log("Answered:", answer)
        const splitAnswer = answer.split("; ")
        if(currentStepIndex == 0) {
            let newSteps = steps
            if(splitAnswer.includes("wrong_functionality") || splitAnswer.includes("lack_of_features")) {
                newSteps = addStep(2, newSteps)
            }
            if(splitAnswer.includes("hard_to_use")) {
                newSteps = addStep(1, newSteps)
            }
            if(splitAnswer.includes("not_working") || splitAnswer.includes("performance_issues")) {
                newSteps = addStep(4, newSteps)
            }
            if(newSteps !== steps) {
                setSteps(newSteps)
            }
        }
        setAnswers(answers.set(questions[steps[currentStepIndex]].text, answer))
        if(currentStepIndex + 1 < steps.length) {
            setCurrentStepIndex(currentStepIndex + 1)
        } else {
            console.log("Survey completed")
            setFinished(true)
        }
    }
    return (
        <>
            <h1>Sad to see you go</h1>
            <h3>Please take a few clicks to help us make Emojeezer better</h3>
            <div className={"surveyCard"}>
                <div className={"surveyHeader"}>
                    <p>{currentStepIndex + 1}/{steps.length}</p>
                    {/*<code>[{steps.join(", ")}]</code>*/}
                    <button style={{fontWeight: 'lighter', display: currentStepIndex === 0 ? "none" : "block"}}
                            onClick={() => {
                                setCurrentStepIndex(currentStepIndex - 1)
                                setFinished(false)
                            }
                            }
                    >{"< Previous"}</button>
                </div>
                {!finished && <Question
                    question={questions[steps[currentStepIndex]].text}
                    possibleAnswers={questions[steps[currentStepIndex]].answers}
                    onAnswer={onAnswer}
                    previousAnswer={answers.get(questions[steps[currentStepIndex]].text) || ""}
                    lastQuestion={currentStepIndex === steps.length - 1}
                />}
                {finished &&
                    <div className={"formContainer"}>
                        <h2>Thank you for your feedback!</h2>
                        <p>The following informations will be sent to the support when you click &#39;confirm&#39; : </p>
                        <code className={"mailPreview"}>
                            {writeMail(answers, precisionPrefix)}
                        </code>
                        {!sent && <button
                            style={{backgroundColor: "#204895"}}
                            onClick={() => {
                                console.log("Sending mail...")
                                fetch("/api/feedback-offboard", {
                                    method: "POST",
                                    headers: {
                                        "Content-Type": "application/json"
                                    },
                                    body: JSON.stringify({
                                        json: writeAnswerJSON(answers, precisionPrefix),
                                        mailContent: writeMail(answers, precisionPrefix),
                                        recordId: recordId
                                    })
                                })
                                setSent(true)
                            }}>Confirm</button>}
                        {sent && <h3>Done!</h3>}
                    </div>
                }
            </div>
        </>
    )
}

function Question({question, possibleAnswers, onAnswer, previousAnswer: previous = "", usePreviousAnswer: usePrevious = true, lastQuestion = false}:
                  {
                      question: string;
                      possibleAnswers: {name: string, text: string}[]
                      previousAnswer?: string
                      onAnswer: (answer: string) => void
                      usePreviousAnswer?: boolean,
                      lastQuestion?: boolean
                  }
) {
    const [answer, setAnswer] = useState("")
    const [currentQuestion, setCurrentQuestion] = useState("")
    const [otherPrecision, setOtherPrecision] = useState("")
    if(currentQuestion !== question) {
        setCurrentQuestion(question)
        const {form, other} = extractOtherPrecision(previous, precisionPrefix)
        setAnswer(usePrevious ? form : "")
        setOtherPrecision(usePrevious ? other : "")
    }
    return (
        <div className={"formContainer"}>
            <h2>{question}</h2>
            <p className={"surveyIndicator"}>Please select all that apply:</p>
            <form className={"surveyForm"} onSubmit={(e) => {
                e.preventDefault()
                if(answer === "" && otherPrecision === "")
                    onAnswer("skip")
                else {
                    let finalAnswer = answer
                    if(otherPrecision !== "") {
                        finalAnswer += "; " + precisionPrefix + "; " + otherPrecision
                    }
                    onAnswer(finalAnswer)
                }
                setAnswer("")
                setOtherPrecision("")
            }}>
                <div className={"answerZone"}>
                    {possibleAnswers.length > 0 && possibleAnswers.map((ans) => (
                        <label key={ans.name} className={"surveyAnswer"}>
                            <input type="checkbox" id={ans.name} name={ans.name} checked={answer.split("; ").includes(ans.name)}
                                   onChange={(e) => {
                                       const answerList = answer.split("; ")
                                       if(answerList.includes(ans.name) && !e.target.checked) {
                                           // remove from list
                                           const newAnswerList = answerList.filter(a => a !== ans.name)
                                           setAnswer(newAnswerList.join("; "))
                                       } else if(!answerList.includes(ans.name) && e.target.checked) {
                                           // add to list
                                           answerList.push(ans.name)
                                           setAnswer(answerList.join("; "))
                                       }
                                   }}/>
                            {ans.text}
                        </label>
                    ))}
                    <label className={"surveyAnswer otherAnswer"}>
                        <textarea placeholder={"Other"}
                                  style={{resize: "vertical", width: "100%"}}
                                  value={otherPrecision}
                                  onInput={(e) => {
                                      const target = e.target as HTMLTextAreaElement
                                      setOtherPrecision(target.value)
                                  }}
                        />
                    </label>
                </div>
                <button type={"submit"} className={"surveySubmit"}>{lastQuestion ? "Finish" : ((answer === "" && otherPrecision === "") ? "Skip" : "Next")}</button>
            </form>
        </div>
    )
}