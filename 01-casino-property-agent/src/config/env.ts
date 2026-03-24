import "dotenv/config";

function getOptionalEnv(name: string): string | undefined {
  const value = process.env[name];
  return value && value.trim() !== "" ? value : undefined;
}

export const env = {
  port: Number(process.env.PORT ?? 3000),
  openAiApiKey: getOptionalEnv("OPENAI_API_KEY"),
  propertyName: process.env.PROPERTY_NAME ?? "Mohegan Sun"
};