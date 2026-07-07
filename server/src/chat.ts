export const generateSkylarReply = (message: string) => {
  const text = message.trim().toLowerCase();

  if (!text) {
    return "Hello! I can help you plan your week, turn a messy idea into a clear next step, or draft a quick follow-up. What would you like to tackle first?";
  }

  if (text.includes("plan") || text.includes("week") || text.includes("organize")) {
    return "A simple next step is to choose one priority and block 30 minutes for it first. Once that is moving, the rest of the week gets easier.";
  }

  if (text.includes("help") || text.includes("idea") || text.includes("draft")) {
    return "Start with the core message you want to send, then tighten it into three bullets. That usually makes the final draft much faster.";
  }

  return "I can help turn this into a clear next step, a short plan, or a polished draft. Tell me what you want to tackle.";
};
