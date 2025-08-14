import { GoogleGenAI } from "@google/genai";

// import { getFirestore } from "firebase-admin/firestore";
// import { initializeApp, applicationDefault } from "firebase-admin/app";

// if (!getFirestore.apps?.length) {
//   initializeApp({ credential: applicationDefault() });
// }
// const db = getFirestore();

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_STUDIO_API_KEY,
});

export default async function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    if (req.method !== 'POST') {
        console.log("Request method not allowed:", req.method);
        return res.status(405).json({ success: false, error: 'Method not allowed' });
    }

    try {
        const { content, userId, noteId, noteTitle } = req.body;
        console.log("Received extractTasks request:", { userId, noteId, noteTitle, contentLength: content?.length });

        // Validate content
        if (!content || typeof content !== 'string') {
            console.log("Invalid content received:", content);
            return res.status(400).json({
                success: false,
                error: "Content is required and must be a string."
            });
        }

        // Strip HTML tags for cleaner text processing
        const cleanContent = content.replace(/<[^>]*>/g, '').trim();
        console.log("Cleaned content length:", cleanContent.length);

        if (cleanContent.length === 0) {
            console.log("Content is empty after cleaning.");
            return res.status(400).json({
                success: false,
                error: "Content appears to be empty after cleaning."
            });
        }

        // Limit content length for serverless
        const maxLength = 15000;
        const truncatedContent = cleanContent.length > maxLength
            ? cleanContent.substring(0, maxLength) + "..."
            : cleanContent;
        if (cleanContent.length > maxLength) {
            console.log(`Content truncated from ${cleanContent.length} to ${maxLength} characters.`);
        }

        // Prompt for Gemini
        const prompt = `
            You are a smart AI assistant that is an expert in task extraction and event planning.
            Extract all actionable tasks from the following content.

            For each task, extract:
            - "task": the task name (string, required)
            - "priority": one of "low", "medium", or "high" (required, make an educated guess based on tone and context if not explicit)
            - "dueDate": the due date in YYYY-MM-DD format if mentioned (optional)
            - "description": a short description if available (optional)
            - "tags": an array of tag names if mentioned (optional)

            Return ONLY a JSON array of objects, each matching this TypeScript interface:
            {
                "task": string,
                "priority": "low" | "medium" | "high",
                "dueDate"?: string,
                "description"?: string,
                "tags"?: string[]
            }

            If there are no tasks, return an empty array: [].

            Content:
            """
            ${truncatedContent}
            """
        `;

        console.log("Gemini Task Extraction Prompt:\n", prompt);

        const result = await ai.models.generateContent({
            model: "gemini-2.0-flash-exp",
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            config: {
                maxOutputTokens: 256,
                temperature: 0.2,
            },
        });

        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log("Raw AI response text:", text);

        // --- Robust JSON extraction and Markdown code block stripping ---
        let tasks = [];
        try {
            let cleanText = text.trim();
            // Remove Markdown code block if present
            if (cleanText.startsWith('```')) {
                cleanText = cleanText.replace(/```(?:json)?/g, '').replace(/```/g, '').trim();
                console.log("Stripped markdown code block from AI response.");
            }
            // Remove trailing commas before array/object close
            cleanText = cleanText.replace(/,\s*([\]}])/g, '$1');

            const match = cleanText.match(/\[[\s\S]*?\]/);
            if (match) {
                console.log("Found JSON array in AI response.");
                tasks = JSON.parse(match[0].replace(/,\s*([\]}])/g, '$1'));
            } else {
                console.log("No array match, trying to parse entire cleaned text.");
                tasks = JSON.parse(cleanText);
            }
        } catch (err) {
            // Log the raw text for debugging
            console.error("AI raw response (for debugging):", text);
            console.error("JSON parse error:", err);
            return res.status(200).json({
                success: false,
                error: "Failed to parse tasks from AI response.",
                raw: text
            });
        }

        // Validate that tasks is an array of objects with at least a 'task' and 'priority' field
        if (
            !Array.isArray(tasks) ||
            !tasks.every(
                t =>
                    typeof t === 'object' &&
                    typeof t.task === 'string' &&
                    typeof t.priority === 'string'
            )
        ) {
            console.log("Validation failed for tasks array:", tasks);
            return res.status(200).json({
                success: false,
                error: "AI response did not return a valid array of task objects.",
                raw: text
            });
        }

        console.log(`Extracted ${tasks.length} tasks successfully.`);
        res.json({
            success: true,
            tasks,
            originalLength: cleanContent.length,
            extractedLength: tasks.length
        });

    } catch (error) {
        console.error("🔥 Gemini Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
        let errorMessage = "Gemini API call failed.";
        if (error.message?.includes('API key')) {
            errorMessage = "Invalid API key. Please check your Gemini API configuration.";
        } else if (error.message?.includes('quota')) {
            errorMessage = "API quota exceeded. Please try again later.";
        } else if (error.message?.includes('content') || error.message?.includes('input context is too long')) {
            errorMessage = "Content could not be processed. Please try with shorter content.";
        } else if (error.message?.includes('overloaded') || error.status === 503) {
            errorMessage = "The model is currently overloaded. Please try again later.";
        }

        res.status(500).json({
            success: false,
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
}