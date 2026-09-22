/*
  Frontend API layer.
  Replace these demo functions with your Flask/FastAPI/Node/Azure backend calls.
  The UI deliberately falls back to demo data so the app remains usable even
  when Azure credentials/backend are not configured.
*/

const API_BASE = import.meta.env.VITE_API_BASE_URL || "";

async function request(path, options = {}) {
  if (!API_BASE) return null;

  const response = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status}`);
  }

  return response.json();
}

export async function askNotes(question, mode = "Beginner") {
  if (!API_BASE) return null;
  return request("/api/ask", {
    method: "POST",
    body: JSON.stringify({ question, mode })
  });
}

export async function generateQuiz(topic, mode = "Beginner", count = 5) {
  if (!API_BASE) return null;
  return request("/api/quiz", {
    method: "POST",
    body: JSON.stringify({ topic, mode, count })
  });
}

export async function generateStudyPlan(payload) {
  if (!API_BASE) return null;
  return request("/api/study-plan", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}
