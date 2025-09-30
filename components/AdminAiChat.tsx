import React, { useState, useEffect, useRef } from 'react';
import { GoogleGenAI, Chat } from "@google/genai";
import SendIcon from './icons/SendIcon';
import RobotIcon from './icons/RobotIcon';
import UserCircleIcon from './icons/UserCircleIcon';
import AnalyticsReport from './AnalyticsReport';
import AiThinking from './AiThinking';
import UserPlusIcon from './icons/UserPlusIcon';
import { Student, Board, Gender } from '../types';
import { GRADES, BOARDS, TIME_SLOTS } from '../constants';
import { getProgramStage, getBatchFromTime } from '../utils/studentUtils';
import { useData } from '../context/DataContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import { GEMINI_API_KEY } from '../utils/apiHUB';

type Message = {
    role: 'user' | 'model';
    text: string;
};

interface FormStep {
  key: keyof Student;
  prompt: (data: Partial<Student>) => string;
  type: 'text' | 'select';
  options?: readonly string[];
  validate?: (input: string, options?: readonly string[]) => boolean;
  errorMessage?: (input: string, options?: readonly string[]) => string;
}

const formSteps: FormStep[] = [
  { key: 'name', prompt: () => "Got it. Let's add a new student. What is their full name?", type: 'text', validate: (input) => input.trim().length > 0, errorMessage: () => "Name cannot be empty." },
  { key: 'grade', prompt: (data) => `Great! What grade is ${data.name} in?`, type: 'select', options: GRADES, validate: (input, options) => options?.includes(input) ?? false, errorMessage: (input) => `"${input}" is not a valid grade.` },
  { key: 'board', prompt: () => "Which board are they studying under?", type: 'select', options: BOARDS, validate: (input, options) => options?.includes(input) ?? false, errorMessage: () => `That's not a valid board.` },
  { key: 'school', prompt: () => "What's the name of their school?", type: 'text', validate: (input) => input.trim().length > 0, errorMessage: () => "School name cannot be empty." },
  { key: 'timeSlot', prompt: () => "Which time slot will they attend?", type: 'select', options: TIME_SLOTS, validate: (input, options) => options?.includes(input) ?? false, errorMessage: () => `Invalid time slot.` },
  { key: 'notes', prompt: () => "Great, we're almost done. Would you like to add any private notes? (type 'skip' for none)", type: 'text', validate: () => true }
];

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

interface AdminAiChatProps {
    onBack: () => void;
}

