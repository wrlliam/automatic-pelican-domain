import Elysia from "elysia";
import logixlysia from "logixlysia";

/**
 * Types for Pelican webhook payload
 */
interface Allocation {
  id: number;
  node_id: number;
  ip: string;
  port: number;
  server_id: number;
  primary?: boolean;
}

interface PelicanWebhook {
  id: number;
  uuid: string;
  uuid_short: string;
  name: string;
  node_id: number;
  allocation_id: number;
  allocation?: Allocation;
  event?: string;
  [key: string]: any;
}

export const app = new Elysia()
  // Tell Elysia the body type
  .post(
    "/",
    ({ request, body }) => {
      console.log("📥 Incoming Pelican Webhook");

      const b = body as PelicanWebhook

      // Headers
      console.log("🔹 Headers:", Object.fromEntries(request.headers));

      // Body
      console.log("🔹 Body:", JSON.stringify(body, null, 2));

      // Extract allocation
      if (b.allocation) {
        console.log(
          `✅ Allocation: ${b.allocation.ip}:${b.allocation.port}`
        );
      } else {
        console.log("⚠️ No allocation data found in webhook payload.");
      }

      return { ok: true }; // <- let Elysia serialize instead of manual Response
    }
  )
  .use(
    logixlysia({
      config: {
        showStartupMessage: true,
        startupMessageFormat: "simple",
        timestamp: {
          translateTime: "yyyy-mm-dd HH:MM:ss",
        },
        ip: true,
        logFilePath: "./logs/example.log",
        customLogFormat:
          "🦊 {now} {level} {duration} {method} {pathname} {status} {message} {ip} {epoch}",
        logFilter: {
          level: ["ERROR", "WARNING"],
          status: [500, 404],
          method: "GET",
        },
      },
    })
  )
  .listen({
    port: 3003,
    hostname: "0.0.0.0",
  });
