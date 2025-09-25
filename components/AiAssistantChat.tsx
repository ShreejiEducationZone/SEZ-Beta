import React, { useState, useEffect, useRef } from 'react';
import { Student, SubjectData } from '../types';
import { GoogleGenAI, Chat, GenerateContentResponse } from "@google/genai";
import XIcon from './icons/XIcon';
import SendIcon from './icons/SendIcon';
import RobotIcon from './icons/RobotIcon';

interface AiAssistantChatProps {
    student: Student;
    onApply: (subjects: SubjectData[]) => void;
    onClose: () => void;
}

type Message = {
    role: 'user' | 'model';
    text: string;
};

const AiAssistantChat: React.FC<AiAssistantChatProps> = ({ student, onApply, onClose }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [aiParsedData, setAiParsedData] = useState<SubjectData[] | null>(null);
    const [chat, setChat] = useState<Chat | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
    // TEMPORARY: Hardcoded API key for local development
    const ai = new GoogleGenAI({ apiKey: "AIzaSyC2ZOK0jGIUrSpEW55D5rQnDTDQvdoQASM" });
        
        const systemInstruction = `You are the “AI Subject Builder,” an expert curriculum designer inside an education dashboard. Your role is to help a mentor create subject and chapter lists for a specific student.

**Student Context (Do not ask for this, you already know it):**
- Grade: ${student.grade}
- Board: ${student.board}

**Your Core Task: A Two-Step Conversation**

**Step 1: Generate Data & Ask for Format**
When the user asks for a curriculum (e.g., "Give me Science chapters for Grade 10 CBSE," "NCERT math syllabus," etc.), your first action is to generate the requested subject and chapter data internally.
However, **DO NOT** output this data immediately.
Instead, your first response must be to ask the user for their preferred format. Your reply should be polite and clear, like this example:

"I have prepared the chapter list for Science (Grade 10 – CBSE).
👉 Please choose how you'd like to view the results:
1. 📜 View as List (for easy reading)
2. 🧩 View as JSON (to use in the editor)

You can reply with 'list', 'json', or 'both'."

**Step 2: Provide Data in the Chosen Format**
In your next response, based on the user's choice:

- If the user types **"list"**:
  Provide a clean, human-readable, formatted list. For example:
  **Science – Grade 10**
  1. Chemical Reactions and Equations
  2. Acids, Bases and Salts
  3. Metals and Non-metals

- If the user types **"json"**:
  Provide **ONLY** the raw, valid JSON. This is critical for the application to work. The JSON structure MUST be an ARRAY of subjects, even if there is only one, where each chapter is an object with "no" and "name".
  Correct Structure: \`[{"subject": "Science", "chapters": [{"no": 1, "name": "Chemical Reactions and Equations"}, ... ]}]\`
  **DO NOT** wrap the JSON in markdown backticks (\`\`\`json) or add any explanatory text before or after it.

- If the user types **"both"**:
  Provide the human-readable list first, then provide the raw JSON object below it, separated by a clear marker.

- **Default Behavior**: If the user's response is unclear or doesn't specify a format, default to providing the **"list"** format, as it's the most user-friendly for reading.

**Follow-up Questions:**
If the user asks to modify a list (e.g., "add two more chapters to Science"), generate the updated list internally and repeat the process from Step 1 (ask for the format again).

**Supported Languages:**
You must be able to understand and respond in English, Hindi, and Gujarati.`;

        const newChat = ai.chats.create({
            model: 'gemini-2.5-flash',
            config: {
                systemInstruction: systemInstruction,
            },
        });
        setChat(newChat);

        // Reset messages when student changes, keeping the intro
        setMessages([
            { role: 'model', text: `Hi! I'm the AI Subject Builder. How can I help you plan the curriculum for ${student.name}? You can ask for subjects for their grade and board, even in Hindi or Gujarati.` }
        ]);

    }, [student]);

    // Auto-scroll to the bottom of the chat on new messages
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const generateResponse = async (userInput: string) => {
        if (!chat) return;

        setIsLoading(true);
        setAiParsedData(null); // Reset parsed data on new request
        const userMessage: Message = { role: 'user', text: userInput };
        setMessages(prev => [...prev, userMessage]);

        try {
            const response: GenerateContentResponse = await chat.sendMessage({ message: userInput });
            const resultText = response.text;
            
            setMessages(prev => [...prev, { role: 'model', text: resultText }]);

            // After displaying the full response, try to find and parse JSON within it for the 'Apply' button.
            // This supports the "json" and "both" formats.
            const jsonStartIndex = resultText.indexOf('[{');
            if (jsonStartIndex !== -1) {
                const jsonEndIndex = resultText.lastIndexOf('}]');
                if (jsonEndIndex > jsonStartIndex) {
                    const jsonString = resultText.substring(jsonStartIndex, jsonEndIndex + 2);
                     try {
                        const parsedJson = JSON.parse(jsonString);
                        if (Array.isArray(parsedJson) && parsedJson.length > 0 && 'subject' in parsedJson[0] && 'chapters' in parsedJson[0]) {
                            setAiParsedData(parsedJson as SubjectData[]);
                        }
                    } catch (e) {
                        console.warn("Could not parse potential JSON from AI response snippet.", e);
                    }
                }
            }
        } catch (error) {
            console.error("AI chat error:", error);
            setMessages(prev => [...prev, { role: 'model', text: "Sorry, I encountered an error. Please try again or rephrase your request." }]);
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleSend = (e: React.FormEvent) => {
        e.preventDefault();
        if (input.trim() && !isLoading) {
            generateResponse(input.trim());
            setInput('');
        }
    };
    
    const handleApply = () => {
        if (!aiParsedData || aiParsedData.length === 0) {
            alert("Could not extract valid data from AI reply. Please try rephrasing your request to the AI.");
            return;
        }
        
        onApply(aiParsedData);
        alert("Subjects added from AI ✅");
        
        setAiParsedData(null); 
    };

    return (
        <div className="absolute bottom-0 left-0 right-0 h-[80%] max-h-[600px] bg-white dark:bg-dark-card border-t-2 border-indigo-300 dark:border-indigo-700 shadow-2xl rounded-t-2xl flex flex-col transition-transform transform translate-y-0 duration-300 ease-in-out">
            {/* Header */}
            <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
                <h3 className="text-lg font-semibold text-indigo-800 dark:text-indigo-300">AI Subject Builder</h3>
                <button onClick={onClose} className="p-1 rounded-full text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700">
                    <XIcon className="h-5 w-5" />
                </button>
            </header>

            {/* Chat Messages */}
            <div ref={chatContainerRef} className="flex-grow p-4 overflow-y-auto space-y-4">
                {messages.map((msg, index) => (
                    <div key={index} className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : ''}`}>
                        {msg.role === 'model' && <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><RobotIcon className="h-5 w-5 text-indigo-500"/></div>}
                        <div className={`whitespace-pre-wrap max-w-sm md:max-w-md rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'user' ? 'bg-brand-blue text-white rounded-br-lg' : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded-bl-lg'}`}>
                            {msg.text}
                        </div>
                    </div>
                ))}
                 {isLoading && (
                    <div className="flex gap-3">
                        <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center flex-shrink-0"><RobotIcon className="h-5 w-5 text-indigo-500"/></div>
                        <div className="rounded-2xl px-4 py-2.5 bg-gray-100 dark:bg-gray-700 text-gray-400">
                            <span className="animate-pulse">Typing...</span>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Apply Button Section */}
            {aiParsedData && aiParsedData.length > 0 && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0">
                     <button 
                        onClick={handleApply} 
                        className="w-full text-center py-2.5 rounded-lg bg-green-600 text-white hover:bg-green-700 font-semibold transition-colors disabled:bg-gray-400 dark:disabled:bg-gray-600"
                        disabled={isLoading}
                    >
                        📥 Apply AI Output to Editor
                    </button>
                </div>
            )}

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-4 border-t border-gray-200 dark:border-gray-700 flex-shrink-0 flex items-center gap-3">
                <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSend(e);
                        }
                    }}
                    placeholder="e.g., Use Selina for ICSE Grade 10"
                    className="flex-grow p-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-transparent focus:ring-2 focus:ring-brand-blue focus:outline-none resize-none"
                    rows={1}
                    disabled={isLoading}
                />
                <button type="submit" disabled={isLoading || !input.trim()} className="p-3 rounded-full bg-brand-blue text-white disabled:bg-gray-400 dark:disabled:bg-gray-600 hover:bg-blue-600 transition-colors">
                    <SendIcon className="h-5 w-5"/>
                </button>
            </form>
        </div>
    );
};

export default AiAssistantChat;
