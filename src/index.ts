import Elysia from "elysia";
import logixlysia from "logixlysia";

export const app = new Elysia()
  .post(`/`, async ({ request, body }) => {
    // Log basic request info
    console.log("📥 Incoming Webhook:");
    console.log("Headers:", Object.fromEntries(request.headers));
    console.log("Method:", request.method);
    console.log("URL:", request.url);

    // Log body (Pelican sends JSON with allocations inside)
    try {
      console.log("Body:", JSON.stringify(body, null, 2));
      const att = (body as any).attributes as any;
      // If you want just the primary allocation:
      if (att.allocations) {
        const primary = att.allocations.find((a: any) => a.primary);
        if (primary) {
          console.log(`Primary Allocation: ${primary.ip}:${primary.port}`);
        }
      }
    } catch (err) {
      console.error("❌ Failed to parse body:", err);
    }

    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  })
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
