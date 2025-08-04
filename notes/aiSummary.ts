import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { GoogleGenAI } from "@google/genai";

dotenv.config();
// console.log("GOOGLE_STUDIO_API_KEY:", process.env.GOOGLE_STUDIO_API_KEY);

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Increase limit for large content

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_STUDIO_API_KEY!,
});

app.post("/api/summarize", async (req, res) => {
  try {
    const { content } = req.body;
    
    // Validate content
    if (!content || typeof content !== 'string') {
      return res.status(400).json({ 
        success: false, 
        error: "Content is required and must be a string." 
      });
    }

    // Strip HTML tags for cleaner text processing
    const cleanContent = content.replace(/<[^>]*>/g, '').trim();
    
    if (cleanContent.length === 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Content appears to be empty after cleaning." 
      });
    }

    // Limit content length to avoid API limits
    const maxLength = 30000; // Adjust based on Gemini's limits
    const truncatedContent = cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + "..." 
      : cleanContent;

    const prompt = `You are an AI assistant expert tasked with summarizing content into short, clear, and actionable points.
        Instructions:
        - Summarize the following content using HTML formatting.
        - Use <ul> and <li> tags for bullet points and <ol> for numbered lists.
        - Indent subitems using nested <ul> or <ol> tags.
        - Keep language simple and concise.
        - Avoid unnecessary details, repetition, or filler sentences.
        - If the content contains multiple sections or topics, separate them clearly with newlines by using <br> do not do slash n.
        - Do not use any rich text formatting (e.g., no bold, italics, or markdown symbols).
        - Always start the answer with a new line <br>, then "Summary: <br>" followed by the summary.
        - Make sure when we end the summary, it ends with a new line <br> and exit out of any lists <ul> or <li> or <ol>.
        - Do not end summary with a list item or bullet point.

        Content to summarize: ${truncatedContent}`;

    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      config: {
        maxOutputTokens: 250,
        temperature: 0.3,
      },
    });

    const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!summaryText) {
      throw new Error("No response text received from Gemini");
    }

    res.json({ 
      success: true, 
      response: summaryText,
      originalLength: cleanContent.length,
      summaryLength: summaryText.length
    });

  } catch (error: any) {
    console.error("🔥 Gemini Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Handle specific errors
    let errorMessage = "Gemini API call failed.";
    if (error.message?.includes('API key')) {
      errorMessage = "Invalid API key. Please check your Gemini API configuration.";
    } else if (error.message?.includes('quota')) {
      errorMessage = "API quota exceeded. Please try again later.";
    } else if (error.message?.includes('content')) {
      errorMessage = "Content could not be processed. Please try with different content.";
    } else if (error.message?.includes('overloaded') || error.status === 503) {
      errorMessage = "The model is currently overloaded. Please try again later.";
    }

    res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Keep the original test endpoint for debugging
app.post("/api/test", async (_req, res) => {
  try {
    const result = await ai.models.generateContent({
      model: "gemini-2.0-flash-exp",
      contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
    });

    const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
    res.json({ success: true, response: summaryText });
  } catch (error: any) {
    console.error("🔥 Gemini Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({ success: false, error: "Gemini API call failed." });
  }
});

app.get("/api/test", (_req, res) => {
  res.send(`
    <html>
      <head><title>Gemini Test</title></head>
      <body>
        <h2>✅ Gemini backend is up.</h2>
        <p>This endpoint only responds to <code>POST</code> requests.</p>
        <p>Available endpoints:</p>
        <ul>
          <li><code>POST /api/test</code> - Test endpoint</li>
          <li><code>POST /api/summarize</code> - Summarize content</li>
        </ul>
      </body>
    </html>
  `);
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`✅ Gemini backend (genai) running at http://localhost:${PORT}`);
});