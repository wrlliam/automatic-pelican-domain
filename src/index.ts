import Elysia from "elysia";
import logixlysia from "logixlysia";

export const app = new Elysia()
  .get(`/`, ({ request, body }) => {
    console.log(request);

    return new Response(
      JSON.stringify({
        ok: true,
      }),
      {
        status: 200,
      }
    );
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
    port: 6741,
    hostname: "0.0.0.0",
  });