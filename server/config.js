import "dotenv/config";

const requiredAgentKeys = ["STUDYMATE_AGENT_ID"];

export const config = {
  port: Number(process.env.PORT || 5000),
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  projectEndpoint: process.env.PROJECT_ENDPOINT,
  agentId: process.env.STUDYMATE_AGENT_ID,
  uploadsDirectory: process.env.UPLOADS_DIRECTORY || "uploads"
};

export function missingFoundryConfig() {
  const missing = [
    ...(config.projectEndpoint ? [] : ["PROJECT_ENDPOINT"]),
    ...requiredAgentKeys.filter((key) => !process.env[key])
  ];
  return missing;
}
