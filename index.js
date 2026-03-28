import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export default (app) => {
  app.on(["pull_request.opened", "pull_request.synchronize", "pull_request.reopened"], async (context) => {
    const prParams = context.pullRequest();
    
    const { data: files } = await context.octokit.pulls.listFiles(prParams);
    const { data: pr } = await context.octokit.pulls.get(prParams);

    const groupedFiles = {};
    let diffContent = "";

    files.forEach(file => {
      const parts = file.filename.split('/');
      const folder = parts.length > 1 ? parts.slice(0, -1).join('/') : 'Root';
      if (!groupedFiles[folder]) groupedFiles[folder] = [];
      groupedFiles[folder].push(`* \`${parts[parts.length - 1]}\` (+${file.additions}/-${file.deletions})`);

      if (file.patch) {
        diffContent += `\n--- ${file.filename} ---\n${file.patch}\n`;
      }
    });

    if (diffContent.length > 80000) {
      diffContent = diffContent.substring(0, 80000) + "\n...[DIFF TRUNCATED TO PREVENT TOKEN LIMIT]...";
    }

    const prompt = `
      You are an expert senior software engineer performing an exhaustive code review.
      PR Title: ${pr.title}
      PR Description: ${pr.body || "None provided."}

      Here are the detailed code changes (diffs):
      ${diffContent}

      Please provide your review in the following Markdown format:
      ### 📝 Exhaustive Summary
      Provide a highly detailed explanation of exactly what was modified, added, or removed.

      ### ⚙️ Logic Analysis
      Explain the technical implementation details. How do these changes alter the behavior of the application?

      ### ⚠️ Potential Conflicts & Risks
      Analyze the code for potential logical conflicts, bugs, breaking changes, or edge cases. If the code looks completely safe, explicitly state why it is safe.
    `;

    let aiSummary = "🤖 *AI Summary generation failed. Check API key.*";
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      const result = await model.generateContent(prompt);
      aiSummary = result.response.text();
    } catch (error) {
      console.error("AI Error:", error);
    }

    let commentBody = `${aiSummary}\n\n---\n\n#### 📂 Architecture Impact:\n`;

    for (const [folder, fileList] of Object.entries(groupedFiles)) {
      commentBody += `\n**📁 ${folder}**\n${fileList.join('\n')}\n`;
    }

    return context.octokit.issues.createComment(
      context.issue({ body: commentBody })
    );
  });
};