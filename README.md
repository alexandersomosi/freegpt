# FreeGPT - Private AI Chat with Local RAG

FreeGPT is a modern, privacy-focused AI chat application that you run on your own computer. It allows you to chat with powerful AI models (like Google Gemini, GPT-4, Claude) and even upload your own documents (PDFs, Word files) to ask questions about them.

---

## 🌟 Features
*   **Chat with Files:** Upload documents and the AI will answer based on their content.
*   **Private:** Your documents stay on your computer.
*   **Multi-Model:** Use Google, OpenAI, Anthropic, or OpenRouter models.
*   **Smart:** Automatically reads scanned PDFs (images) using AI vision.
*   **Secure:** Session isolation keeps your chats private from each other.

---

## 📦 Installation Guide (Step-by-Step)

Follow these instructions carefully to set up the application on your computer.

### Prerequisites (Install these first)

Before you begin, you need to install two programs on your computer:

1.  **Node.js (for the frontend interface)**
    *   Download and install "LTS" version from: [https://nodejs.org/](https://nodejs.org/)
    *   During installation, just click "Next" through all the steps.

2.  **Python (for the backend logic)**
    *   Download and install Python 3.10 or newer from: [https://python.org/](https://www.python.org/downloads/)
    *   **IMPORTANT:** During installation, check the box that says **"Add Python to PATH"** at the bottom of the installer window before clicking "Install Now".

---

### Step 1: Download the Code

1.  Click the green **"<> Code"** button at the top of this GitHub page.
2.  Select **"Download ZIP"**.
3.  Extract (unzip) the downloaded file to a folder on your computer (e.g., `Documents/FreeGPT`).

---

### Step 2: Set up the Backend (The Brain)

This runs the logic and processes your files.

1.  Open your computer's terminal (Command Prompt on Windows, Terminal on Mac).
2.  Navigate to the project folder you just extracted.
    *   *Tip:* Type `cd ` (with a space) and then drag the folder into the terminal window, then press Enter.
    *   Example: `cd C:\Users\YourName\Documents\FreeGPT`
3.  Enter the backend folder:
    ```bash
    cd backend
    ```
4.  Create a virtual environment (keeps things clean):
    ```bash
    python -m venv venv
    ```
5.  Activate the environment:
    *   **Windows:**
        ```bash
        venv\Scripts\activate
        ```
    *   **Mac/Linux:**
        ```bash
        source venv/bin/activate
        ```
    *(You should see `(venv)` appear at the start of your command line)*
6.  Install the required libraries:
    ```bash
    pip install -r requirements.txt
    ```
7.  Start the Backend Server:
    ```bash
    python main.py
    ```
    ✅ You should see: `INFO: Uvicorn running on http://0.0.0.0:8000`
    **Do NOT close this window.**

---

### Step 3: Set up the Frontend (The Interface)

This runs the visual chat website.

1.  **Open a NEW Terminal window** (keep the previous one running!).
2.  Navigate to the project folder again (same as Step 2.2).
    *   Example: `cd C:\Users\YourName\Documents\FreeGPT`
3.  Install the interface dependencies:
    ```bash
    npm install
    ```
4.  Start the Interface:
    ```bash
    npm run dev
    ```
    ✅ You should see: `Local: http://localhost:5173/`

---

### Step 4: Use the App!

1.  Open your web browser (Chrome, Edge, etc.).
2.  Go to address: **[http://localhost:5173](http://localhost:5173)**
3.  **Enter your API Key:**
    *   Click the model name (top left corner, e.g., "Gemini 3 Pro").
    *   Enter your **Google API Key** (or OpenAI/OpenRouter key).
    *   *Don't have a key?* Get a free one here: [Google AI Studio](https://aistudio.google.com/)
4.  **Chat away!** Drag and drop files to ask questions about them.

---

## ❓ Troubleshooting

*   **"Python not found":** Make sure you checked "Add Python to PATH" during installation.
*   **"npm is not recognized":** Restart your computer after installing Node.js.
*   **"API Key Invalid":** Double check you pasted the key correctly in the settings menu.

## 📝 License
[MIT](LICENSE) - Free to use and modify.