# Build With Gemini
# Demo Video Link: https://youtu.be/oyFO-TG3_7I?si=O6mgTZ554H_KeVEP
## Health AI Assistant — Backend

A powerful AI-driven health assistant built using **Google Gemini**, **ElevenLabs Text-to-Speech**, and **Stability AI (SDXL)**.

This backend provides:

- **Smart text chat**
- **Voice chat** (Speech → AI → Speech)
- **Multi-image vision analysis**
- **AI image generation**
- **EJS-based frontend support**

---

## Tech Stack

### **Backend**
- **Node.js**
- **Express.js**
- **EJS** (View Engine)

### **AI Integrations**
- **Google Gemini 2.5 Flash** — Text, Voice STT, Vision
- **ElevenLabs TTS** — High-quality AI voice output
- **Stability AI (SDXL)** — Ultra-high-quality image generation

---

## Folder Structure

```
# /public     → Generated assets (images, audio)
# /uploads    → Temp uploaded audio/images (multer)
# /views      → EJS templates (index.ejs)
# server.js   → Main backend file
# .env        → API credentials
# package.json → Dependencies & scripts
# README.md   → Project documentation
```

---

## Environment Variables

Create a `.env` file in the root directory and add:

```
# GEMINI_API_KEY=your_gemini_api_key
# ELEVEN_API_KEY=your_elevenlabs_api_key
# STABILITY_API_KEY=your_stability_api_key
```

---

## Run Locally

### **1. Install dependencies**
```bash
npm install
```

### **2. Start the server**
```bash
node server.js
```

**Server URL**: `http://localhost:3000`

---

## Key Features

### **Text Chat**
Interactive text chat using **Google Gemini 2.5 Flash**.

### **Voice Chat**
- **Upload voice/audio**
- **Gemini → speech-to-text**
- **AI generates reply**
- **ElevenLabs → converts reply into speech**
- **Returns audio to user**

### **Vision AI**
**Upload 1–5 images** → **Gemini analyzes and returns insights**.

### **Image Generation**
**Generate high-quality images** using **Stability AI SDXL**.

---

## Deployment

This backend can be deployed easily on:

- **Render**
- **Railway**
- **Vercel** (Serverless functions)
- **VPS / Custom Node.js hosting**

---

## Contributing

**Contributions and improvements are welcome!**  
**Feel free to open an issue or submit a pull request.**

---

