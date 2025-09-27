// AiAssistantPage.tsx

import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import { Student, SubjectData, ChapterProgress, WorkItem, Doubt, Test, AttendanceRecord } from '../types';
import SendIcon from './icons/SendIcon';
import RobotIcon from './icons/RobotIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import AnalyticsReport from './AnalyticsReport';
import AiThinking from './AiThinking';

interface AiAssistantPageProps {
    students: Student[];
    allStudentSubjects: { [key: string]: { studentId: string; subjects: SubjectData[] } };
    chapterProgress: ChapterProgress[];
    workItems: WorkItem[];
    doubts: Doubt[];
    tests: Test[];
    attendanceRecords: AttendanceRecord[];
}

type Message = {
    role: 'user' | 'model';
    text: string;
};

// -------- JSON Parser -----------
function extractAndParseJSON(text: string): { jsonData: any | null, remainingText: string } {
    // Attempt to find JSON within markdown code blocks first
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;
    let jsonData = null;
    let remainingText = text;

    // Use a loop to handle multiple JSON blocks, though we'll only parse the first valid one.
    while ((match = jsonRegex.exec(text)) !== null) {
        if (match[1]) {
            try {
                jsonData = JSON.parse(match[1]);
                // If parsing is successful, remove this block from the text and break
                remainingText = text.replace(match[0], '').trim();
                break;
            } catch (e) {
                // Ignore parsing errors and continue, maybe another block is valid
            }
        }
    }

    // If we found and parsed JSON from a markdown block, return it
    if (jsonData) {
        return { jsonData, remainingText };
    }
    
    // Fallback if no valid JSON in markdown: find first '{' or '[' and last '}' or ']'
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    let startIndex = -1;

    if (firstBrace === -1) startIndex = firstBracket;
    else if (firstBracket === -1) startIndex = firstBrace;
    else startIndex = Math.min(firstBrace, firstBracket);

    if (startIndex !== -1) {
        const charStart = text[startIndex];
        const charEnd = charStart === '{' ? '}' : ']';
        const endIndex = text.lastIndexOf(charEnd);

        if (endIndex > startIndex) {
            const jsonString = text.substring(startIndex, endIndex + 1);
            try {
                const parsedJson = JSON.parse(jsonString);
                // We have valid JSON, so let's treat it as the main data
                // The remaining text is anything outside this JSON block
                const preText = text.substring(0, startIndex);
                const postText = text.substring(endIndex + 1);
                return { 
                    jsonData: parsedJson, 
                    remainingText: (preText + postText).trim() 
                };
            } catch (e) {
                // The substring was not valid JSON, so we treat the whole thing as text
            }
        }
    }
    
    return { jsonData: null, remainingText: text };
}


