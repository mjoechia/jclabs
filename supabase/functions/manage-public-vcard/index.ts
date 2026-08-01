import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.38.4";

const TOKEN_HMAC_SECRET = Deno.env.get("TOKEN_HMAC_SECRET");
const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

interface ManageRequest {
  slug: string;
  managementToken: string;
  action: "update" | "delete";
  fullName?: string;
  title?: string;
  company?: string;
  email?: string;
  phone?: string;
  website?: string;
  wechatId?: string;
  whatsappNumber?: string;
  qrMode?: "vcard" | "url";
}

interface ValidationError {
  field: string;
  message: string;
}

// Trim and normalize
function normalize(value: string | undefined): string {
  if (!value) return "";
  return value.trim().replace(/\s+/g, " ");
}

// Validate update fields
function validateUpdateFields(data: Partial<ManageRequest>): ValidationError[] {
  const errors: ValidationError[] = [];

  // full_name (if provided, required and 1-100)
  if (data.fullName !== undefined) {
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
  }

  // title
  if (data.title !== undefined) {
    const title = normalize(data.title);
    if (title && title.length > 80) {
      errors.push({ field: "title", message: "Max 80 characters" });
    }
    if (title && (title.includes("<") || title.includes(">"))) {
      errors.push({ field: "title", message: "Invalid characters" });
    }
  }

  // company
  if (data.company !== undefined) {
    const company = normalize(data.company);
    if (company && company.length > 100) {
      errors.push({ field: "company", message: "Max 100 characters" });
    }
    if (company && (company.includes("<") || company.includes(">"))) {
      errors.push({ field: "company", message: "Invalid characters" });
    }
  }

  // email
  if (data.email !== undefined) {
    const email = normalize(data.email).toLowerCase();
    if (
      email &&
      (!email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/) || email.length > 254)
    ) {
      errors.push({ field: "email", message: "Invalid email format" });
    }
  }

  // phone
  if (data.phone !== undefined) {
    const phone = normalize(data.phone);
    if (phone && (phone.length > 30 || !/^[\d+\-() ]*$/.test(phone))) {
      errors.push({ field: "phone", message: "Invalid phone format" });
    }
  }

  // website
  if (data.website !== undefined) {
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
  }

  // wechat_id
  if (data.wechatId !== undefined) {
    const wechatId = normalize(data.wechatId);
    if (wechatId && wechatId.length > 50) {
      errors.push({ field: "wechatId", message: "Max 50 characters" });
    }
    if (wechatId && (wechatId.includes("<") || wechatId.includes(">"))) {
      errors.push({ field: "wechatId", message: "Invalid characters" });
    }
  }

  // whatsapp_number
  if (data.whatsappNumber !== undefined) {
    const whatsapp = normalize(data.whatsappNumber);
    if (whatsapp && whatsapp.length > 50) {
      errors.push({ field: "whatsappNumber", message: "Max 50 characters" });
    }
    if (whatsapp && (whatsapp.includes("<") || whatsapp.includes(">"))) {
      errors.push({ field: "whatsappNumber", message: "Invalid characters" });
    }
  }

  return errors;
}

// HMAC-SHA256 computation
async function computeHmac(token: string, secret: string): Promise<string> {
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

// Constant-time comparison
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

// Build vCard text (delegated to client in production, shown for reference)
function buildVCardText(data: Record<string, any>): string {
  const lines = ["BEGIN:VCARD", "VERSION:4.0"];
  if (data.full_name) lines.push(`FN:${data.full_name}`);
  if (data.title) lines.push(`TITLE:${data.title}`);
  if (data.company) lines.push(`ORG:${data.company}`);
  if (data.email) lines.push(`EMAIL:${data.email.toLowerCase()}`);
  if (data.phone) lines.push(`TEL:${data.phone}`);
  if (data.website) {
    let website = data.website;
    if (!website.startsWith("http")) website = "https://" + website;
    lines.push(`URL:${website}`);
  }
  if (data.wechat_id) lines.push(`X-WECHAT:${data.wechat_id}`);
  if (data.whatsapp_number) lines.push(`X-WHATSAPP:${data.whatsapp_number}`);
  lines.push("END:VCARD");
  return lines.join("\r\n");
}

serve(async (req) => {
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const body: ManageRequest = await req.json();
    const { slug, managementToken, action } = body;

    // Validate required fields
    if (!slug || !managementToken || !action) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Verify token via HMAC constant-time comparison
    const incomingHmac = await computeHmac(managementToken, TOKEN_HMAC_SECRET!);

    const { data: mgmt } = await supabase
      .from("vcard_management")
      .select("token_hmac")
      .eq("slug", slug)
      .single();

    if (!mgmt || !timingSafeEqual(incomingHmac, mgmt.token_hmac)) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    // Fetch current card data
    const { data: card } = await supabase
      .from("public_vcards")
      .select("*")
      .eq("slug", slug)
      .single();

    if (!card) {
      return new Response(
        JSON.stringify({ error: "Card not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "delete") {
      // Soft delete
      const { error } = await supabase
        .from("public_vcards")
        .update({ deleted_at: new Date().toISOString() })
        .eq("slug", slug);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to delete card" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Card deleted successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    if (action === "update") {
      // Validate update fields
      const validationErrors = validateUpdateFields(body);
      if (validationErrors.length > 0) {
        return new Response(
          JSON.stringify({ errors: validationErrors }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      // Build update object
      const updates: Record<string, any> = {
        updated_at: new Date().toISOString(),
      };

      if (body.fullName !== undefined) updates.full_name = body.fullName;
      if (body.title !== undefined) updates.title = body.title || null;
      if (body.company !== undefined) updates.company = body.company || null;
      if (body.email !== undefined) updates.email = body.email?.toLowerCase() || null;
      if (body.phone !== undefined) updates.phone = body.phone || null;
      if (body.website !== undefined) updates.website = body.website || null;
      if (body.wechatId !== undefined) updates.wechat_id = body.wechatId || null;
      if (body.whatsappNumber !== undefined) updates.whatsapp_number = body.whatsappNumber || null;
      if (body.qrMode !== undefined) updates.qr_mode = body.qrMode;

      // Regenerate qr_payload if fields changed
      const fieldsChanged = [
        "fullName",
        "title",
        "company",
        "email",
        "phone",
        "website",
        "wechatId",
        "whatsappNumber",
      ].some((field) => body[field as keyof ManageRequest] !== undefined);

      if (fieldsChanged || body.qrMode !== undefined) {
        const newCardData = { ...card, ...updates };
        const newPayload = body.qrMode === "url"
          ? `https://${req.headers.get("host")}/card.html?id=${slug}`
          : buildVCardText(newCardData);
        updates.qr_payload = newPayload;
      }

      // Update card
      const { error } = await supabase
        .from("public_vcards")
        .update(updates)
        .eq("slug", slug);

      if (error) {
        return new Response(
          JSON.stringify({ error: "Failed to update card" }),
          { status: 500, headers: { "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ message: "Card updated successfully" }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Invalid action" }),
      { status: 400, headers: { "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});
