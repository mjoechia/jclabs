# Digital Business Card Maker - Setup Guide

## Status: Implementation Ready

The following have been created and are ready for deployment:

### ✅ Created Files
1. **vcard.js** — Shared vCard builder module
2. **supabase/functions/create-public-vcard/index.ts** — Card creation Edge Function
3. **supabase/functions/manage-public-vcard/index.ts** — Card management Edge Function
4. **VCARD_SUPABASE_SCHEMA.sql** — Database schema (SQL)
5. **card-generator.html** — Public creation form (mobile-first, live preview)
6. **card.html** — Public card viewer
7. **card-manage.html** — Private card editor

---

## Deployment Steps (in order)

### 1. Supabase Setup

#### 1.1 Create Tables
- Go to your Supabase project SQL editor
- Copy and paste the contents of `VCARD_SUPABASE_SCHEMA.sql`
- Execute the SQL
- Tables created: `public_vcards`, `vcard_management`, `vcard_rate_limits`

#### 1.2 Configure Secrets
Store these as Supabase secrets (Dashboard → Settings → Secrets):

```bash
TURNSTILE_SECRET_KEY=<your-cloudflare-turnstile-secret>
TOKEN_HMAC_SECRET=<generate-random-32-byte-string>
RESEND_API_KEY=<your-resend-api-key>  # optional, for email recovery
```

To generate `TOKEN_HMAC_SECRET`:
```bash
# macOS/Linux:
openssl rand -hex 32

# or in Node.js:
require('crypto').randomBytes(32).toString('hex')
```

### 2. Deploy Edge Functions

```bash
# Install Supabase CLI if not already installed
npm install -g supabase

# From the project root:
supabase functions deploy create-public-vcard
supabase functions deploy manage-public-vcard
```

Verify deployment:
- Check Supabase Dashboard → Edge Functions → both functions show "Active"

### 3. Cloudflare Turnstile Setup

If not already configured:

1. Go to https://dash.cloudflare.com/ → Turnstile
2. Create a new site:
   - Name: "JC Labs Card Maker" (or similar)
   - Domains: `jclabs.online`, `localhost` (for testing)
   - Mode: Managed (recommended)
3. Copy the **Site Key** (public)
4. Add the **Secret Key** to Supabase secrets (step 1.2)

### 4. Update config.js

Edit `config.js` with your actual credentials:

```javascript
// Supabase Configuration
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_KEY = 'your-anon-public-key';

// Cloudflare Turnstile
window.TURNSTILE_SITE_KEY = 'your-turnstile-site-key';

// Resend (optional, for email recovery links)
window.RESEND_API_KEY = 'your-resend-api-key';

// Feature flags
window.ENABLE_SUPABASE = true;
window.ENABLE_EMAIL = true;  // if using Resend
```

### 5. Update Navigation

Add "Free QR Card" link to these files at the appropriate location in the nav menu:

#### index.html
Find the nav section and add:
```html
<a href="card-generator.html" class="text-[#1A2B3C] hover:text-[#00B4D8] transition-colors">Free QR Card</a>
```

#### team.html, process.html, projects.html, agents.html
Same nav link as above.

### 6. Fix Turnstile Site Key Placeholder

The three new HTML files have a placeholder:
```html
<div class="cf-turnstile" data-sitekey="TURNSTILE_SITE_KEY_PLACEHOLDER"></div>
```

This is automatically replaced by the JavaScript init code:
```javascript
if (window.TURNSTILE_SITE_KEY) {
  document.querySelector('[data-sitekey]').setAttribute('data-sitekey', window.TURNSTILE_SITE_KEY);
}
```

Ensure `window.TURNSTILE_SITE_KEY` is set in config.js (step 4).

### 7. Fix API Endpoint References

The Edge Functions are referenced with a Netlify path in card-generator.html and card-manage.html:
```javascript
fetch('/.netlify/functions/create-public-vcard', ...)
fetch('/.netlify/functions/manage-public-vcard', ...)
```

**This works for Netlify hosting.** If using a different platform (e.g., Railway), update these paths:

For Supabase Edge Functions:
```javascript
// Replace with:
fetch('https://your-project-id.supabase.co/functions/v1/create-public-vcard', {
  headers: { 'Authorization': 'Bearer ' + window.SUPABASE_KEY }
})
```

---

## Testing Checklist

### 1. Create a Card
- [ ] Navigate to `card-generator.html`
- [ ] Fill in all fields
- [ ] Verify live preview updates
- [ ] Try QR mode toggle (vcard vs url)
- [ ] Complete CAPTCHA
- [ ] Submit
- [ ] Verify success modal shows shareable + management links

### 2. View the Card
- [ ] Copy shareable link from success modal
- [ ] Open in new browser/incognito (test RLS)
- [ ] Verify card displays all info
- [ ] Verify QR code shows and can be scanned on phone
- [ ] Verify "Download as vCard" works
- [ ] Verify "Download QR (PNG)" and "(SVG)" work

### 3. Edit the Card
- [ ] Copy management link from success modal
- [ ] Open in new browser/incognito
- [ ] Verify pre-filled form
- [ ] Edit a field (e.g., phone number)
- [ ] Click "Save Changes"
- [ ] Verify success message
- [ ] Verify "Last updated" timestamp changed
- [ ] Go back to view card, verify change persisted

### 4. Delete the Card
- [ ] Open management link again
- [ ] Click "Delete This Card"
- [ ] Confirm deletion
- [ ] Try to view original card link → should see "Not Found"

