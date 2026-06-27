import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI, Type } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Body parser limits
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Initialize Gemini SDK with server-side API key
// Utilizing the recommended "gemini-2.5-flash" model for basic text and Q&A tasks.
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY || "dummy_key_for_compilation",
  httpOptions: {
    headers: {
      "User-Agent": "aistudio-build",
    },
  },
});

// Helper to call Gemini with robust retries and model fallback on transient 503/UNAVAILABLE errors
async function generateContentWithRetry(params: {
  model: string;
  contents: any;
  config?: any;
}) {
  const maxRetries = 2;
  let lastError: any = null;
  // Try the requested model first, then fall back to highly reliable standard models
  const fallbackModel = params.model === "gemini-2.5-flash" ? "gemini-1.5-flash" : "gemini-2.5-flash";
  const modelsToTry = [params.model, fallbackModel, "gemini-2.5-pro"];

  for (const currentModel of modelsToTry) {
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      try {
        console.log(`[Gemini SDK] Calling ${currentModel} (Attempt ${attempt + 1}/${maxRetries + 1})...`);
        const response = await ai.models.generateContent({
          ...params,
          model: currentModel,
        });
        return response;
      } catch (err: any) {
        lastError = err;
        console.error(`[Gemini SDK] Error on ${currentModel} (Attempt ${attempt + 1}):`, err.message || err);

        // Check if error is transient (503, 500, 429, or message contains UNAVAILABLE, high demand, overloaded, or rate limits)
        const errMsg = String(err.message || err).toLowerCase();
        const errStatus = err.status || (err.error && err.error.code) || 0;
        const isTransient =
          errStatus === 503 ||
          errStatus === 429 ||
          errStatus === 500 ||
          errMsg.includes("503") ||
          errMsg.includes("unavailable") ||
          errMsg.includes("high demand") ||
          errMsg.includes("overloaded") ||
          errMsg.includes("resource_exhausted") ||
          errMsg.includes("rate limit");

        if (!isTransient || attempt === maxRetries) {
          break; // Stop retrying on this model, switch to the next fallback model or exit the loop
        }

        // Wait with exponential backoff: 500ms on first retry, 1000ms on second
        const delay = Math.pow(2, attempt) * 500;
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  }

  throw lastError;
}

// Database file path simulating Cloud SQL persistence
const DB_FILE = path.join(process.cwd(), "cloudsql_mock.json");

// Helper to read database
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initialSchema = {
      profiles: {}, // email -> Profile
      mood_logs: {}, // email -> MoodLog[]
      journals: {}, // email -> JournalEntry[]
      suggestions: {}, // email -> StudySuggestion[]
      crisis_alerts: {}, // email -> CrisisAlert[]
      materials: {}, // email -> StudyMaterial[]
      chats: {} // email -> ChatMessage[]
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initialSchema, null, 2));
    return initialSchema;
  }
  try {
    return JSON.parse(fs.readFileSync(DB_FILE, "utf-8"));
  } catch (err) {
    console.error("Failed to read database file, resetting", err);
    return {
      profiles: {},
      mood_logs: {},
      journals: {},
      suggestions: {},
      crisis_alerts: {},
      materials: {},
      chats: {}
    };
  }
}

// Helper to write database
function writeDB(data: any) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Failed to write to database file", err);
  }
}

// Ensure database file is initialized on start
readDB();

/* ==========================================
   AUTHENTICATION & PROFILE ENDPOINTS
   ========================================== */

// Get profile
app.get("/api/profile", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email parameter is required" });
    }
    const db = readDB();
    const profile = db.profiles[email] || null;
    res.json({ success: true, profile });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch profile" });
  }
});

// Create/Update profile
app.post("/api/profile", (req, res) => {
  try {
    const { email, targetExam, customExam, chibi, onboarded } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    db.profiles[email] = {
      email,
      targetExam,
      customExam,
      chibi: chibi || { gender: "neutral", hat: "none", top: "tshirt", pants: "jeans", shoes: "sneakers" },
      onboarded: onboarded !== undefined ? onboarded : true
    };
    writeDB(db);
    res.json({ success: true, profile: db.profiles[email] });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save profile" });
  }
});

/* ==========================================
   MOOD LOGGING ENDPOINTS
   ========================================== */

// Get mood logs
app.get("/api/moods", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    const logs = db.mood_logs[email] || [];
    res.json({ success: true, logs });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch moods" });
  }
});

