const DEFAULT_PORT = 3001;
const DEFAULT_DB_PORT = 5433;

const parseNumber = (value: string | undefined, fallback: number) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const defaultOrigins = ["http://localhost:3000", "http://frontend:3000"];

export const env = {
  nodeEnv: process.env.NODE_ENV ?? "development",
  port: parseNumber(process.env.PORT, DEFAULT_PORT),
  dbHost: process.env.DB_HOST ?? "localhost",
  dbPort: parseNumber(process.env.DB_PORT, DEFAULT_DB_PORT),
  dbUser: process.env.DB_USERNAME ?? process.env.POSTGRES_USER ?? "app_user",
  dbPassword:
    process.env.DB_PASSWORD ?? process.env.POSTGRES_PASSWORD ?? "app_password",
  dbName: process.env.DB_NAME ?? process.env.POSTGRES_DB ?? "app_db",
  corsOrigins: process.env.CORS_ORIGINS
    // Compose uses the service hostname, while local development typically uses localhost.
    ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim())
    : defaultOrigins,
};
