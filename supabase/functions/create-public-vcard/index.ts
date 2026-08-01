import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const TURNSTILE_SECRET = Deno.env.get("TURNSTILE_SECRET_KEY");
const TOKEN_HMAC_SECRET = Deno.env.get("TOKEN_HMAC_SECRET");
const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

// Field validation rules
const VALIDATION_RULES = {
  full_name: { required: true, min: 1, max: 100 },
  title: { required: false, max: 80 },
  company: { required: false, max: 100 },
  email: { required: false, max: 254 },
  phone: { required: false, max: 30 },
  website: { required: false },
  wechat_id: { required: false, max: 50 },
  whatsapp_number: { required: false, max: 50 },
};

interface CardRequest {
  fullName: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  wechatId?: string;
  whatsappNumber?: string;
  qrMode: "vcard" | "url";
  ownerEmail?: string;
  turnstileToken: string;
  createdFrom?: string;
  campaignId?: string;
}

interface ValidationError {
  field: string;
  message: string;
}

// Trim and normalize text fields
function normalize(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

// Validate all fields
function validateFields(data: CardRequest): ValidationError[] {
  const errors: ValidationError[] = [];

  // full_name (required)
  const fullName = normalize(data.fullName);
  if (!fullName || fullName.length < 1 || fullName.length > 100) {
    errors.push({
      field: "fullName",
      message: "Name required, max 100 characters",
    });
  }
  if (fullName.includes("<") || fullName.includes(">")) {
    errors.push({ field: "fullName", message: "Invalid characters" });
  }

  // title (optional)
  if (data.title) {
    const title = normalize(data.title);
    if (title.length > 80) {
      errors.push({ field: "title", message: "Max 80 characters" });
    }
    if (title.includes("<") || title.includes(">")) {
      errors.push({ field: "title", message: "Invalid characters" });
    }
  }

  // company (optional)
  if (data.company) {
    const company = normalize(data.company);
    if (company.length > 100) {
      errors.push({ field: "company", message: "Max 100 characters" });
    }
    if (company.includes("<") || company.includes(">")) {
      errors.push({ field: "company", message: "Invalid characters" });
    }
  }

  // email (optional)
  if (data.email) {
    const email = normalize(data.email).toLowerCase();
    if (
      !email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) ||
      email.length > 254
    ) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  // phone (optional)
  if (data.phone) {
    const phone = normalize(data.phone);
    if (phone.length > 30 || !/^[\d+\-() ]*$/.test(phone)) {
      errors.push({ field: "phone", message: "Invalid phone format" });
    }
  }

  // website (optional, normalize)
  if (data.website) {
    let website = normalize(data.website);
    if (!website.startsWith("http://") && !website.startsWith("https://")) {
      website = "https://" + website;
    }
    try {
      new URL(website);
    } catch {
      errors.push({ field: "website", message: "Invalid URL" });
    }
  }

  // wechat_id (optional)
  if (data.wechatId) {
    const wechatId = normalize(data.wechatId);
    if (wechatId.length > 50) {
      errors.push({ field: "wechatId", message: "Max 50 characters" });
    }
    if (wechatId.includes("<") || wechatId.includes(">")) {
      errors.push({ field: "wechatId", message: "Invalid characters" });
    }
  }

  // whatsapp_number (optional)
  if (data.whatsappNumber) {
    const whatsapp = normalize(data.whatsappNumber);
    if (whatsapp.length > 50) {
      errors.push({ field: "whatsappNumber", message: "Max 50 characters" });
    }
    if (whatsapp.includes("<") || whatsapp.includes(">")) {
      errors.push({ field: "whatsappNumber", message: "Invalid characters" });
    }
  }

  return errors;
}

// Generate cryptographically secure random slug (base62, 10+ chars)
function generateSlug(): string {
  const chars = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
  const bytes = crypto.getRandomValues(new Uint8Array(10));
  let slug = "";
  for (const byte of bytes) {
    slug += chars[byte % chars.length];
  }
  return slug;
}

// Generate cryptographically secure token (32 bytes)
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map((b) => b.toString(16).padStart(2, "0")).join("");
}

// HMAC-SHA256: server_secret + token
async function computeHmac(
  token: string,
  secret: string
): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const msgData = encoder.encode(token);

  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, msgData);
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

// Verify Turnstile token
async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        secret: TURNSTILE_SECRET,
        response: token,
        remoteip: ip,
      }),
    });

    const result = await response.json();
    return result.success === true;
  } catch {
    return false;
  }
}

// Check and update rate limit
async function checkRateLimit(limitKey: string): Promise<boolean> {
  const now = new Date();
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

  // Check existing rate limit record
  const { data: existing } = await supabase
    .from("vcard_rate_limits")
    .select("*")
    .eq("limit_key", limitKey)
    .single();

  if (existing && existing.window_start > oneHourAgo) {
    // Within the same window
    if (existing.request_count >= 5) {
      return false; // Rate limited
    }
    // Increment
    await supabase
      .from("vcard_rate_limits")
      .update({ request_count: existing.request_count + 1 })
      .eq("limit_key", limitKey);
  } else {
    // New window or expired
    await supabase.from("vcard_rate_limits").upsert({
      limit_key: limitKey,
      window_start: now,
      request_count: 1,
    });
  }

  return true;
}