// Save mood log
app.post("/api/moods", (req, res) => {
  try {
    const { email, stress, anxiety, happiness, confusion } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    if (!db.mood_logs[email]) {
      db.mood_logs[email] = [];
    }
    const newLog = {
      id: "mood_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      stress: Number(stress),
      anxiety: Number(anxiety),
      happiness: Number(happiness),
      confusion: Number(confusion)
    };
    db.mood_logs[email].push(newLog);
    writeDB(db);
    res.json({ success: true, log: newLog });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save mood log" });
  }
});

/* ==========================================
   DIARIUM / JOURNAL ENDPOINTS
   ========================================== */

// Get journals + AI suggestions + crisis alerts
app.get("/api/journals", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    const list = db.journals[email] || [];
    const suggestions = db.suggestions[email] || [];
    const crisisAlert = db.crisis_alerts[email] || [];
    res.json({ success: true, list, suggestions, crisisAlert });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch journals" });
  }
});

// Save new journal entry
app.post("/api/journals", (req, res) => {
  try {
    const { email, title, content, mode, drawingData } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    if (!db.journals[email]) {
      db.journals[email] = [];
    }
    const newEntry = {
      id: "journal_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      title: title || "Untitled Entry",
      content: content || "",
      mode: mode || "notepad",
      drawingData: drawingData || null
    };
    db.journals[email].push(newEntry);
    writeDB(db);
    res.json({ success: true, entry: newEntry });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save journal" });
  }
});

/* ==========================================
   STUDY MATERIALS ENDPOINTS
   ========================================== */

// Get study materials
app.get("/api/materials", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    const items = db.materials[email] || [];
    res.json({ success: true, items });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch materials" });
  }
});

// Save study material with summary
app.post("/api/materials", (req, res) => {
  try {
    const { email, name, mimeType, summary, size } = req.body;
    if (!email || !name) {
      return res.status(400).json({ error: "Email and Name are required" });
    }
    const db = readDB();
    if (!db.materials[email]) {
      db.materials[email] = [];
    }
    const newMaterial = {
      id: "mat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      name,
      mimeType,
      summary,
      size: size || "Unknown",
      timestamp: new Date().toISOString()
    };
    db.materials[email].push(newMaterial);
    writeDB(db);
    res.json({ success: true, material: newMaterial });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save study material" });
  }
});

// Delete study material
app.delete("/api/materials", (req, res) => {
  try {
    const { email, id } = req.body;
    if (!email || !id) {
      return res.status(400).json({ error: "Email and ID are required" });
    }
    const db = readDB();
    if (db.materials[email]) {
      db.materials[email] = db.materials[email].filter((m: any) => m.id !== id);
      writeDB(db);
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to delete material" });
  }
});

/* ==========================================
   CHAT MESSAGES HISTORY
   ========================================== */

app.get("/api/chats", (req, res) => {
  try {
    const email = req.query.email as string;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    const messages = db.chats[email] || [];
    res.json({ success: true, messages });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to fetch chats" });
  }
});

app.post("/api/chats", (req, res) => {
  try {
    const { email, role, content } = req.body;
    if (!email || !role || !content) {
      return res.status(400).json({ error: "Email, role, and content are required" });
    }
    const db = readDB();
    if (!db.chats[email]) {
      db.chats[email] = [];
    }
    const newMsg = {
      id: "chat_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      role,
      content,
      timestamp: new Date().toISOString()
    };
    db.chats[email].push(newMsg);
    writeDB(db);
    res.json({ success: true, message: newMsg });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to save chat message" });
  }
});

app.post("/api/chats/clear", (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }
    const db = readDB();
    db.chats[email] = [];
    writeDB(db);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || "Failed to clear chat" });
  }
});


/* ==========================================
   GEMINI AI SERVICE INTERACTION ENDPOINTS
   ========================================== */

