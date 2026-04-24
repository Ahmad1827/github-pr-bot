# 🤖 AI PR Visualizer Bot

Automated GitHub Pull Request reviewer with AI narration and conversational capabilities.

## ⚙️ Project Architecture
---
Data processing pipeline: `GitHub Webhooks` ➔ `Probot (Node.js)` ➔ `Gemini 2.5 Flash`

* **Automated Code Review:** Triggers immediately on `pull_request.opened`, `synchronize`, and `reopened` events.
* **Concise AI Summaries:** Generates a strict 3-4 bullet point summary of changes and potential risks.
* **Conversational AI:** Mentions like `@bot` in a PR comment prompt the AI to answer specific questions about the code.
* **Architecture Impact:** Groups changed files by folder to provide a clear visual breakdown of affected modules.
* **Diff Truncation:** Built-in safeguards to truncate massive diffs (~50k+ characters) to prevent token-limit crashes.


## 🛠️ System Requirements & Setup
---
The bot runs on Node.js and requires strict API and webhook configurations to bridge GitHub and Google's Gemini.

### 1. Install Dependencies

**Important:** You must have Node.js installed on your system or server environment. 

Clone the repository and install the required packages:
```bash
git clone [https://github.com/YOUR_USERNAME/github-pr-bot.git](https://github.com/YOUR_USERNAME/github-pr-bot.git)
cd github-pr-bot
npm install
npm install @google/generative-ai
```

### 2. Environment Variables

Create a `.env` file in the root directory. You must include your Gemini API key and your GitHub App credentials:
```env
APP_ID=your_github_app_id
WEBHOOK_SECRET=your_webhook_secret
PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GEMINI_API_KEY=your_gemini_api_key
WEBHOOK_PATH=/
```

### 3. Start the Engine

Run the following command to start the Probot server:
```bash
npm start
```


## 🔐 Required GitHub Permissions
---
To function correctly, your GitHub App must have the following permissions configured in **Developer Settings**:

* **Pull Requests:** `Read & write`
* **Issues:** `Read & write` *(Required for the bot to read and reply to PR comments)*
* **Metadata:** `Read-only`

**Subscribed Events:**
* `Pull request`
* `Issue comment`


## 🚀 Usage Guide
---
* **Automatic Trigger:** Open a Pull Request or push new commits to an existing one. The bot will automatically read the code diffs and post its review.
* **Direct Interaction:** In any PR comment thread, type `@bot` followed by your question (e.g., *"@bot what files handle the database connection?"*). The bot will read the diff and reply directly to your comment.