// Build vCard text (delegated to client, but shown for reference)
function buildVCardText(data: CardRequest): string {
  const lines = ["BEGIN:VCARD", "VERSION:4.0"];
  lines.push(`FN:${data.fullName}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.email) lines.push(`EMAIL:${data.email.toLowerCase()}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.website) {
    let website = data.website;
    if (!website.startsWith("http")) website = "https://" + website;
    lines.push(`URL:${website}`);
  }
  // Custom properties for WeChat/WhatsApp
  if (data.wechatId) lines.push(`X-WECHAT:${data.wechatId}`);
  if (data.whatsappNumber) lines.push(`X-WHATSAPP:${data.whatsappNumber}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: CardRequest = await req.json();
    const ip = req.headers.get("x-forwarded-for") || "unknown";

    // Validate all fields
    const validationErrors = validateFields(body);
    if (validationErrors.length > 0) {
      return new Response(
        JSON.stringify({ errors: validationErrors }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify Turnstile
    if (!await verifyTurnstile(body.turnstileToken, ip)) {
      return new Response(
        JSON.stringify({ error: "Turnstile verification failed" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Hash IP for rate limiting
    const ipHashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(ip + new Date().toDateString())
    );
    const ipHash = Array.from(new Uint8Array(ipHashBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Build rate limit key: ip_hash + ua + lang + tz
    const ua = req.headers.get("user-agent") || "";
    const lang = req.headers.get("accept-language") || "";
    const tz = body.campaignId || "unknown"; // placeholder for timezone if sent
    const limitKeySource = `${ipHash}|${ua}|${lang}|${tz}`;
    const limitKeyBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(limitKeySource)
    );
    const limitKey = Array.from(new Uint8Array(limitKeyBuffer))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("");

    // Check rate limit
    const withinLimit = await checkRateLimit(limitKey);
    if (!withinLimit) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded. Try again in 1 hour." }),
        { status: 429, headers: { "Content-Type": "application/json" } }
      );
    }

    // Generate slug and token
    let slug = generateSlug();
    let collision = true;
    let attempts = 0;
    while (collision && attempts < 10) {
      const { data: existing } = await supabase
        .from("public_vcards")
        .select("id")
        .eq("slug", slug)
        .single();
      if (!existing) {
        collision = false;
      } else {
        slug = generateSlug();
        attempts++;
      }
    }

    if (collision) {
      return new Response(
        JSON.stringify({ error: "Could not generate unique slug" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const token = generateToken();
    const tokenHmac = await computeHmac(token, TOKEN_HMAC_SECRET!);

    // Build QR payload
    const qrPayload = body.qrMode === "vcard"
      ? buildVCardText(body)
      : `https://${req.headers.get("host")}/card.html?id=${slug}`;

    // Insert card
    const { error: cardError } = await supabase.from("public_vcards").insert({
      slug,
      full_name: body.fullName,
      title: body.title || null,
      company: body.company || null,
      email: body.email?.toLowerCase() || null,
      phone: body.phone || null,
      website: body.website || null,
      wechat_id: body.wechatId || null,
      whatsapp_number: body.whatsappNumber || null,
      qr_mode: body.qrMode,
      qr_payload: qrPayload,
      vcard_version: "4.0",
      created_from: body.createdFrom || "website",
      campaign_id: body.campaignId || null,
      created_ip_hash: ipHash,
    });

    if (cardError) {
      return new Response(
        JSON.stringify({ error: "Failed to create card" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Insert management token
    const { error: mgmtError } = await supabase
      .from("vcard_management")
      .insert({ slug, token_hmac: tokenHmac, owner_email: body.ownerEmail || null });

    if (mgmtError) {
      return new Response(
        JSON.stringify({ error: "Failed to create management token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    // Optional: Send management link via Resend
    if (body.ownerEmail && RESEND_API_KEY) {
      const manageUrl = `https://${req.headers.get("host")}/card-manage.html?id=${slug}&token=${token}`;
      try {
        await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${RESEND_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "noreply@jclabs.online",
            to: body.ownerEmail,
            subject: "Your Card Management Link",
            html: `<p>Click <a href="${manageUrl}">here</a> to manage your card.</p><p><strong>Save this link — it won't be shown again.</strong></p>`,
          }),
        });
      } catch {
        // Email send failed, but card was created successfully
      }
    }

    return new Response(
      JSON.stringify({
        slug,
        managementToken: token,
        cardUrl: `https://${req.headers.get("host")}/card.html?id=${slug}`,
        manageUrl: `https://${req.headers.get("host")}/card-manage.html?id=${slug}&token=${token}`,
      }),
      {
        status: 201,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
