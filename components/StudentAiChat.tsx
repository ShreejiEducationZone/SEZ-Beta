import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import SendIcon from './icons/SendIcon';
import RobotIcon from './icons/RobotIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import AiThinking from './AiThinking';
import AnalyticsReport from './AnalyticsReport';
import { Student } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';

type Message = {
    role: 'user' | 'model';
    text: string;
};

interface StudentAiChatProps {
    student: Student;
    studentData: {
        subjects: any[];
        progress: any[];
        work: any[];
        doubts: any[];
        tests: any[];
        attendance: any[];
    };
    onBack: () => void;
}

function extractAndParseJSON(text: string): { jsonData: any | null, remainingText: string } {
    const jsonRegex = /```json\s*([\s\S]*?)\s*```/g;
    let match;
    let jsonData = null;
    let remainingText = text;

    while ((match = jsonRegex.exec(text)) !== null) {
        if (match[1]) {
            try { jsonData = JSON.parse(match[1]); remainingText = text.replace(match[0], '').trim(); break; } catch (e) {}
        }
    }
    if (jsonData) return { jsonData, remainingText };
    let startIndex = -1;
    const firstBrace = text.indexOf('{');
    const firstBracket = text.indexOf('[');
    if (firstBrace === -1) startIndex = firstBracket; else if (firstBracket === -1) startIndex = firstBrace; else startIndex = Math.min(firstBrace, firstBracket);
    if (startIndex !== -1) {
        const charStart = text[startIndex];
        const charEnd = charStart === '{' ? '}' : ']';
        const endIndex = text.lastIndexOf(charEnd);
        if (endIndex > startIndex) {
            try { const parsedJson = JSON.parse(text.substring(startIndex, endIndex + 1)); return { jsonData: parsedJson, remainingText: (text.substring(0, startIndex) + text.substring(endIndex + 1)).trim() }; } catch (e) {}
        }
    }
    return { jsonData: null, remainingText: text };
}

const StudentAiChat: React.FC<StudentAiChatProps> = ({ student, studentData, onBack }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        // @FIX: Use environment variable for API key as per guidelines. This resolves the comparison error.
        const apiKey = process.env.API_KEY;

        if (!apiKey) {
            setMessages([{ role: 'model', text: "AI Assistant is not configured correctly (missing API key)." }]);
            return;
        }

        const ai = new GoogleGenAI({ apiKey });
        
        const systemInstruction = `
You are a helpful and friendly AI assistant for a student named ${student.name}.
Your name is Sez AI.
You can ONLY access and discuss the data provided below. Do not answer any questions about other students or any information outside of this context. If asked about another student or external topics, you MUST politely state that you only have access to ${student.name}'s information and cannot help with that request.

Here is all the data for ${student.name}:
---
Student Details: ${JSON.stringify(student, null, 2)}
---
Subjects and Chapters: ${JSON.stringify(studentData.subjects, null, 2)}
---
Syllabus Progress: ${JSON.stringify(studentData.progress, null, 2)}
---
Work Assignments: ${JSON.stringify(studentData.work, null, 2)}
---
Doubts Logged: ${JSON.stringify(studentData.doubts, null, 2)}
---
Test Records: ${JSON.stringify(studentData.tests, null, 2)}
---
Attendance Records: ${JSON.stringify(studentData.attendance, null, 2)}
---

Answer the student's questions based ONLY on this data. Be conversational and helpful. For example, if asked "What do I have to do today?", you should look at the 'workAssignments' for tasks due today and 'tests' for tests scheduled for today.
        `;

        const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction } });
        setChat(newChat);
        setMessages([{ role: 'model', text: `Welcome ${student.name}! I am your personal assistant. How can I help you today?` }]);
    }, [student, studentData]);

     useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const sendAiMessage = async (userInput: string) => {
        if (!chat) return;
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', text: '' }]);
        try {
            const responseStream = await chat.sendMessageStream({ message: userInput });
            for await (const chunk of responseStream) {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text += chunk.text;
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'model', text: "Sorry, I couldn't connect." };
                return updated;
            });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        const userInput = input.trim();
        if (!userInput || isLoading) return;
        setMessages(prev => [...prev, { role: 'user', text: userInput }]);
        setInput('');
        sendAiMessage(userInput);
    };

    const renderMessage = (msg: Message) => {
        const { jsonData, remainingText } = extractAndParseJSON(msg.text);
        return (
            <>
                {remainingText && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
                {jsonData && <AnalyticsReport data={jsonData} />}
            </>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-112px)] max-w-4xl mx-auto">
            <div className="relative mb-4 text-center flex items-center justify-center">
                <button 
                    onClick={onBack} 
                    className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue"
                >
                    <ChevronLeftIcon className="h-5 w-5" /> Back to Selection
                </button>
                <h2 className="text-xl font-bold">Chatting as {student.name}</h2>
            </div>
            
            <div ref={chatContainerRef} className="flex-grow overflow-y-auto thin-scrollbar p-6 space-y-6">
                 {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><RobotIcon className="h-6 w-6 text-indigo-500" /></div>}
                        <div className={`max-w-2xl rounded-2xl px-5 py-3 text-base shadow-sm ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-br-lg' : 'bg-light-card dark:bg-dark-card rounded-bl-lg'}`}>
                            {isLoading && idx === messages.length - 1 ? <AiThinking /> : renderMessage(msg)}
                        </div>
                        {msg.role === 'user' && <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" /></div>}
                    </div>
                ))}
            </div>
            
            <footer className="flex-shrink-0 p-4 pt-0">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder={`Ask about your schedule, tests, doubts...`} className="flex-grow p-3 rounded-lg border bg-transparent focus:ring-2 focus:ring-brand-blue resize-none max-h-32" rows={1} disabled={isLoading} />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-brand-blue text-white disabled:bg-gray-400 hover:bg-blue-600 transition-colors flex-shrink-0"><SendIcon className="h-6 w-6" /></button>
                </form>
            </footer>
        </div>
    );
};

export default StudentAiChat;