const AiAssistantPage: React.FC<AiAssistantPageProps> = ({
    students,
    allStudentSubjects,
    chapterProgress,
    workItems,
    doubts,
    tests,
    attendanceRecords
}) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // ----------- INIT CHAT ----------
    useEffect(() => {
        if (!process.env.API_KEY) {
            setMessages([{ role: 'model', text: "AI Assistant not configured: missing API key." }]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

            const dataForAI = {
                students: students.map(({ id, name, grade, board, batch, fatherName, isArchived }) => ({
                    id, name, grade, board, batch, fatherName, isArchived
                })),
                subjects: Object.values(allStudentSubjects).map(({ studentId, subjects }) => ({ studentId, subjects })),
                progress: chapterProgress,
                work: workItems,
                doubts: doubts,
                tests: tests,
                attendance: attendanceRecords
            };

            const jsonData = JSON.stringify(dataForAI);

            const systemInstruction = `
You are an advanced Student Analytics AI assistant named "Sez AI". Your primary function is to analyze the provided JSON data about students and answer questions accurately.

**Your Context is STRICTLY LIMITED to this data:**
${jsonData}

**Your Identity:**
- If a user asks about you ("who are you?", "what are you?", "who made you?"), you MUST respond with: "I am an Academic Assistant, people know me as SEZ-Ai, and I was created by the SEZ Developer team." This is your only identity. Do not deviate from this response for such questions.

**Your Task:**
1.  Carefully analyze the user's query.
2.  Answer the query based *only* on the student data provided in the JSON context.
3.  If a user asks for a "table format," you MUST provide the output in JSON format. This is a critical instruction.
4.  If the query is about a topic not covered in the data (e.g., world events, general knowledge), you MUST respond with: "I can only help with student-related inquiries."

**Handling Broad Queries:**
- If a user asks for "all details" or a similarly broad query about a specific student (e.g., "Show me everything for Rohan Sharma," "Tell me about Priya Patel"), DO NOT output all the raw data for that student.
- Instead, you MUST ask for clarification in a helpful and conversational manner.
- Your response should suggest specific areas of data you can analyze. For example: "Certainly! I can provide details for [Student Name]. What specific area are you interested in? I can analyze their:\n* Test performance\n* Attendance records\n* Recent work assignments\n* Open doubts\nLet me know what you'd like to see, and I'll prepare an analysis for you."
- Only after the user specifies what they want (e.g., "show me their tests"), you should provide the requested information in the correct format (JSON for analytical data).

**Handling Large Data Queries (like attendance, tests, etc.):**
- The dataset can contain records spanning a long time. When a user asks for a list of records like "attendance records", "all tests", "work history", "doubts list", or "progress entries" for a student, and they DO NOT specify a date range, you MUST NOT return the full list.
- Instead, you MUST ask for clarification on the time period.
- Example Response: "I can retrieve the attendance records for [Student Name]. To make the data more manageable, could you please specify a time period? For example, 'last 30 days', 'this month', or a specific date range."
- Only after the user provides a time frame should you filter the data and provide the results.

**Output Formatting Rules:**
-   For analytical requests (reports, risk analysis, lists, summaries), your response MUST be in a valid JSON format. Do not include any text outside of the JSON structure.
-   When generating JSON, you MUST OMIT the 'studentId', 'id', or any similar unique identifier field for students. The user only wants to see the student's name and other relevant data.
-   For conversational questions, respond naturally using markdown for formatting (e.g., bolding, lists).

**Instead, ask for clarification in a helpful and conversational manner, in the user’s language.

Example:

 - English: "Certainly! I can provide details for [Student Name]. What specific area are you interested in? I can analyze their:\n* Test performance\n* Attendance records\n* Recent work assignments\n* Open doubts\nLet me know what you'd like to see, and I'll prepare an analysis for you."

 - Hindi/Hinglish: "Bilkul! Main [Student Name] ke liye data provide kar sakta hoon. Aap kis area me details chahenge?\n* Test performance\n* Attendance records\n* Work assignments\n* Open doubts\nBataiye, main uske hisaab se analysis taiyar kar dunga."

**Important:** Do not invent or infer data that is not present in the provided JSON. If information is missing to answer a question, state that in your response or include it in a "required_data" field in your JSON output. Round all numbers to 2 decimal places if you perform any calculations.
`;

            const newChat = ai.chats.create({
                model: 'gemini-2.5-flash',
                config: { systemInstruction }
            });

            setChat(newChat);
            setMessages([]);
        } catch (err) {
            setMessages([{ role: 'model', text: "Failed to initialize AI assistant." }]);
        }
    }, [students, allStudentSubjects, chapterProgress, workItems, doubts, tests, attendanceRecords]);

    // ----------- Auto Scroll ----------
    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    // ----------- SEND HANDLER ----------
    const handleSend = async (e: React.FormEvent, prompt?: string) => {
        e.preventDefault();
        const userInput = prompt || input.trim();
        if (!userInput || isLoading || !chat) return;

        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'user', text: userInput }, { role: 'model', text: '' }]);
        setInput('');

        try {
            const stream = await chat.sendMessageStream({ message: userInput });

            for await (const chunk of stream) {
                setMessages(prev => {
                    const updated = [...prev];
                    if (updated[updated.length - 1].role === 'model') {
                        updated[updated.length - 1].text += chunk.text;
                    }
                    return updated;
                });
            }
        } catch {
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'model', text: "Error fetching AI response." };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const suggestionPrompts = [
        "a student with the lowest marks in Maths?",
        "Show syllabus progress of a specific student",
        "List of students with 100% attendance this month",
        "How many students are absent today?"
    ];

    // ----------- MESSAGE RENDERER ----------
    const renderMessage = (msg: Message) => {
        if (!msg.text) return null;
        
        const { jsonData, remainingText } = extractAndParseJSON(msg.text);

        const renderText = (text: string) => {
            if (!text.trim()) return null;

            // More robust markdown-to-HTML
            let html = text
                .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Bold
                .replace(/\*(.*?)\*/g, '<em>$1</em>');       // Italic

            const lines = html.split('\n');
            let listHtml = '';
            let inList = false;

            const closeList = () => {
                if (inList) {
                    listHtml += '</ul>';
                    inList = false;
                }
            };
            
            const renderedElements = lines.map(line => {
                const trimmed = line.trim();
                if (trimmed.startsWith('* ') || trimmed.startsWith('- ')) {
                    if (!inList) {
                        inList = true;
                        listHtml += '<ul>';
                    }
                    listHtml += `<li>${trimmed.substring(2)}</li>`;
                    return null;
                } else {
                    closeList();
                    if (trimmed.startsWith('# ')) {
                        return `<h3 class="font-bold text-lg mt-2">${trimmed.substring(2)}</h3>`;
                    }
                    return line ? `<p>${line}</p>` : '';
                }
            }).filter(Boolean);
            
            closeList();

            const finalHtml = renderedElements.join('') + listHtml;

            return <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-2 prose-li:my-0.5" dangerouslySetInnerHTML={{ __html: finalHtml }} />;
        };
        
        return (
            <>
                {renderText(remainingText)}
                {jsonData && <AnalyticsReport data={jsonData} />}
            </>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-112px)] max-w-4xl mx-auto">
            <div ref={chatContainerRef} className="flex-grow flex flex-col overflow-y-auto thin-scrollbar">
                {messages.length === 0 && !isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text pb-2 mb-4">
                            Welcome to Sez AI
                        </h1>
                        <p className="text-lg text-gray-500">Your academic assistant. How can I help?</p>
                    </div>
                ) : (
                    <main className="flex-grow p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && (
                                    <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0">
                                        <RobotIcon className="h-6 w-6 text-indigo-500" />
                                    </div>
                                )}
                                <div className={`prose dark:prose-invert max-w-2xl rounded-2xl px-5 py-3 text-base shadow-sm 
                                    ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-br-lg' : 'bg-light-card dark:bg-dark-card rounded-bl-lg'}`}>
                                    {isLoading && idx === messages.length - 1 ? (
                                        <AiThinking />
                                    ) : (
                                        renderMessage(msg)
                                    )}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0">
                                        <UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" />
                                    </div>
                                )}
                            </div>
                        ))}
                    </main>
                )}
            </div>

            <footer className="flex-shrink-0 p-4 pt-0">
                {messages.length === 0 && !isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {suggestionPrompts.map(p => (
                            <button
                                key={p}
                                onClick={(e) => handleSend(e, p)}
                                className="p-4 bg-light-card dark:bg-dark-card rounded-lg border hover:bg-gray-100 dark:hover:bg-gray-700/50 text-left transition-colors text-sm font-medium"
                            >
                                {p}
                            </button>
                        ))}
                    </div>
                )}
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                                e.preventDefault();
                                handleSend(e);
                            }
                        }}
                        placeholder="Ask about students..."
                        className="flex-grow p-3 rounded-lg border bg-transparent focus:ring-2 focus:ring-brand-blue resize-none max-h-32"
                        rows={1}
                        disabled={isLoading}
                    />
                    <button
                        type="submit"
                        disabled={isLoading || !input.trim()}
                        className="p-3 rounded-full bg-brand-blue text-white disabled:bg-gray-400 hover:bg-blue-600 transition-colors flex-shrink-0"
                    >
                        <SendIcon className="h-6 w-6" />
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default AiAssistantPage;