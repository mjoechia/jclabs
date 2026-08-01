-- Public "Free QR + vCard Card Maker" Supabase Schema
-- Execute all SQL below in your Supabase project's SQL editor
-- Tables: public_vcards, vcard_management, vcard_rate_limits

-- ============================================================================
-- TABLE 1: public_vcards (main card data)
-- ============================================================================
CREATE TABLE public_vcards (
  id bigint primary key generated always as identity,
  slug varchar(16) unique not null,              -- 10+ char CSPRNG base62
  full_name text not null,
  title text,
  company text,
  email text,
  phone text,
  website text,
  wechat_id text,
  whatsapp_number text,
  qr_mode text not null default 'vcard',        -- 'vcard' | 'url'
  qr_payload text not null,                     -- stored VCARD text or URL
  vcard_version text not null default '4.0',    -- version tag for migrations
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  expires_at timestamptz,                       -- NULL = never expires
  deleted_at timestamptz,                       -- soft-delete; NULL = active
  created_ip_hash text,                         -- sha256(ip + daily salt)
  created_from text not null default 'website', -- 'website' | 'campaign' | 'api' | 'admin'
  campaign_id text,                             -- nullable campaign identifier
  CONSTRAINT created_from_check CHECK (created_from IN ('website', 'campaign', 'api', 'admin')),
  CONSTRAINT qr_mode_check CHECK (qr_mode IN ('vcard', 'url'))
);

ALTER TABLE public_vcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active vcards"
  ON public_vcards FOR SELECT
  USING (deleted_at IS NULL AND (expires_at IS NULL OR expires_at > now()));

-- ============================================================================
-- TABLE 2: vcard_management (private ownership tokens)
-- ============================================================================
CREATE TABLE vcard_management (
  slug text primary key references public_vcards(slug) on delete cascade,
  token_hmac text not null,                     -- HMAC-SHA256(server_secret, token)
  owner_email text                              -- optional creator email
);

ALTER TABLE vcard_management ENABLE ROW LEVEL SECURITY;
-- Zero policies = fully locked to anon/authenticated roles

-- ============================================================================
-- TABLE 3: vcard_rate_limits (abuse protection)
-- ============================================================================
CREATE TABLE vcard_rate_limits (
  limit_key text primary key,                   -- sha256(ip_hash + ua + lang + tz)
  window_start timestamptz not null,
  request_count integer not null default 1
);

-- ============================================================================
-- INDEXES (optional, add if needed for performance)
-- ============================================================================
CREATE INDEX idx_public_vcards_slug ON public_vcards(slug);
CREATE INDEX idx_public_vcards_created_from ON public_vcards(created_from);
CREATE INDEX idx_vcard_rate_limits_window ON vcard_rate_limits(window_start);
