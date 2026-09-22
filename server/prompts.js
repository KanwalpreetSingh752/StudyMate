export function notesPrompt({ question, mode }) {
  return `You are StudyMate's notes tutor. Answer the student's question only from the grounded study material available to you. Learning mode: ${mode}. Be accurate, concise, and say clearly if the supplied material does not support an answer. Question: ${question}`;
}

export function quizPrompt({ topic, mode, count }) {
  return `You are StudyMate's quiz author. Create exactly ${count} questions about "${topic}" from the grounded study material available to you. Learning mode: ${mode}. Reply with valid JSON only, no markdown, using this schema: {"questions":[{"q":"question","options":["option 1","option 2","option 3","option 4"],"answer":0,"explain":"short explanation"}]}. answer must be the zero-based index of the correct option.`;
}

export function plannerPrompt({ topics = [], availableMinutes, examDate, weakTopics = [], completedTasks = [] }) {
  return `You are StudyMate's study planner. Build a practical plan based on this student context: topics=${JSON.stringify(topics)}, availableMinutes=${availableMinutes || "not provided"}, examDate=${examDate || "not provided"}, weakTopics=${JSON.stringify(weakTopics)}, completedTasks=${JSON.stringify(completedTasks)}. Reply with valid JSON only: {"summary":"string","items":[{"title":"string","time":"25 min","reason":"string","priority":"high|medium|low"}]}.`;
}

export function parseJsonReply(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const value = fenced ? fenced[1] : text;
  const start = value.indexOf("{");
  const end = value.lastIndexOf("}");
  if (start === -1 || end === -1) throw new Error("Agent did not return valid JSON.");
  return JSON.parse(value.slice(start, end + 1));
}
