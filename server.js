/******************************************
 * HEALTH AI ASSISTANT — BACKEND
 * (Gemini + ElevenLabs + StabilityAI)
 ******************************************/

const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { GoogleGenAI } = require("@google/genai");
const { ElevenLabsClient } = require("@elevenlabs/elevenlabs-js");

dotenv.config();
const app = express();

/******************************************
 * BASIC APP SETUP
 ******************************************/
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static("public"));
app.set("view engine", "ejs");

// Create folders if missing
if (!fs.existsSync("public")) fs.mkdirSync("public");
if (!fs.existsSync("uploads")) fs.mkdirSync("uploads");

const upload = multer({ dest: "uploads/" });

/******************************************
 * GEMINI CLIENT
 ******************************************/
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

/******************************************
 * ELEVENLABS CLIENT
 ******************************************/
const elevenlabs = new ElevenLabsClient({
  apiKey: process.env.ELEVEN_API_KEY,
});

/******************************************
 * DEFAULT TEMPLATE VALUES
 ******************************************/
function defaultRender(data = {}) {
  return {
    chatReply: "",
    fromVoice: "",
    visionAnalysis: "",
    audioUrl: "",
    generatedImage: "",
    recommendations: [],
    error: "",
    ...data,
  };
}

function saveBase64(base64, folder, filename) {
  const filepath = path.join(folder, filename);
  fs.writeFileSync(filepath, Buffer.from(base64, "base64"));
  return filepath;
}

/******************************************
 * ROUTES
 ******************************************/

// Home page
app.get("/", (req, res) => {
  res.render("index", defaultRender());
});

/******************************************
 * 1. TEXT CHAT (Gemini)
 ******************************************/
app.post("/chat", async (req, res) => {
  try {
    const text = req.body.text?.trim();
    if (!text) throw new Error("Enter a message.");

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: text,
    });

    const reply =
      result.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "No response received.";

    res.render("index", defaultRender({ chatReply: reply }));
  } catch (err) {
    res.render("index", defaultRender({ error: err.message }));
  }
});

/******************************************
 * 2. VOICE CHAT (STT → LLM → TTS)
 ******************************************/
app.post("/voice-chat", upload.single("audio"), async (req, res) => {
  try {
    if (!req.file) throw new Error("Upload an audio file.");

    const base64 = fs.readFileSync(req.file.path).toString("base64");
    const mime = req.file.mimetype;

    /** Speech → Text (Gemini) **/
    const stt = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          inlineData: {
            mimeType: mime,
            data: base64,
          },
        },
      ],
    });

    const transcript =
      stt.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "Could not transcribe.";

    /** Text → LLM Reply **/
    const chat = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: transcript,
    });

    const reply =
      chat.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "No reply available.";

    /** LLM Reply → TTS **/
    const VOICE_ID = "JBFqnCBsd6RMkjVDRZzb"; // Rachel voice

    const audioStream = await elevenlabs.textToSpeech.convert(VOICE_ID, {
      text: reply,
      modelId: "eleven_multilingual_v2",
      outputFormat: "mp3_44100_128",
    });

    const chunks = [];
    for await (const chunk of audioStream) chunks.push(chunk);

    const audioBase64 = Buffer.concat(chunks).toString("base64");
    const filename = `tts_${Date.now()}.mp3`;

    saveBase64(audioBase64, "public", filename);
    fs.unlinkSync(req.file.path);

    res.render(
      "index",
      defaultRender({
        chatReply: reply,
        fromVoice: transcript,
        audioUrl: "/" + filename,
      })
    );
  } catch (err) {
    console.error("Voice-chat error:", err);
    res.render("index", defaultRender({ error: err.message }));
  }
});

/******************************************
 * 3. MULTI-IMAGE VISION ANALYSIS (Gemini)
 ******************************************/
app.post("/vision-chat", upload.array("images", 5), async (req, res) => {
  try {
    if (!req.files?.length) throw new Error("Upload at least one image.");

    const parts = [];

    for (const file of req.files) {
      const base64 = fs.readFileSync(file.path).toString("base64");
      parts.push({
        inlineData: { mimeType: file.mimetype, data: base64 },
      });
      fs.unlinkSync(file.path);
    }

    const prompt = req.body.prompt || "Describe these images.";

    const result = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt, ...parts],
    });

    const visionText =
      result.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ||
      "No result.";

    res.render(
      "index",
      defaultRender({
        chatReply: visionText,
        visionAnalysis: visionText,
      })
    );
  } catch (err) {
    res.render("index", defaultRender({ error: err.message }));
  }
});

/******************************************
 * 4. IMAGE GENERATION (Stability SDXL)
 ******************************************/
app.post("/image-generate", async (req, res) => {
  try {
    const prompt = req.body.prompt?.trim();
    if (!prompt) throw new Error("Prompt cannot be empty.");

    const fetch = (await import("node-fetch")).default;
    const engineId = "stable-diffusion-xl-1024-v1-0";

    const apiKey = process.env.STABILITY_API_KEY;
    const apiHost = process.env.API_HOST || "https://api.stability.ai";

    if (!apiKey) throw new Error("Missing Stability API key.");

    const response = await fetch(
      `${apiHost}/v1/generation/${engineId}/text-to-image`,
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          cfg_scale: 7,
          steps: 30,
          samples: 1,
          height: 1024,
          width: 1024,
          text_prompts: [{ text: prompt }],
        }),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Stability API Error: ${error}`);
    }

    const result = await response.json();
    const imageBase64 = result.artifacts?.[0]?.base64;
    if (!imageBase64) throw new Error("Image not returned.");

    const filename = `sdxl_${Date.now()}.png`;
    fs.writeFileSync(`public/${filename}`, Buffer.from(imageBase64, "base64"));

    res.render("index", defaultRender({ generatedImage: "/" + filename }));
  } catch (err) {
    res.render("index", defaultRender({ error: err.message }));
  }
});

/******************************************
 * START SERVER
 ******************************************/
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
