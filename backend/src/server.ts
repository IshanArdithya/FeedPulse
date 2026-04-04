import { createApp } from "./app";
import { env } from "./config/env";
import { logError, logInfo } from "./lib/logger";
import { connectToDatabase } from "./services/database.service";

async function bootstrap() {
  await connectToDatabase();
  const app = createApp();

  app.listen(env.PORT, () => {
    logInfo(`API listening on port ${env.PORT}`);
  });
}

void bootstrap().catch((error) => {
  logError("Failed to start FeedPulse backend", error);
  process.exit(1);
});

