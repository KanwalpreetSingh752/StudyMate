import express from "express";
import cors from "cors";
import multer from "multer";
import fs from "node:fs";
import { config, missingFoundryConfig } from "./config.js";
import { FoundryConfigurationError, runAgent } from "./foundry.js";
import { notesPrompt, parseJsonReply, plannerPrompt, quizPrompt } from "./prompts.js";

fs.mkdirSync(config.uploadsDirectory, { recursive: true });
const upload = multer({
  dest: config.uploadsDirectory,
  limits: { fileSize: 20 * 1024 * 1024, files: 5 },
  fileFilter: (_request, file, callback) => {
    const supported = /\.(pdf|ppt|pptx|doc|docx|txt|md)$/i.test(file.originalname);
    callback(supported ? null : new Error("Unsupported file type."), supported);
  }
});

const app = express();
app.use(cors({ origin: config.clientOrigin.split(",").map((origin) => origin.trim()) }));
app.use(express.json({ limit: "1mb" }));

app.get("/health", (_request, response) => {
  const missing = missingFoundryConfig();
  response.status(200).json({ status: "ok", foundryConfigured: missing.length === 0, missing });
});

app.post("/api/ask", async (request, response, next) => {
  try {
    const { question, mode = "Beginner", threadId } = request.body;
    if (!question?.trim()) return response.status(400).json({ error: "question is required" });
    const result = await runAgent(config.agentId, notesPrompt({ question, mode }), { threadId });
    const citation = result.citations[0];
    response.json({ answer: result.text, source: citation?.source || "Your indexed notes", section: citation?.quote || "Relevant material", citations: result.citations, threadId: result.threadId });
  } catch (error) { next(error); }
});

app.post("/api/quiz", async (request, response, next) => {
  try {
    const { topic, mode = "Beginner", count = 5, threadId } = request.body;
    if (!topic?.trim()) return response.status(400).json({ error: "topic is required" });
    if (!Number.isInteger(count) || count < 1 || count > 20) return response.status(400).json({ error: "count must be an integer between 1 and 20" });
    const result = await runAgent(config.agentId, quizPrompt({ topic, mode, count }), { threadId });
    response.json({ ...parseJsonReply(result.text), threadId: result.threadId });
  } catch (error) { next(error); }
});

app.post("/api/study-plan", async (request, response, next) => {
  try {
    const result = await runAgent(config.agentId, plannerPrompt(request.body), { threadId: request.body.threadId });
    response.json({ ...parseJsonReply(result.text), threadId: result.threadId });
  } catch (error) { next(error); }
});

app.post("/api/documents", upload.array("files", 5), (request, response) => {
  const documents = (request.files || []).map((file) => ({
    id: file.filename,
    name: file.originalname,
    size: file.size,
    mimeType: file.mimetype,
    status: "uploaded"
  }));
  response.status(201).json({ documents, note: "Files are stored locally. Connect your Foundry agent's file-search/vector-store ingestion here when its knowledge source is ready." });
});

app.use((error, _request, response, _next) => {
  if (error instanceof FoundryConfigurationError) return response.status(503).json({ error: error.message, code: "FOUNDRY_NOT_CONFIGURED" });
  if (error instanceof multer.MulterError || error.message === "Unsupported file type.") return response.status(400).json({ error: error.message });
  console.error(error);
  response.status(500).json({ error: "The request could not be completed.", detail: error.message });
});

app.listen(config.port, () => console.log(`StudyMate backend listening on http://localhost:${config.port}`));
