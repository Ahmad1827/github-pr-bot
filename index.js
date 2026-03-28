import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default (app) => {
  app.on(["pull_request.opened", "pull_request.synchronize"], async (context) => {
    const prParams = context.pullRequest();
    
    const { data: files } = await context.octokit.pulls.listFiles(prParams);
    const { data: pr } = await context.octokit.pulls.get(prParams);

    const groupedFiles = {};
    files.forEach(file => {
      const parts = file.filename.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root';
      if (!groupedFiles[folder]) groupedFiles[folder] = [];
      groupedFiles[folder].push(`* \`${parts[parts.length - 1]}\` (+${file.additions}/-${file.deletions})`);
    });

    const prompt = `
      You are a senior developer reviewing a Pull Request.
      Title: ${pr.title}
      Body: ${pr.body || "No description provided."}
      Files changed: ${files.map(f => f.filename).join(", ")}
      
      Write a 2-3 sentence summary of what this PR does and why it matters. Keep it professional, direct, and concise. Do not use generic greetings.
    `;

    let aiSummary = "🤖 *AI Summary generation failed. Check API key.*";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (error) {
      console.error("AI Error:", error);
    }

    let commentBody = `### 🤖 AI PR Summary\n\n${aiSummary}\n\n---\n\n#### 📂 Architecture Impact:\n`;

    for (const [folder, fileList] of Object.entries(groupedFiles)) {
      commentBody += `\n**📁 ${folder}**\n${fileList.join('\n')}\n`;
    }

    return context.octokit.issues.createComment(
      context.issue({ body: commentBody })
    );
  });
};