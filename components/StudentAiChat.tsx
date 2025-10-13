import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import SendIcon from './icons/SendIcon';
import RobotIcon from './icons/RobotIcon';
import AiThinking from './AiThinking';
import AnalyticsReport from './AnalyticsReport';
import { Student } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import { GEMINI_API_KEY } from '../utils/apiHUB';
import PlaceholderAvatar from './PlaceholderAvatar';

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
    onBack?: () => void;
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
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        const apiKey = GEMINI_API_KEY;

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
        setMessages([]); // Start with an empty message list
    }, [student, studentData]);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages, isLoading]);
    
    useEffect(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            const scrollHeight = textarea.scrollHeight;
            textarea.style.height = `${scrollHeight}px`;
        }
    }, [input]);

    const sendAiMessage = async (userInput: string) => {
        if (!chat) return;
        setIsLoading(true);
        setMessages(prev => [...prev, { role: 'model', text: '' }]);
        try {
            const responseStream = await chat.sendMessageStream({ message: userInput });
            let fullResponse = '';
            for await (const chunk of responseStream) {
                fullResponse += chunk.text;
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1].text = fullResponse;
                    return updated;
                });
            }
        } catch (error) {
            console.error("Error fetching AI response:", error);
            setMessages(prev => {
                const updated = [...prev];
                updated[updated.length - 1] = { role: 'model', text: "Sorry, I couldn't connect. Please check your network." };
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

    const renderMessageContent = (msg: Message, isLastMessage: boolean) => {
        if (isLoading && isLastMessage) return <AiThinking />;

        const { jsonData, remainingText } = extractAndParseJSON(msg.text);
        return (
            <div className="space-y-3">
                {remainingText && <div className="prose prose-sm dark:prose-invert max-w-none text-card-foreground" dangerouslySetInnerHTML={{ __html: remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
                {jsonData && <AnalyticsReport data={jsonData} />}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-background overflow-hidden">
            <header className="flex-shrink-0 flex items-center gap-4 p-3 border-b border-border bg-card shadow-sm">
                {onBack && (
                    <button onClick={onBack} className="p-2 rounded-full text-muted-foreground hover:bg-muted">
                        <ChevronLeftIcon className="h-6 w-6" />
                    </button>
                )}
                <div className="w-11 h-11 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <RobotIcon className="h-6 w-6 text-primary"/>
                </div>
                <div>
                    <h2 className="font-bold text-lg text-foreground">Sez AI</h2>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-success"></span>
                        Online
                    </p>
                </div>
            </header>

            <main ref={chatContainerRef} className="flex-grow overflow-y-auto thin-scrollbar p-4 md:p-6 space-y-6">
                {messages.map((msg, idx) => (
                    <div key={idx} className={`flex gap-3 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.role === 'model' && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                                <RobotIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                        )}
                        <div className={`max-w-md lg:max-w-xl rounded-2xl px-4 py-2.5 shadow-sm ${msg.role === 'user' ? 'bg-primary text-primary-foreground rounded-br-lg' : 'bg-card border border-border rounded-bl-lg'}`}>
                            {renderMessageContent(msg, idx === messages.length - 1)}
                        </div>
                        {msg.role === 'user' && (
                            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
                                {student.avatarUrl ? <img src={student.avatarUrl} alt="You" className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                            </div>
                        )}
                    </div>
                ))}
                {messages.length === 0 && !isLoading && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-4">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                            <RobotIcon className="h-10 w-10 text-primary"/>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Hi {student.name.split(' ')[0]}!</h1>
                        <p className="text-muted-foreground mt-2 max-w-md">I'm your personal AI assistant. Ask me anything about your schedule, tests, or doubts.</p>
                    </div>
                )}
            </main>

            <footer className="flex-shrink-0 p-2 sm:p-4 border-t border-border bg-card">
                <form onSubmit={handleSend} className="flex items-end gap-2 bg-muted p-2 rounded-2xl">
                    <textarea 
                        ref={textareaRef}
                        value={input} 
                        onChange={(e) => setInput(e.target.value)} 
                        onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                        placeholder="Ask a question..."
                        className="flex-grow py-2.5 px-3 bg-transparent focus:outline-none resize-none text-foreground" 
                        rows={1} 
                        disabled={isLoading}
                    />
                    <button 
                        type="submit" 
                        disabled={isLoading || !input.trim()} 
                        className="h-10 w-10 flex-shrink-0 rounded-full bg-primary text-primary-foreground disabled:bg-primary/50 disabled:cursor-not-allowed hover:bg-primary/90 transition-colors flex items-center justify-center"
                        aria-label="Send message"
                    >
                        <SendIcon className="h-5 w-5"/>
                    </button>
                </form>
            </footer>
        </div>
    );
};

export default StudentAiChat;