// 1. Validate custom exam (other selected)
app.post("/api/gemini/validate-exam", async (req, res) => {
  try {
    const { examName } = req.body;
    if (!examName) {
      return res.status(400).json({ error: "Exam name is required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Offline fallback behavior
      return res.json({
        isValid: true,
        standardizedName: examName.toUpperCase(),
        description: "Valid exam configuration stored in simulation mode."
      });
    }

    const prompt = `You are a professional competitive exam validator in India.
Validate if the following custom exam name is a real and existing competitive, recruitment, or professional entrance exam in India (or a major international equivalent popular in India): "${examName}".

If it is indeed a real exam, provide its standardized uppercase abbreviation/name and a brief calming description of its structure.
If it is completely unrecognized, fake, or invalid, set isValid to false and provide a helpful prompt requesting subjects.

Format your output strictly as a JSON object with this structure:
{
  "isValid": boolean,
  "standardizedName": "abbreviation or standardized name",
  "description": "calming 1-2 sentence overview",
  "message": "if invalid, warm message asking for subject details"
}`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            isValid: { type: Type.BOOLEAN },
            standardizedName: { type: Type.STRING },
            description: { type: Type.STRING },
            message: { type: Type.STRING }
          },
          required: ["isValid"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");
    res.json(result);
  } catch (error: any) {
    console.error("Gemini exam validation failed", error);
    res.status(500).json({ error: "StudyBuddy is taking a quick breather. Please try again in a moment." });
  }
});

// 2. Passive AI journal observation & crisis intervention
app.post("/api/gemini/journal-observe", async (req, res) => {
  try {
    const { email, content } = req.body;
    if (!email || !content) {
      return res.status(400).json({ error: "Email and content are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Offline fallback suggestions
      return res.json({
        suggestions: [
          { text: "Take a deep breath. Try studying in 25-minute Pomodoro intervals today.", type: "academic" },
          { text: "Spend 5 minutes stretching or stepping outdoors to reset your focus.", type: "wellbeing" }
        ],
        crisisAlert: { active: false, message: "" }
      });
    }

    const db = readDB();
    const profile = db.profiles[email] || { targetExam: "General studies" };

    const prompt = `You are "StudyBuddy", an empathetic AI mental wellbeing coach and study partner for a student preparing for "${profile.targetExam}".
Passively analyze the following private student journal entry:
"${content}"

1. Extract up to 2 specific, gentle, non-overwhelming suggestions:
   - One "academic" suggestion (e.g. customized study style, Pomodoro, mind-mapping)
   - One "wellbeing" suggestion (e.g. progressive muscle relaxation, 4-7-8 breathing, visual breaks)
2. Critically screen for signs of severe stress, active crisis, despair, clinical burnout, self-harm, or extreme hopelessness (common under JEE/NEET stress).
   - If detected, set crisisAlert active to true, and compose a deeply caring, non-judgmental notification statement that validates their pain and encourages them to use the "Talk to me" button to speak with StudyBuddy immediately.

Return your response strictly in JSON format matching this schema:
{
  "suggestions": [
    { "text": "actionable tip", "type": "academic" | "wellbeing" }
  ],
  "crisisAlert": {
    "active": boolean,
    "message": "caring crisis notification or empty"
  }
}`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            suggestions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  text: { type: Type.STRING },
                  type: { type: Type.STRING }
                },
                required: ["text", "type"]
              }
            },
            crisisAlert: {
              type: Type.OBJECT,
              properties: {
                active: { type: Type.BOOLEAN },
                message: { type: Type.STRING }
              },
              required: ["active", "message"]
            }
          },
          required: ["suggestions", "crisisAlert"]
        }
      }
    });

    const result = JSON.parse(response.text?.trim() || "{}");

    // Write back suggestions and alerts to our simulated Cloud SQL
    db.suggestions[email] = result.suggestions.map((s: any) => ({
      id: "sug_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5),
      timestamp: new Date().toISOString(),
      text: s.text,
      type: s.type,
      examContext: profile.targetExam
    }));

    if (result.crisisAlert && result.crisisAlert.active) {
      if (!db.crisis_alerts[email]) db.crisis_alerts[email] = [];
      db.crisis_alerts[email].push({
        id: "crisis_" + Date.now(),
        timestamp: new Date().toISOString(),
        message: result.crisisAlert.message,
        active: true
      });
    }

    writeDB(db);

    res.json({
      success: true,
      suggestions: db.suggestions[email],
      crisisAlert: result.crisisAlert
    });
  } catch (error: any) {
    console.error("AI Journal observation failed", error);
    res.status(500).json({ error: "StudyBuddy is taking a quick breather. Please try again in a moment." });
  }
});

