import { AgentsClient } from "@azure/ai-agents";
import { DefaultAzureCredential } from "@azure/identity";
import { config, missingFoundryConfig } from "./config.js";

let client;

function getClient() {
  if (client) return client;
  if (!config.projectEndpoint) {
    throw new FoundryConfigurationError(["PROJECT_ENDPOINT"]);
  }
  client = new AgentsClient(config.projectEndpoint, new DefaultAzureCredential());
  return client;
}

export class FoundryConfigurationError extends Error {
  constructor(missing = missingFoundryConfig()) {
    super(`Azure AI Foundry is not configured. Missing: ${missing.join(", ")}`);
    this.name = "FoundryConfigurationError";
  }
}

function getText(message) {
  if (typeof message.content === "string") return message.content;
  if (!Array.isArray(message.content)) return "";
  return message.content
    .filter((part) => part.type === "text")
    .map((part) => part.text?.value || part.text || "")
    .join("\n")
    .trim();
}

function getCitations(message) {
  const content = Array.isArray(message.content) ? message.content : [];
  return content.flatMap((part) =>
    (part.text?.annotations || []).map((annotation) => ({
      source: annotation.fileCitation?.fileId || annotation.filePath?.fileId || "Foundry knowledge source",
      quote: annotation.fileCitation?.quote
    }))
  );
}

/** Sends one request to a pre-created Azure AI Foundry agent. */
export async function runAgent(agentId, prompt, { threadId } = {}) {
  if (!agentId) throw new FoundryConfigurationError();
  const foundry = getClient();
  const thread = threadId ? { id: threadId } : await foundry.threads.create();

  await foundry.messages.create(thread.id, "user", prompt);
  const run = await foundry.runs.createAndPoll(thread.id, agentId, {
    pollingOptions: { intervalInMs: 1000 }
  });

  if (run.status !== "completed") {
    throw new Error(`Foundry agent run ended with status: ${run.status}`);
  }

  for await (const message of foundry.messages.list(thread.id, { order: "desc" })) {
    if (message.role === "assistant") {
      return { threadId: thread.id, runId: run.id, text: getText(message), citations: getCitations(message) };
    }
  }
  throw new Error("The Foundry agent completed without returning a message.");
}
