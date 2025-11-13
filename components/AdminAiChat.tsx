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
import { useStudent } from '../context/StudentContext';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import { GEMINI_API_KEY } from '../utils/apiHUB';
import { toTitleCase } from '../utils/stringUtils';

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
  { key: 'name', prompt: () => "Let's add a new student. What is their full name?", type: 'text', validate: (input) => input.trim().length > 0, errorMessage: () => "Name cannot be empty." },
  { key: 'grade', prompt: (data) => `Great! What grade is ${data.name} in?`, type: 'select', options: GRADES, validate: (input, options) => options?.includes(input) ?? false, errorMessage: (input) => `"${input}" is not a valid grade.` },
  { key: 'board', prompt: () => "Which board are they studying under?", type: 'select', options: BOARDS, validate: (input, options) => options?.includes(input) ?? false, errorMessage: () => `That's not a valid board.` },
  { key: 'school', prompt: () => "What's the name of their school?", type: 'text', validate: (input) => input.trim().length > 0, errorMessage: () => "School name cannot be empty." },
  { key: 'timeSlot', prompt: () => "Which time slot will they attend?", type: 'select', options: TIME_SLOTS, validate: (input, options) => options?.includes(input) ?? false, errorMessage: () => `Invalid time slot.` },
  { key: 'notes', prompt: () => "Almost done. Would you like to add any private notes? (You can also type 'skip')", type: 'text', validate: () => true }
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

const SuggestionChip: React.FC<{ onClick: () => void; children: React.ReactNode; icon?: React.ElementType }> = ({ onClick, children, icon: Icon }) => (
    <button onClick={onClick} className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-muted rounded-lg hover:bg-border transition-colors shadow-sm">
        {Icon && <Icon className="h-4 w-4" />}
        {children}
    </button>
);


