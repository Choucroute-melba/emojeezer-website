import { useState } from 'react'
import './App.css'

const precisionPrefix = "precision: "

function App() {
    const [currentStepIndex, setCurrentStepIndex] = useState(0)
    const questions = [
        {
            text: "The add-on did not meet your expectations ?",
            answers: [
                {
                    name: "it_did",
                    text: "It did"
                },
                {
                    name: "wrong_functionality",
                    text: "It was not what I was looking for"
                },
                {
                    name: "lack_of_features",
                    text: "It lacked important features that I wanted"
                },
                {
                    name: "hard_to_use",
                    text: "It was hard to use"
                },
                {
                    name: "performance_issues",
                    text: "It had performance issues"
                },
                {
                    name: "not_working",
                    text: "It was not working as expected"
                }
            ]
        },
        {
            text: "What did you find hard to use ?",
            answers: [
                {
                    name: "confusing_ui",
                    text: "The user interface was confusing"
                },
                {
                    name: "hidden_browser_action",
                    text: "can't find the settings or browser action"
                }
            ]
        },
        {
            text: "What were you looking for that you didn't find ?",
            answers: [
                {
                    name: "lack_theming",
                    text: "Lack of theming/customization options"
                },
                {
                    name: "lack_integration",
                    text: "Lack of integration with other tools/services"
                },
                {
                    name: "lack_translations",
                    text: "Lack of translations/localization"
                },
                {
                    name: "lack_discoverability",
                    text: "Lack of discoverability of emojis"
                },
                {
                    name: "lack_skin_variants",
                    text: "Lack of skin tone variants"
                }
            ]
        },
        {
            text: "What made you try this add-on ?",
            answers: [
                {
                    name: "looking_around",
                    text: "I was just looking around"
                },
                {
                    name: "friend_recommendation",
                    text: "Someone recommended it to me"
                },
            ]
        },
        {
            text: "What was not working as expected ? Please precise specific websites or scenarios in the 'other' field.",
            answers: [
                {
                    name: "specific_websites_not_working",
                    text: "It did not work on the websites I use (please precise)"
                },
                {
                    name: "insertion_issues",
                    text: "The emoji did not insert when I selected id"
                },
                {
                    name: "invisible_selector",
                    text: "The selector did not appear"
                },
                {
                    name: "ugly_ui",
                    text: "The UI is ugly or has visual glitches"
                },
                {
                    name: "performance_issues",
                    text: "The add-on was slow, laggy or crashing"
                },
                {
                    name: "replacement_issues",
                    text: "Pressing enter sent the message instead of inserting the emoji"
                }
            ]
        },
        {
            text: "Any other feedback you would like to share with us ?",
            answers: []
        }
    ]
    const [steps, setSteps] = useState([0, 3, 5])
    const [answers, setAnswers] = useState<Map<string, string>>(new Map())
    const [finished, setFinished] = useState(false)

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
    const writeMail = (): string => {
        let mail = "Subject: Feedback on Emojeezer Uninstallation\n\n"
        for(const [question, answer] of answers) {
            const questionIndex = questions.findIndex(q => q.text === question)
            mail += question + ": " + "\n"
            const {form, other} = extractOtherPrecision(answer)
            const splitAnswer = form.split("; ")
            for(const ans of splitAnswer) {
                const ansText = questions[questionIndex].answers.find((a: any) => a.name === ans)
                if(ansText) mail += "\t- " + ansText.text + "\n"
            }
            if(other !== "") mail += "\t- " + other + "\n"
            mail += "\n"
        }
        mail += "\n##JSON_DATA\n"
        mail += writeAnswerJSON()
        return mail
    }
    const writeAnswerJSON = (): string => {
        const obj: {question: string, answer: string[]}[] = []
        for(const [question, answer] of answers) {
            let elt = {
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
  return (
    <>
        <h1>Sad to see you go</h1>
        <h3>Please take two clicks to help us make this add-on better</h3>
        <div className={"surveyCard"}>
            <div className={"surveyHeader"}>
                <p>{currentStepIndex + 1}/{steps.length}</p>
                <code>[{steps.join(", ")}]</code>
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
                    <p>The following mail will be sent to the support (vivien@netc.fr) when you click 'confirm' : </p>
                    <code className={"mailPreview"}>
                        {writeMail()}
                    </code>
                    <button
                        style={{backgroundColor: "#204895"}}
                        onClick={() => {
                            console.log("Sending mail...")
                            fetch("/api/feedback-offboard", {
                                method: "POST",
                                headers: {
                                    "Content-Type": "application/json"
                                },
                                body: JSON.stringify({mailContent: writeMail()})
                            })
                        }}>Confirm</button>
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
        const {form, other} = extractOtherPrecision(previous)
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

function extractOtherPrecision(answer: string): { form: string, other: string } {
    const start = answer.indexOf(precisionPrefix);
    if (start === -1) return { form: answer, other: "" };

    // The 'form' is everything before the prefix (removing the trailing "; " if it exists)
    const formPart = answer.substring(0, start).replace(/;\s*$/, "");

    // The 'other' is everything after the prefix
    const otherPart = answer.substring(start + precisionPrefix.length);

    return { form: formPart, other: otherPart };
}

export default App;