const AdminAiChat: React.FC<AdminAiChatProps> = ({ onBack }) => {
    const { handleSaveStudent } = useData();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const [isFormMode, setIsFormMode] = useState(false);
    const [formStep, setFormStep] = useState(0);
    const [formData, setFormData] = useState<Partial<Student>>({});

    useEffect(() => {
        const apiKey = GEMINI_API_KEY;

        if (!apiKey) {
            setMessages([{ role: 'model', text: "AI Assistant is not configured correctly (missing API key)." }]);
            return;
        }

        try {
            const ai = new GoogleGenAI({ apiKey });
            const newChat = ai.chats.create({ model: 'gemini-2.5-flash', config: { systemInstruction: `You are "Sez AI", an expert assistant in a student management dashboard...` } });
            setChat(newChat);
            setMessages([{ role: 'model', text: "Hello! I am the Sez AI Assistant. How can I help?" }]);
        } catch (error) {
            console.error("Error initializing GoogleGenAI:", error);
            setMessages([{ role: 'model', text: "An error occurred while setting up the AI Assistant." }]);
        }
    }, []);

    useEffect(() => {
        chatContainerRef.current?.scrollTo({ top: chatContainerRef.current.scrollHeight, behavior: 'smooth' });
    }, [messages]);

    const startFormMode = () => {
        setIsFormMode(true);
        setFormStep(0);
        setFormData({});
        setMessages(prev => [...prev, { role: 'model', text: formSteps[0].prompt({}) }]);
    };

    const cancelFormMode = () => {
        setIsFormMode(false);
        setMessages(prev => [...prev, { role: 'model', text: "Okay, I've cancelled the student entry process." }]);
    };

    const handleFormInput = async (userInput: string) => {
        const currentStep = formSteps[formStep];
        const trimmedInput = userInput.trim();
        if (currentStep.validate && !currentStep.validate(trimmedInput, currentStep.options)) {
            const errorMsg = currentStep.errorMessage?.(trimmedInput, currentStep.options) || 'Invalid input.';
            setMessages(prev => [...prev, { role: 'model', text: errorMsg }]);
            setTimeout(() => setMessages(prev => [...prev, { role: 'model', text: currentStep.prompt(formData) }]), 300);
            return;
        }
        const isSkipped = trimmedInput.toLowerCase() === 'skip';
        const newFormData = isSkipped ? formData : { ...formData, [currentStep.key]: trimmedInput };
        setFormData(newFormData);
        const nextStepIndex = formStep + 1;
        if (nextStepIndex >= formSteps.length) {
            setIsLoading(true);
            setMessages(prev => [...prev, { role: 'model', text: "Perfect! Saving..." }]);
            const finalStudentData: Student = {
                id: `s_${Date.now()}`, name: newFormData.name!, grade: newFormData.grade!, board: newFormData.board! as Board, school: newFormData.school!, batch: getBatchFromTime(newFormData.timeSlot), timeSlot: newFormData.timeSlot!, isArchived: false, avatarUrl: null, programStage: getProgramStage(newFormData.board as Board, newFormData.grade) || undefined, notes: newFormData.notes,
            };
            try {
                await handleSaveStudent(finalStudentData);
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', text: `Success! I've added ${finalStudentData.name}.` };
                    return updated;
                });
            } catch (error) {
                setMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: 'model', text: `Sorry, there was an error.` };
                    return updated;
                });
            } finally {
                setIsLoading(false);
                setIsFormMode(false);
            }
        } else {
            setFormStep(nextStepIndex);
            setTimeout(() => setMessages(prev => [...prev, { role: 'model', text: formSteps[nextStepIndex].prompt(newFormData) }]), 500);
        }
    };
    
    const handleOptionClick = (option: string) => {
        if (isLoading || !isFormMode) return;
        setMessages(prev => [...prev, { role: 'user', text: option }]);
        handleFormInput(option);
    };

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
        if (isFormMode) handleFormInput(userInput); else sendAiMessage(userInput);
    };

    const renderMessage = (msg: Message, idx: number) => {
        if (!msg.text && !(isLoading && idx === messages.length -1)) return null;
        const { jsonData, remainingText } = extractAndParseJSON(msg.text);
        const currentFormStep = formSteps[formStep];
        const showOptions = isFormMode && idx === messages.length - 1 && currentFormStep?.type === 'select';
        return (
            <>
                {remainingText && <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
                {jsonData && <AnalyticsReport data={jsonData} />}
                {showOptions && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {currentFormStep.options?.map(option => <button key={option} onClick={() => handleOptionClick(option)} className="px-3 py-1.5 text-sm font-medium text-brand-blue bg-blue-100 rounded-lg hover:bg-blue-200 dark:bg-blue-900/50 dark:hover:bg-blue-900/80">{option}</button>)}
                    </div>
                )}
            </>
        );
    };

    return (
        <div className="flex flex-col h-[calc(100vh-112px)] max-w-4xl mx-auto">
             <button 
                onClick={onBack} 
                className="self-start mb-4 flex items-center gap-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-brand-blue dark:hover:text-brand-blue"
            >
                <ChevronLeftIcon className="h-5 w-5" /> Back to Selection
            </button>
            <div ref={chatContainerRef} className="flex-grow flex flex-col overflow-y-auto thin-scrollbar">
                {messages.length <= 1 && !isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center p-4">
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 text-transparent bg-clip-text pb-2 mb-4">Administrator AI</h1>
                        <p className="text-lg text-gray-500">Full access to all student data. How can I help?</p>
                    </div>
                ) : (
                    <main className="flex-grow p-6 space-y-6">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : ''}`}>
                                {msg.role === 'model' && <div className="w-10 h-10 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><RobotIcon className="h-6 w-6 text-indigo-500" /></div>}
                                <div className={`max-w-2xl rounded-2xl px-5 py-3 text-base shadow-sm ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-br-lg' : 'bg-light-card dark:bg-dark-card rounded-bl-lg'}`}>
                                    {isLoading && idx === messages.length - 1 ? <AiThinking /> : renderMessage(msg, idx)}
                                </div>
                                {msg.role === 'user' && <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center flex-shrink-0"><UserCircleIcon className="h-6 w-6 text-gray-500 dark:text-gray-300" /></div>}
                            </div>
                        ))}
                    </main>
                )}
            </div>
            <footer className="flex-shrink-0 p-4 pt-0">
                <form onSubmit={handleSend} className="flex items-center gap-3">
                    <textarea value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} placeholder={isFormMode ? formSteps[formStep]?.prompt(formData) : "Ask me anything..."} className="flex-grow p-3 rounded-lg border bg-transparent focus:ring-2 focus:ring-brand-blue resize-none max-h-32" rows={1} disabled={isLoading} />
                    <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-brand-blue text-white disabled:bg-gray-400 hover:bg-blue-600 transition-colors flex-shrink-0"><SendIcon className="h-6 w-6" /></button>
                </form>
                <div className="flex flex-wrap justify-center gap-3 pt-4 border-t border-gray-200 dark:border-gray-700 mt-4">
                    {!isFormMode ? (
                        <button onClick={startFormMode} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600"><UserPlusIcon className="h-5 w-5" />Add a New Student</button>
                    ) : (
                        <button onClick={cancelFormMode} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200 dark:bg-red-900/50 dark:text-red-300 dark:hover:bg-red-900/80">Cancel Student Entry</button>
                    )}
                </div>
            </footer>
        </div>
    );
};

export default AdminAiChat;