const AdminAiChat: React.FC<AdminAiChatProps> = ({ onBack }) => {
    const { handleSaveStudent } = useStudent();

    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
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
        } catch (error) {
            console.error("Error initializing GoogleGenAI:", error);
            setMessages([{ role: 'model', text: "An error occurred while setting up the AI Assistant." }]);
        }
    }, []);

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

    const startFormMode = () => {
        setIsFormMode(true);
        setFormStep(0);
        setFormData({});
        setMessages(prev => [...prev, { role: 'user', text: "Add a new student" }, { role: 'model', text: formSteps[0].prompt({}) }]);
    };

    const cancelFormMode = () => {
        setIsFormMode(false);
        setMessages(prev => [...prev, { role: 'user', text: "Cancel" }, { role: 'model', text: "Okay, I've cancelled the student entry process." }]);
    };

    const handleFormInput = async (userInput: string) => {
        const currentStep = formSteps[formStep];
        const trimmedInput = toTitleCase(userInput.trim());
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
            setMessages(prev => [...prev, { role: 'model', text: "Perfect! Saving the new student profile..." }]);
            const finalStudentData: Student = {
                id: `s_${Date.now()}`, name: newFormData.name!, grade: newFormData.grade!, board: newFormData.board! as Board, school: newFormData.school!, batch: getBatchFromTime(newFormData.timeSlot), timeSlot: newFormData.timeSlot!, isArchived: false, avatarUrl: null, programStage: getProgramStage(newFormData.board as Board, newFormData.grade) || undefined, notes: newFormData.notes,
            };
            try {
                await handleSaveStudent(finalStudentData);
                setMessages(prev => [...prev, { role: 'model', text: `Success! I've added ${finalStudentData.name} to the directory.` }]);
            } catch (error) {
                 setMessages(prev => [...prev, { role: 'model', text: `Sorry, there was an error saving the student. Please try again later.` }]);
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
                updated[updated.length - 1] = { role: 'model', text: "Sorry, I couldn't connect. Please check the network and try again." };
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

    const renderMessageContent = (msg: Message, isLastMessage: boolean) => {
        if (isLoading && isLastMessage) return <AiThinking />;

        const { jsonData, remainingText } = extractAndParseJSON(msg.text);
        const currentFormStep = formSteps[formStep];
        const showOptions = isFormMode && isLastMessage && currentFormStep?.type === 'select';
        
        return (
            <div className="space-y-3">
                {remainingText && <div className="prose prose-sm dark:prose-invert max-w-none text-foreground leading-relaxed" dangerouslySetInnerHTML={{ __html: remainingText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\n/g, '<br/>') }} />}
                {jsonData && <AnalyticsReport data={jsonData} />}
                {showOptions && (
                    <div className="flex flex-wrap gap-2 pt-2">
                        {currentFormStep.options?.map(option => <button key={option} onClick={() => handleOptionClick(option)} className="px-3 py-1.5 text-sm font-medium text-primary bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors">{option}</button>)}
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col h-full bg-card rounded-2xl shadow-soft border border-border overflow-hidden">
            <header className="flex items-center gap-4 p-4 border-b border-border flex-shrink-0 bg-card/50 backdrop-blur-sm z-10">
                <button onClick={onBack} className="p-2 rounded-full text-muted-foreground hover:bg-muted transition-colors">
                    <ChevronLeftIcon className="h-5 w-5" />
                </button>
                 <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <RobotIcon className="h-6 w-6 text-primary"/>
                </div>
                <div>
                    <h2 className="font-bold text-lg text-foreground">Administrator AI</h2>
                    <p className="text-sm text-muted-foreground">Full data access</p>
                </div>
            </header>

            <main ref={chatContainerRef} className="flex-grow p-4 md:p-6 space-y-6 overflow-y-auto thin-scrollbar bg-muted/30">
                 {messages.length === 0 && !isLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-center opacity-0 animate-[fadeIn_0.5s_ease-out_forwards] min-h-[300px]">
                        <div className="w-20 h-20 rounded-full bg-primary/5 flex items-center justify-center mb-6">
                            <RobotIcon className="h-12 w-12 text-primary/80"/>
                        </div>
                        <h1 className="text-2xl font-bold text-foreground mb-2">How can I help you today?</h1>
                        <p className="text-muted-foreground max-w-md">Ask about students, work progress, tests, or manage the database directly.</p>
                    </div>
                 ) : (
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex gap-4 items-start ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-[slideIn_0.3s_ease-out]`}>
                            {msg.role === 'model' && (
                                <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center flex-shrink-0 shadow-sm mb-1">
                                    <UserCircleIcon className="h-5 w-5 text-primary" />
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
                                <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0 mt-1">
                                    <UserCircleIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                            )}
                        </div>
                    ))
                 )}
            </main>
            
            <footer className="p-4 border-t border-border flex-shrink-0 bg-card z-10">
                <div className="max-w-3xl mx-auto w-full">
                    {(!isFormMode && messages.length === 0) && (
                        <div className="flex flex-wrap justify-center gap-2 mb-4">
                            <SuggestionChip onClick={startFormMode} icon={UserPlusIcon}>Add Student</SuggestionChip>
                            <SuggestionChip onClick={() => handleFormInput("Show me pending tasks")}>Pending Tasks</SuggestionChip>
                            <SuggestionChip onClick={() => handleFormInput("Which tests are upcoming?")}>Upcoming Tests</SuggestionChip>
                        </div>
                    )}
                    {isFormMode && (
                         <div className="flex flex-wrap justify-center gap-2 mb-4">
                            <SuggestionChip onClick={cancelFormMode}>Cancel Entry</SuggestionChip>
                        </div>
                    )}
                    
                    <form onSubmit={handleSend} className="relative">
                        <textarea 
                            ref={textareaRef}
                            value={input} 
                            onChange={(e) => setInput(e.target.value)} 
                            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(e); } }} 
                            placeholder={isFormMode ? `Enter ${formSteps[formStep]?.key}...` : "Ask a question..."} 
                            className="w-full p-3.5 pl-14 pr-14 rounded-[1.5rem] border bg-muted/50 border-border focus:ring-2 focus:ring-primary/20 focus:border-primary focus:bg-background transition-all resize-none max-h-40 min-h-[52px] shadow-sm text-base text-center" 
                            rows={1} 
                            disabled={isLoading}
                        />
                        <button 
                            type="submit" 
                            disabled={isLoading || !input.trim()} 
                            className="absolute right-2 bottom-2 h-10 w-10 rounded-full bg-primary text-primary-foreground disabled:bg-muted disabled:text-muted-foreground hover:bg-primary/90 transition-all flex items-center justify-center shadow-md"
                        >
                            <SendIcon className="h-5 w-5 transform rotate-90"/>
                        </button>
                    </form>
                    <p className="text-[10px] text-center text-muted-foreground mt-2">
                        Sez AI can make mistakes. Check important info.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default AdminAiChat;