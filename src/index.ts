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

interface CloudflareResponse {
  success: boolean;
  errors: any[];
  messages: any[];
  result?: any;
}

/**
 * Generate a random 12-character string
 */
function generateRandomString(length: number = 12): string {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Get Cloudflare Zone ID for jptr.host
 */
async function getZoneId(token: string): Promise<string | null> {
  try {
    const response = await fetch(
      "https://api.cloudflare.com/client/v4/zones?name=jptr.host",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = (await response.json()) as unknown as CloudflareResponse;

    if (data.success && data.result && data.result.length > 0) {
      return data.result[0].id;
    }

    console.error("❌ Failed to get zone ID:", data.errors);
    return null;
  } catch (error) {
    console.error("❌ Error getting zone ID:", error);
    return null;
  }
}

/**
 * Create SRV record in Cloudflare
 */
async function createSRVRecord(
  token: string,
  zoneId: string,
  name: string,
  port: number,
  target: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.cloudflare.com/client/v4/zones/${zoneId}/dns_records`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "SRV",
          name: `_minecraft._tcp.${name}`,
          content: `0 5 ${port} pelican-server-wings-ds-01.jptr.host`, // priority weight port target
          ttl: 300,
        }),
      }
    );

    const data = (await response.json()) as unknown as CloudflareResponse;

    if (data.success) {
      console.log(
        `✅ Created SRV record: _minecraft._tcp.${name} -> ${target}:${port}`
      );
      return true;
    }

    console.error("❌ Failed to create SRV record:", data.errors);
    return false;
  } catch (error) {
    console.error("❌ Error creating SRV record:", error);
    return false;
  }
}

/**
 * Process DNS creation for server allocation
 */
async function processDNSCreation(webhook: PelicanWebhook): Promise<void> {
  const token = process.env.CLOUDFLARE_TOKEN;

  if (!token) {
    console.error("❌ CLOUDFLARE_TOKEN environment variable not set");
    return;
  }

  if (!webhook.allocation) {
    console.error("❌ No allocation data found in webhook payload");
    return;
  }

  // Generate random string and create subdomain
  const randomString = generateRandomString(12);
  const serverName = webhook.name.toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const subdomain = `${serverName}-${randomString}.jptr.host`;

  console.log(`🎯 Creating DNS records for: ${subdomain}`);
  console.log(`📍 Port: ${webhook.allocation.port}`);

  // Get zone ID
  const zoneId = await getZoneId(token);
  if (!zoneId) {
    console.error("❌ Could not get Cloudflare zone ID");
    return;
  }

  const target = "pelican-server-wings-ds-01.jptr.host";

  // Create SRV record
  const srvRecordSuccess = await createSRVRecord(
    token,
    zoneId,
    subdomain,
    webhook.allocation.port,
    target
  );

  if (srvRecordSuccess) {
    console.log(`🎉 Successfully created DNS records for ${subdomain}`);
    console.log(
      `🔗 Server accessible at: ${subdomain}:${webhook.allocation.port}`
    );
  } else {
    console.error("⚠️ Some DNS records failed to create");
  }
}

export const app = new Elysia()
  // Tell Elysia the body type
  .post("/", async ({ request, body }) => {
    console.log("📥 Incoming Pelican Webhook");

    const b = body as PelicanWebhook;

    // Extract allocation and process DNS
    if (b.allocation) {
      console.log(`📊 Server: ${b.name} (${b.uuid_short})`);
      console.log(`🌐 Allocation: ${b.allocation.ip}:${b.allocation.port}`);

      // Process DNS creation
      await processDNSCreation(b);
    } else {
      console.log("⚠️ No allocation data found in webhook payload.");
    }

    return { ok: true };
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
