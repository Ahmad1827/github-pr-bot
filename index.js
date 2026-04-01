import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default (app) => {
  app.on(["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"], async (context) => {
    const prParams = context.pullRequest();
    const { data: files } = await context.octokit.pulls.listFiles(prParams);
    const { data: pr } = await context.octokit.pulls.get(prParams);

    let diffContent = "";
    files.forEach(file => {
      if (file.patch) diffContent += `\n--- ${file.filename} ---\n${file.patch}\n`;
    });

    if (diffContent.length > 80000) {
      diffContent = diffContent.substring(0, 80000) + "\n...[TRUNCATED]";
    }

    const prompt = `
      You are an expert reviewer. Analyze this PR:
      Title: ${pr.title}
      Body: ${pr.body || "None"}
      Changes:
      ${diffContent}

      Write a concise summary of the changes and any potential risks.
      STRICT CONSTRAINT: Your response must be exactly 4 to 6 bullet points. Do not write a long essay. Keep it brief and directly to the point.
    `;

    let aiSummary = "🤖 *AI Summary generation failed.*";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (error) {
      console.error("AI Error:", error);
    }

    return context.octokit.issues.createComment(
      context.issue({ body: `### 🤖 Concise PR Summary\n\n${aiSummary}` })
    );
  });

  app.on("issue_comment.created", async (context) => {
    if (context.isBot) return;
    if (!context.payload.issue.pull_request) return;

    const commentBody = context.payload.comment.body;
    
    if (!commentBody.toLowerCase().includes("@bot")) return;

    const issueParams = context.issue();
    const { data: pr } = await context.octokit.pulls.get({
      owner: issueParams.owner,
      repo: issueParams.repo,
      pull_number: issueParams.issue_number
    });
    
    const { data: files } = await context.octokit.pulls.listFiles({
      owner: issueParams.owner,
      repo: issueParams.repo,
      pull_number: issueParams.issue_number
    });

    let diffContent = "";
    files.forEach(file => {
      if (file.patch) diffContent += `\n--- ${file.filename} ---\n${file.patch}\n`;
    });
    
    if (diffContent.length > 50000) {
      diffContent = diffContent.substring(0, 50000) + "\n...[TRUNCATED]";
    }

    const prompt = `
      You are an AI assistant helping a developer on a GitHub Pull Request.
      PR Title: ${pr.title}
      Code Diff: 
      ${diffContent}
      
      The developer pinged you with this message/question: "${commentBody}"
      
      Answer their question directly and concisely based on the provided code changes. Do not be overly verbose.
    `;

    let aiReply = "🤖 *I had trouble processing that request.*";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      aiReply = result.response.text();
    } catch (error) {
      console.error("AI Chat Error:", error);
    }

    return context.octokit.issues.createComment(context.issue({ body: aiReply }));
  });
};