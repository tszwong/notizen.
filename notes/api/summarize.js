// /notes/api/summarize.js
// This API endpoint summarizes content using Google Gemini AI.

import { GoogleGenAI } from "@google/genai";

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
    return res.status(405).json({ success: false, error: 'Method not allowed' });
  }

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

    // Reduced limit for Vercel serverless functions (10 second timeout)
    const maxLength = 15000; // Reduced from 30000
    const truncatedContent = cleanContent.length > maxLength 
      ? cleanContent.substring(0, maxLength) + "..." 
      : cleanContent;

    const prompt = `You are an AI assistant expert tasked with summarizing content into short, clear, and actionable points.
        Instructions:
        - Summarize the following content using HTML formatting.
        - Use <ul> and <li> tags for bullet points and <ol> for numbered lists.
        - Indent subitems using nested <ul> or <ol> tags.
        - Use <strong> for important points and <br> for line breaks.
        - Keep language simple and concise.
        - Avoid unnecessary details, repetition, or filler sentences.
        - If the content contains multiple sections or topics, separate them clearly with newlines by using <br> do not do slash n.
        - Do not use any rich text formatting (e.g. italics, or markdown symbols).
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

  } catch (error) {
    console.error("🔥 Gemini Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    // Handle specific errors
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