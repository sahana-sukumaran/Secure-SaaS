const axios = require("axios");

const OLLAMA_URL =
  process.env.OLLAMA_URL || "http://localhost:11434/api/generate";

const MODEL =
  process.env.OLLAMA_MODEL || "qwen2.5:7b";

async function getTaskPriority(task) {
  try {
    const prompt = `
You are an experienced Senior Engineering Manager responsible for prioritizing tasks in a SaaS Project Management system.

Your job is to analyze a software development task and determine:

1. Priority (high, medium, or low)
2. Estimated completion time
3. Short reason

Base your decision on:

- Impact on users
- Security implications
- Data integrity
- System availability
- Business value
- Development complexity
- Urgency
- Whether the issue blocks other work

Examples:

Task:
Fix Login Bug
Priority:
high

Reason:
Users cannot access the application.

Estimated Time:
3-5 hours

----------------------------

Task:
SQL Injection in User API

Priority:
high

Reason:
Critical security vulnerability.

Estimated Time:
5-8 hours

----------------------------

Task:
Payment Gateway Failure

Priority:
high

Reason:
Revenue generation is affected.

Estimated Time:
4-6 hours

----------------------------

Task:
Dashboard Analytics Module

Priority:
medium

Reason:
Important feature but not blocking users.

Estimated Time:
1-2 days

----------------------------

Task:
Optimize Database Queries

Priority:
medium

Reason:
Improves performance.

Estimated Time:
6-8 hours

----------------------------

Task:
Add Email Notifications

Priority:
medium

Reason:
Useful feature enhancement.

Estimated Time:
1 day

----------------------------

Task:
Update README

Priority:
low

Reason:
Documentation improvement.

Estimated Time:
30 minutes

----------------------------

Task:
Change Button Color

Priority:
low

Reason:
Cosmetic UI improvement.

Estimated Time:
15 minutes

----------------------------

Now analyze this task.

Title:
${task.title}

Description:
${task.description || "No description"}

Return ONLY valid JSON.

{
  "priority":"high",
  "estimated_time":"4 hours",
  "reason":"Short reason here"
}

Do not include markdown.
Do not include explanations.
Do not include code fences.
Return ONLY JSON.
`;

    const response = await axios.post(OLLAMA_URL, {
      model: MODEL,
      prompt,
      stream: false,
      format: "json",
      options: {
        temperature: 0.2,
        top_p: 0.9
      }
    });

    let result = response.data.response;

    if (typeof result === "string") {
        result = result.trim();

        if (result.startsWith("```")) {
            result = result
                .replace(/```json/g, "")
                .replace(/```/g, "")
                .trim();
        }

    result = JSON.parse(result);
}
    if (typeof result === "string") {
      result = JSON.parse(result);
    }

    return {
      priority: result.priority?.toLowerCase() || "medium",
      estimated_time: result.estimated_time || "Unknown",
      reason: result.reason || "No reason provided"
    };
  } catch (err) {
    console.error("AI Priority Error:", err.message);

    return {
      priority: "medium",
      estimated_time: "Unknown",
      reason: "AI service unavailable."
    };
  }
}

module.exports = {
  getTaskPriority
};