import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import SendIcon from '../icons/SendIcon';
import RobotIcon from '../icons/RobotIcon';
import AiThinking from '../AiThinking';
import AnalyticsReport from '../AnalyticsReport';
import { Student } from '../../types';
import ChevronLeftIcon from '../icons/ChevronLeftIcon';
import { GEMINI_API_KEY } from '../../utils/apiHUB';
import PlaceholderAvatar from '../PlaceholderAvatar';
import { useData } from '../../context/DataContext';
import { FaSignOutAlt } from 'react-icons/fa';

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
    const { logout } = useData();
    const [showLogoutModal, setShowLogoutModal] = useState(false);
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
            textarea.style.height = `${Math.min(scrollHeight, 160)}px`;
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
                {remainingText && <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
                {jsonData && <AnalyticsReport data={jsonData} />}
            </div>
        );
    };

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-background h-[100dvh]">
            {/* Header */}
            <header className="flex-shrink-0 flex items-center justify-between gap-4 p-4 border-b border-border bg-card/80 backdrop-blur-xl z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    {onBack && (
                        <button onClick={onBack} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors">
                            <ChevronLeftIcon className="h-6 w-6" />
                        </button>
                    )}
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <RobotIcon className="h-6 w-6 text-primary"/>
                    </div>
                    <div>
                        <h2 className="font-bold text-lg text-foreground">Sez AI</h2>
                        <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                            <span className="h-2 w-2 rounded-full bg-success animate-pulse"></span>
                            Online
                        </p>
                    </div>
                </div>
                 <button
                    onClick={() => setShowLogoutModal(true)}
                    className="w-10 h-10 rounded-full overflow-hidden bg-muted border-2 border-card shadow-sm hover:ring-2 hover:ring-primary transition-all flex-shrink-0"
                >
                    {student.avatarUrl ? (
                        <img src={student.avatarUrl} alt={student.name} className="w-full h-full object-cover" />
                    ) : (
                        <PlaceholderAvatar />
                    )}
                </button>
            </header>

            {/* Main Message Area */}
            <main ref={chatContainerRef} className="flex-grow overflow-y-auto thin-scrollbar bg-muted/20 scroll-smooth p-4">
                <div className="max-w-3xl mx-auto flex flex-col gap-6 min-h-full justify-end">
                    {messages.length === 0 && !isLoading ? (
                        <div className="flex-grow flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] pb-10">
                            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center mb-6 shadow-inner">
                                <RobotIcon className="h-12 w-12 text-primary"/>
                            </div>
                            <h1 className="text-3xl font-bold text-foreground mb-3">Hi {student.name.split(' ')[0]}!</h1>
                            <p className="text-muted-foreground max-w-md text-lg px-4">
                                I'm here to help with your studies. Ask about your schedule, assignments, or tests.
                            </p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 items-end ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}>
                                {msg.role === 'model' && (
                                    <div className="w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center flex-shrink-0 shadow-sm mb-1">
                                        <RobotIcon className="h-5 w-5 text-primary" />
                                    </div>
                                )}
                                <div className={`max-w-[85%] lg:max-w-[75%] rounded-2xl px-5 py-3.5 shadow-sm leading-relaxed ${
                                    msg.role === 'user' 
                                        ? 'bg-primary text-primary-foreground rounded-br-sm' 
                                        : 'bg-card border border-border rounded-bl-sm'
                                }`}>
                                    {renderMessageContent(msg, idx === messages.length - 1)}
                                </div>
                                {msg.role === 'user' && (
                                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden border border-border mb-1">
                                        {student.avatarUrl ? <img src={student.avatarUrl} alt="You" className="w-full h-full object-cover" /> : <PlaceholderAvatar />}
                                    </div>
                                )}
                            </div>
                        ))
                    )}
                </div>
            </main>

            {/* Footer Input Area */}
            <footer className="flex-shrink-0 p-4 border-t border-border bg-card/80 backdrop-blur-xl z-10">
                <div className="max-w-3xl mx-auto w-full">
                    <form onSubmit={handleSend} className="relative flex items-end gap-2">
                        <textarea 
                            ref={textareaRef}
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                            placeholder="Ask a question..."
                            className="w-full p-3.5 pl-12 pr-12 rounded-[1.5rem] border bg-muted/50 border-border focus:ring-2 focus:ring-primary/30 focus:border-primary focus:bg-background transition-all resize-none max-h-32 min-h-[54px] shadow-sm text-base text-center" 
                            rows={1} 
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()} 
                            className="absolute right-2 bottom-2 h-10 w-10 rounded-full bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 transition-all flex items-center justify-center shadow-md"
                            aria-label="Send message"
                        >
                            <SendIcon className="h-5 w-5 transform rotate-90"/>
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-3">
                        Sez AI can make mistakes. Check important info.
                    </p>
                </div>
            </footer>
             {showLogoutModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)}>
                    <div className="bg-card p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-border" onClick={e => e.stopPropagation()}>
                        <div className="flex flex-col items-center text-center">
                            <div className="w-16 h-16 bg-danger-muted rounded-full flex items-center justify-center mb-4">
                                <FaSignOutAlt className="h-8 w-8 text-danger" />
                            </div>
                            <h3 className="text-xl font-bold text-foreground mb-2">
                                Confirm Logout
                            </h3>
                            <p className="text-muted-foreground mb-6">
                                Are you sure you want to logout?
                            </p>
                            <div className="flex gap-3 w-full">
                                <button 
                                    onClick={() => setShowLogoutModal(false)}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-muted text-muted-foreground hover:bg-border transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    onClick={logout}
                                    className="flex-1 py-2.5 rounded-xl font-semibold bg-danger text-danger-foreground hover:bg-danger/90 transition-colors"
                                >
                                    Logout
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StudentAiChat;