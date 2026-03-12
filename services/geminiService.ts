export interface AIPlanningResult {
    subtasks: string[];
    branchNameSuggestion: string;
    estimatedHours: number;
}

export const generateTaskPlan = async (taskTitle: string): Promise<AIPlanningResult> => {
    try {
        const response = await fetch('/api/gemini', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                contents: [{
                    parts: [{
                        text: `Act as a senior engineering lead. I have a task: "${taskTitle}". 
Break this down into 3-5 technical subtasks, suggest a git branch name 
following conventional commits, and estimate hours.
Reply in JSON only: { "subtasks": string[], "branchNameSuggestion": string, "estimatedHours": number }`
                    }]
                }]
            })
        });

        const data = await response.json();
        const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!text) throw new Error('No response from AI');

        return JSON.parse(text.replace(/```json|```/g, '').trim());

    } catch (error) {
        console.error('Gemini API Error:', error);
        // fallback mock
        return {
            subtasks: [
                `Research requirements for ${taskTitle}`,
                `Implement core logic`,
                `Write unit tests`,
            ],
            branchNameSuggestion: `feat/${taskTitle.toLowerCase().replace(/\s+/g, '-')}`,
            estimatedHours: 4,
        };
    }
};