### 5. Rate Limiting
- [ ] Try submitting the form rapidly (>5 times in 1 hour from same IP)
- [ ] Verify rate limit message appears
- [ ] Wait ~1 hour or change VPN/browser to bypass limit

### 6. Turnstile/CAPTCHA
- [ ] Verify CAPTCHA loads on card-generator.html
- [ ] Try submitting without completing CAPTCHA → should fail
- [ ] Try submitting with CAPTCHA → should work

---

## Edge Function Details

### create-public-vcard

**Request:**
```json
{
  "fullName": "John Doe",
  "title": "Software Engineer",
  "company": "Acme Corp",
  "email": "john@example.com",
  "phone": "+1 555 123 4567",
  "website": "example.com",
  "wechatId": "mychat",
  "whatsappNumber": "+1 555 123 4567",
  "qrMode": "vcard",
  "ownerEmail": "john@example.com",
  "turnstileToken": "<token>",
  "createdFrom": "website",
  "campaignId": null
}
```

**Response (201):**
```json
{
  "slug": "abc123def456",
  "managementToken": "token-as-hex-string",
  "cardUrl": "https://jclabs.online/card.html?id=abc123def456",
  "manageUrl": "https://jclabs.online/card-manage.html?id=abc123def456&token=token-as-hex-string"
}
```

**Response (400/403/429):**
```json
{
  "error": "descriptive error message"
}
```

### manage-public-vcard

**Request (UPDATE):**
```json
{
  "slug": "abc123def456",
  "managementToken": "token-as-hex-string",
  "action": "update",
  "fullName": "Jane Doe",
  "title": "Senior Engineer",
  "qrMode": "url"
  // ... any fields to update; omitted fields are unchanged
}
```

**Request (DELETE):**
```json
{
  "slug": "abc123def456",
  "managementToken": "token-as-hex-string",
  "action": "delete"
}
```

**Response (200):**
```json
{
  "message": "Card updated successfully" or "Card deleted successfully"
}
```

**Response (403/404/400):**
```json
{
  "error": "descriptive error message"
}
```

---

## Database Schema Reference

### public_vcards
- `slug` (varchar 16, unique): 10-char CSPRNG base62 ID
- `full_name` (text, required): Creator's name
- `title`, `company`, `email`, `phone`, `website`, `wechat_id`, `whatsapp_number` (text, optional)
- `qr_mode` (text): 'vcard' or 'url'
- `qr_payload` (text): The actual vCard or URL encoded in the QR
- `vcard_version` (text): '4.0' (for future migrations)
- `created_at`, `updated_at` (timestamptz): Auto-managed
- `expires_at` (timestamptz, nullable): NULL = never expires
- `deleted_at` (timestamptz, nullable): Soft-delete marker
- `created_ip_hash` (text): Hashed IP for abuse investigation
- `created_from` (text): 'website' | 'campaign' | 'api' | 'admin'
- `campaign_id` (text, nullable): For campaign tracking

### vcard_management
- `slug` (text, PK): References public_vcards
- `token_hmac` (text): HMAC-SHA256 of management token (never plaintext)
- `owner_email` (text, nullable): For recovery

### vcard_rate_limits
- `limit_key` (text, PK): sha256(ip_hash + ua + lang + tz)
- `window_start` (timestamptz): 1-hour windows
- `request_count` (integer): Incremented per request; cap at 5 per window

---

## Environment Variables (Supabase Secrets)

| Secret | Description | Example |
|--------|-------------|---------|
| `TURNSTILE_SECRET_KEY` | Cloudflare Turnstile secret | `0x1234...` |
| `TOKEN_HMAC_SECRET` | Server secret for token HMAC | `abc123...` (32 bytes hex) |
| `RESEND_API_KEY` | Resend email API key (optional) | `re_1234...` |

---

## Future Enhancements (Out of Scope v1)

- [ ] Add nightly cleanup job (hard-delete old soft-deleted cards after 90 days)
- [ ] Cache-Control headers on card.html for read-heavy optimization
- [ ] Analytics dashboard (without view_count write amplification)
- [ ] Company logo upload
- [ ] Custom QR colors/theme
- [ ] Multi-card owner accounts (requires schema change)
- [ ] Vanity/custom URLs

---

## Troubleshooting

### "Turnstile verification failed"
- Verify `TURNSTILE_SECRET_KEY` is set in Supabase secrets
- Verify Turnstile site key matches the one in config.js
- Check that domain is registered in Cloudflare Turnstile dashboard

### "Rate limit exceeded"
- User has created >5 cards in the last 1 hour from the same IP/browser
- Solution: Wait 1 hour, change VPN/IP, or use different browser

### "Card not found"
- Card was deleted (`deleted_at` is set)
- Card is expired (`expires_at` is in the past)
- Invalid slug in URL

### "Invalid or expired token" (on card-manage.html)
- Management token doesn't match the HMAC hash in vcard_management table
- Could be typo in URL, or token was never valid
- Solution: Regenerate card and save the new management link

### QR code not rendering
- QR library (`qrcode.js` from CDN) failed to load
- Check browser console for errors
- Verify QR payload is not extremely long (vCard + all fields → ~1KB is normal)

---

## Support

For Supabase issues: https://supabase.com/docs
For Cloudflare Turnstile issues: https://developers.cloudflare.com/turnstile/
For Resend (emails): https://resend.com/docs
