/******************************************
 * HEALTH AI ASSISTANT — BACKEND
 * (Gemini + ElevenLabs + StabilityAI)
 ******************************************/

const express = require("express");
const dotenv = require("dotenv");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const User = require("./models/userModel");
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
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

app.get('/', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/dashboard', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/booking', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/tools', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/environmental', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/wellness', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/connect', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/subscription', (req, res) => {
  res.render('home', { user: req.user });
});
app.get('/chatbot', (req, res) => {
  res.render('chatbot', { user: req.user });
});



// ====================== REGISTER ======================
app.post('/register', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email: normalizedEmail,
      passwordHash,                                      // ← Must match schema exactly
      name: normalizedEmail.split('@')[0].charAt(0).toUpperCase() + normalizedEmail.split('@')[0].slice(1) // Nice name: Rahul@gmail.com → Rahul
    });

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure HTTP-only cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(201).json({
      success: true,
      token,                                            // ← Important for frontend
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error('Register error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// ====================== LOGIN ======================
app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Find user
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Check password
    const isValid = await bcrypt.compare(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate JWT
    const token = jwt.sign(
      { userId: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Set secure cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      token,                                            // ← Critical for frontend localStorage
      user: {
        id: user._id,
        name: user.name || normalizedEmail.split('@')[0],
        email: user.email
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.post('/logout', (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
  });
  return res.status(200).json({ success: true, message: 'Logged out successfully' });
});


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
  app.get("/chatbot", (req, res) => {
    res.render("chatbot", defaultRender());
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

      res.render("chatbot", defaultRender({ chatReply: reply }));
    } catch (err) {
      res.render("chatbot", defaultRender({ error: err.message }));
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
        "chatbot",
        defaultRender({
          chatReply: reply,
          fromVoice: transcript,
          audioUrl: "/" + filename,
        })
      );
    } catch (err) {
      console.error("Voice-chat error:", err);
      res.render("chatbot", defaultRender({ error: err.message }));
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
        "chatbot",
        defaultRender({
          chatReply: visionText,
          visionAnalysis: visionText,
        })
      );
    } catch (err) {
      res.render("chatbot", defaultRender({ error: err.message }));
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

      res.render("chatbot", defaultRender({ generatedImage: "/" + filename }));
    } catch (err) {
      res.render("chatbot", defaultRender({ error: err.message }));
    }
  });

  /******************************************
   * START SERVER
   ******************************************/
  const PORT = 3000;
  app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
