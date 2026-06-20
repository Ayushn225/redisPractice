import dotenv from "dotenv";
import app from "./app";
import { pool, testConnection } from "./db/pool";
import { connectRedis, disconnectRedis } from "./redis/client";

dotenv.config();

const PORT = process.env.PORT || 5000;
let server: any;

async function startServer() {
  try {
    await testConnection();
    await connectRedis();
    server = app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

async function gracefulShutdown(signal: string) {
  console.log(`\nReceived ${signal}. Starting graceful shutdown...`);

  // Force exit after 1 second if any cleanups hang
  setTimeout(() => {
    console.log("Graceful shutdown timed out. Forcing exit...");
    process.exit(0);
  }, 1000).unref();

  if (server) {
    server.close((err?: Error) => {
      if (err) {
        console.error("Error closing HTTP server:", err);
      } else {
        console.log("HTTP server closed.");
      }
    });
  }

  try {
    console.log("Disconnecting Redis...");
    await disconnectRedis();
    console.log("Redis disconnected.");

    console.log("Ending database pool...");
    await pool.end();
    console.log("Database pool ended.");

    process.exit(0);
  } catch (error) {
    console.error('Error during graceful shutdown:', error);
    process.exit(1);
  }
}

// Listen for tsx reloads / manual terminal interruptions
process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

// Don't forget to actually kick off the server!
startServer();