// 3. Active Empathetic Chat (utilizing 1-10 Mood Log context & exam details)
app.post("/api/gemini/chat", async (req, res) => {
  try {
    const { email, message, history } = req.body;
    if (!email || !message) {
      return res.status(400).json({ error: "Email and message are required" });
    }

    const db = readDB();
    const profile = db.profiles[email] || { targetExam: "Competitive Exams" };
    const moods = db.mood_logs[email] || [];
    const latestMood = moods[moods.length - 1] || { stress: 4, anxiety: 4, happiness: 6, confusion: 3 };

    if (!process.env.GEMINI_API_KEY) {
      // Offline fallback chat
      const fallbacks = [
        "I hear you. Preparing for your exam is tough, but you are taking it step by step. Tell me more, or would you like a quick relaxation exercise?",
        "I am right here with you. Remember, a single exam doesn't define your entire horizon. Let's tackle this doubt or calm your mind together."
      ];
      const randomReply = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      return res.json({ reply: randomReply });
    }

    // Compose rich emotional instruction context
    const systemInstruction = `You are "StudyBuddy", a deeply empathetic, supportive, and calming AI study companion for an Indian student preparing for "${profile.targetExam}" ${profile.customExam ? `(${profile.customExam})` : ""}.
Your primary role is mental health validation combined with supportive academic guidance. Keep your tone gentle, warm, conversational, and highly reassuring, addressing the intense stress of JEE, NEET, or UPSC.
The student's current emotional state metrics (from 1 to 10 scale) are:
- Stress Level: ${latestMood.stress}/10 (higher means more stressed)
- Anxiety Level: ${latestMood.anxiety}/10 (higher means closer to panic)
- Happiness Level: ${latestMood.happiness}/10
- Confusion Level: ${latestMood.confusion}/10

Respond directly using this emotional backdrop. If stress or anxiety is high, immediately lead with validating, grounding sentences (e.g. box breathing) before touching on academic queries. Keep answers beautifully structured, digestible, and free from cognitive clutter. No long monolithic walls of text! Make them feel safe, held, and capable.`;

    const formattedHistory = history.map((h: any) => ({
      role: h.role,
      parts: [{ text: h.content }]
    }));

    // Add current user message
    formattedHistory.push({
      role: "user",
      parts: [{ text: message }]
    });

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: formattedHistory,
      config: {
        systemInstruction
      }
    });

    const reply = response.text || "I'm here for you. Let's take a deep breath together.";
    res.json({ reply });
  } catch (error: any) {
    console.error("Gemini Chat failed", error);
    res.status(500).json({ error: "StudyBuddy is taking a quick breather. Please try again in a moment." });
  }
});

// 4. Document/Image Summarization
app.post("/api/gemini/summarize-material", async (req, res) => {
  try {
    const { name, textContent, mimeType } = req.body;
    if (!name || !textContent) {
      return res.status(400).json({ error: "Document Name and Text Content are required" });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        summary: `### Overview of ${name}\nThis document covers core competitive exam topics. It highlights vital concepts, essential formulae, and step-by-step resolution pathways to streamline your revision schedule.`
      });
    }

    const prompt = `You are "StudyBuddy", a specialized study assistant.
Summarize the following document content in an extremely clean, visually calming, non-intimidating way.
Document Name: "${name}"
File Type: "${mimeType}"

Provide:
1. "Key Takeaway" (1 clear, encouraging sentence)
2. "Core Concepts" (3-5 highly bulleted, readable lines using bold headers)
3. "Calming Review Action" (1 simple, immediate action item to digest this without anxiety)

Ensure the output uses beautiful, standard Markdown for list formatting. Avoid clutter.
Content snippet:
"${textContent.substring(0, 8000)}"`;

    const response = await generateContentWithRetry({
      model: "gemini-2.5-flash",
      contents: prompt
    });

    const summary = response.text || "Summary is being processed. Feel free to explore it in Chat.";
    res.json({ summary });
  } catch (error: any) {
    console.error("Gemini document summarization failed", error);
    res.status(500).json({ error: "StudyBuddy is taking a quick breather. Please try again in a moment." });
  }
});

/* ==========================================
   VITE DEV SERVER OR PRODUCTION MIDDLEWARES
   ========================================== */

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting server in DEVELOPMENT mode with Vite Middleware");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Starting server in PRODUCTION mode");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`StudyBuddy server successfully running on port ${PORT}`);
  });
}

startServer();
