// Gemini AI Configuration and Integration
import { GoogleGenAI, Chat, GenerateContentResponse } from '@google/genai';

// Get API key from environment or utils
const getApiKey = () => {
  return process.env.GEMINI_API_KEY || process.env.API_KEY || "YOUR_GEMINI_API_KEY_HERE";
};

// Initialize Gemini AI
const initializeAI = () => {
  const apiKey = getApiKey();
  if (!apiKey || apiKey === "YOUR_GEMINI_API_KEY_HERE") {
    throw new Error("Gemini API key not configured");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Generate AI response using Gemini
 * @param prompt - The user's input prompt
 * @returns Promise<string> - AI generated response
 */
export const generateAIResponse = async (prompt: string): Promise<string> => {
  try {
    const ai = initializeAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: prompt });
    return response.text;
  } catch (error) {
    console.error('Error generating AI response:', error);
    throw new Error('Failed to generate AI response');
  }
};

/**
 * Generate AI response with conversation history
 * @param messages - Array of conversation messages
 * @returns Promise<string> - AI generated response
 */
export const generateAIResponseWithHistory = async (
  messages: Array<{role: 'user' | 'model', content: string}>
): Promise<string> => {
  try {
    const ai = initializeAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
    });
    
    // Send conversation history
    for (const msg of messages.slice(0, -1)) {
      await chat.sendMessage({ message: msg.content });
    }
    
    // Send the latest message and get response
    const lastMessage = messages[messages.length - 1];
    const response: GenerateContentResponse = await chat.sendMessage({ message: lastMessage.content });
    return response.text;
  } catch (error) {
    console.error('Error generating AI response with history:', error);
    throw new Error('Failed to generate AI response');
  }
};

/**
 * Generate AI response for educational content
 * @param subject - The subject topic
 * @param query - Student's question
 * @returns Promise<string> - Educational AI response
 */
export const generateEducationalResponse = async (subject: string, query: string): Promise<string> => {
  try {
    const educationalPrompt = `
    As an educational AI assistant for ${subject}, please provide a comprehensive and helpful response to the following student question:
    
    Question: ${query}
    
    Please provide:
    1. A clear explanation
    2. Examples if applicable
    3. Step-by-step solution if it's a problem
    4. Additional tips or resources
    
    Keep the response educational, encouraging, and age-appropriate.
    `;
    
    const ai = initializeAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are an expert educational AI assistant. Help students learn effectively."
      }
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: educationalPrompt });
    return response.text;
  } catch (error) {
    console.error('Error generating educational response:', error);
    throw new Error('Failed to generate educational response');
  }
};

/**
 * Generate AI analysis for student performance
 * @param performanceData - Student's performance data
 * @returns Promise<string> - AI analysis and recommendations
 */
export const generatePerformanceAnalysis = async (performanceData: any): Promise<string> => {
  try {
    const analysisPrompt = `
    As an educational AI, analyze the following student performance data and provide insights:
    
    Performance Data: ${JSON.stringify(performanceData, null, 2)}
    
    Please provide:
    1. Strengths identified
    2. Areas for improvement
    3. Specific recommendations
    4. Study strategies
    5. Motivation and encouragement
    
    Keep the analysis constructive and supportive.
    `;
    
    const ai = initializeAI();
    const chat = ai.chats.create({
      model: 'gemini-2.5-flash',
      config: {
        systemInstruction: "You are an expert educational data analyst. Provide helpful insights for student improvement."
      }
    });
    
    const response: GenerateContentResponse = await chat.sendMessage({ message: analysisPrompt });
    return response.text;
  } catch (error) {
    console.error('Error generating performance analysis:', error);
    throw new Error('Failed to generate performance analysis');
  }
};

/**
 * Create a chat session with custom system instruction
 * @param systemInstruction - Custom system instruction for the AI
 * @returns Chat - Gemini chat instance
 */
export const createChatSession = (systemInstruction?: string): Chat => {
  const ai = initializeAI();
  return ai.chats.create({
    model: 'gemini-2.5-flash',
    config: systemInstruction ? { systemInstruction } : undefined
  });
};

export default {
  generateAIResponse,
  generateAIResponseWithHistory,
  generateEducationalResponse,
  generatePerformanceAnalysis,
  createChatSession
};