import { GoogleGenAI, Type } from "@google/genai";

const getClient = () => {
    const apiKey = process.env.API_KEY || ''; // In a real app, ensure this is set
    if (!apiKey) {
        console.warn("API_KEY not found in environment. Gemini features will be mocked or fail.");
    }
    return new GoogleGenAI({ apiKey });
};

export interface AIPlanningResult {
    subtasks: string[];
    branchNameSuggestion: string;
    estimatedHours: number;
}

export const generateTaskPlan = async (taskTitle: string): Promise<AIPlanningResult> => {
    try {
        const ai = getClient();
        if (!process.env.API_KEY) {
            // Fallback mock if no API key provided for demo purposes
            return new Promise(resolve => setTimeout(() => resolve({
                subtasks: [`Research requirements for ${taskTitle}`, `Implement core logic`, `Write unit tests`],
                branchNameSuggestion: `feat/${taskTitle.toLowerCase().replace(/\s+/g, '-')}`,
                estimatedHours: 4
            }), 1000));
        }

        const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `Act as a senior engineering lead. I have a task: "${taskTitle}". 
            Break this down into 3-5 technical subtasks, suggest a git branch name following conventional commits, and estimate hours.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: Type.OBJECT,
                    properties: {
                        subtasks: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description: "List of technical subtasks"
                        },
                        branchNameSuggestion: {
                            type: Type.STRING,
                            description: "A valid git branch name (e.g., feat/foo-bar)"
                        },
                        estimatedHours: {
                            type: Type.NUMBER,
                            description: "Estimated development hours"
                        }
                    }
                }
            }
        });

        const text = response.text;
        if (!text) throw new Error("No response from AI");
        
        return JSON.parse(text) as AIPlanningResult;

    } catch (error) {
        console.error("Gemini API Error:", error);
        throw error;
    }
};