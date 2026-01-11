# FreeGPT - Private AI Chat with Local RAG

FreeGPT is a modern, privacy-focused AI chat application that you run on your own computer. It allows you to chat with powerful AI models (like Google Gemini, GPT-4, Claude) and even upload your own documents (PDFs, Word files) to ask questions about them.


<img width="1629" height="882" alt="Képernyőkép 2026-01-11 215417" src="https://github.com/user-attachments/assets/ae95b931-1e09-4dd5-a187-92413cfd048d" />

---

## 🚀 Quick Start (For Users)

**Don't want to install anything?**
1.  Go to [Releases](https://github.com/alexandersomosi/freegpt/releases).
2.  Download the latest `FreeGPT.exe`.
3.  Double-click to run!
4.  Your browser will open automatically at `http://localhost:8000`.

---

## 🌟 Features
*   **Chat with Files:** Upload documents and the AI will answer based on their content.
*   **Private:** Your documents stay on your computer.
*   **Multi-Model:** Use Google, OpenAI, Anthropic, or OpenRouter models.
*   **Smart:** Automatically reads scanned PDFs (images) using AI vision.
*   **Secure:** Session isolation keeps your chats private from each other.

---

## 📦 Installation Guide (For Developers)

### Prerequisites
*   Node.js (v18+)
*   Python (v3.10+)

### Step 1: Clone the repository
```bash
git clone https://github.com/alexandersomosi/freegpt.git
cd freegpt
```

### Step 2: Set up the Backend
```bash
cd backend
python -m venv venv
# Windows: venv\Scripts\activate
# Mac/Linux: source venv/bin/activate
pip install -r requirements.txt
python main.py
```

### Step 3: Set up the Frontend
```bash

<img width="2559" height="1305" alt="Képernyőkép 2026-01-11 215814" src="https://github.com/user-attachments/assets/5250924c-260e-4db4-9314-38da9a5990f4" />

# In a new terminal
npm install
npm run dev
```

---

## 🛠️ Build your own EXE
If you want to create your own executable:
1.  Run `python build_executable.py` in the root directory.
2.  The result will be in the `dist/` folder.

## 📝 License
[MIT](LICENSE) - Free to use and modify.

<img width="2559" height="1305" alt="Képernyőkép 2026-01-11 215814" src="https://github.com/user-attachments/assets/4bc7f54b-e06a-457d-8b88-038a2d960500" />
