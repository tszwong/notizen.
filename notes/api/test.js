import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GOOGLE_STUDIO_API_KEY,
});

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method === 'GET') {
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <html>
        <head><title>Gemini Test</title></head>
        <body>
          <h2>✅ Gemini backend is up.</h2>
          <p>This endpoint responds to both <code>GET</code> and <code>POST</code> requests.</p>
          <p>Available endpoints:</p>
          <ul>
            <li><code>POST /api/test</code> - Test Gemini API</li>
            <li><code>POST /api/summarize</code> - Summarize content</li>
          </ul>
        </body>
      </html>
    `);
    return;
  }

  if (req.method === 'POST') {
    try {
      const result = await ai.models.generateContent({
        model: "gemini-2.0-flash-exp",
        contents: [{ role: "user", parts: [{ text: "How does AI work?" }] }],
        config: {
          maxOutputTokens: 100,
          temperature: 0.3,
        },
      });

      const summaryText = result.candidates?.[0]?.content?.parts?.[0]?.text;
      res.json({ success: true, response: summaryText });
    } catch (error) {
      console.error("🔥 Gemini Error:", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
      res.status(500).json({ success: false, error: "Gemini API call failed." });
    }
    return;
  }

  res.status(405).json({ success: false, error: 'Method not allowed' });
}