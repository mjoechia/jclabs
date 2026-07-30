# Contact Form Integration Setup

This document explains how to set up the contact form to send emails to mjoechia@gmail.com and save data to Supabase.

## Prerequisites

1. **Supabase Account** (Free tier available at https://supabase.com)
2. **Resend Account** (Free tier available at https://resend.com)

## Step 1: Set Up Supabase Database

### 1.1 Create a Supabase Project
- Go to https://app.supabase.com
- Create a new project (or use existing)
- Note your Project URL and Anon Public Key

### 1.2 Create contact_submissions Table
Run this SQL in Supabase SQL Editor:

```sql
CREATE TABLE contact_submissions (
  id bigint primary key generated always as identity,
  first_name text not null,
  last_name text not null,
  email text not null,
  company text,
  service text,
  message text not null,
  submitted_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Enable RLS (Row Level Security)
ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

-- Allow public inserts
CREATE POLICY "Allow public inserts"
  ON contact_submissions
  FOR INSERT
  WITH CHECK (true);
```

### 1.3 Get Your Credentials
- Project URL: Settings → API → Project URL
- Anon Public Key: Settings → API → Project API Keys → anon

## Step 2: Set Up Resend for Email

### 2.1 Create Resend Account
- Go to https://resend.com
- Sign up for free account
- Verify your sending domain or use Resend's default domain

### 2.2 Create API Key
- Dashboard → API Keys → Create New
- Copy the API key

### 2.3 Email Configuration
- Emails will be sent from: contact@jclabs.online (or your domain)
- Emails will be delivered to: mjoechia@gmail.com

## Step 3: Update config.js

Edit `config.js` and add your credentials:

```javascript
// Supabase
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...';

// Resend
window.RESEND_API_KEY = 're_your_api_key_here';
```

## Step 4: Test the Form

1. Go to your website
2. Fill out the contact form
3. Submit
4. Check:
   - **Supabase**: Go to Tables → contact_submissions to see the submission
   - **Email**: Check mjoechia@gmail.com for the email notification

## Security Notes

- The Anon Public Key is intentionally public (read the Supabase docs)
- Row Level Security (RLS) prevents unauthorized access
- API keys are stored client-side; consider rate limiting in production
- Never commit real credentials to git

## Feature Flags

You can control features in `config.js`:

```javascript
window.ENABLE_SUPABASE = true;  // Save to database
window.ENABLE_EMAIL = true;      // Send emails
```

## Troubleshooting

### Emails not sending
- Verify Resend API key is correct
- Check if domain is verified in Resend dashboard
- Check browser console for errors

### Data not saving to Supabase
- Verify URL and key are correct
- Check RLS policies allow inserts
- Verify table name is lowercase: `contact_submissions`

### CORS Errors
- Resend API is CORS-enabled
- Supabase REST API should work with proper headers
- Check browser Network tab for request details

## File Structure

```
/
├── index.html              (Contact form)
├── config.js              (Configuration - UPDATE WITH YOUR KEYS)
└── CONTACT_FORM_SETUP.md  (This file)
```

## Support

For Supabase issues: https://supabase.com/docs
For Resend issues: https://resend.com/docs
