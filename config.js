// Configuration for Contact Form Integration
// Update these with your actual credentials from Supabase and Resend

// Supabase Configuration
// Get these from: https://app.supabase.com/project/[YOUR-PROJECT]/settings/api
window.SUPABASE_URL = 'https://your-project-id.supabase.co';
window.SUPABASE_KEY = 'your-anon-public-key';

// Resend API Key
// Get this from: https://resend.com/api-keys
window.RESEND_API_KEY = 'your-resend-api-key';

// Email recipient (where contact form submissions are sent)
window.EMAIL_RECIPIENT = 'mjoechia@gmail.com';

// Feature flags
window.ENABLE_SUPABASE = true;  // Save form data to Supabase
window.ENABLE_EMAIL = true;      // Send emails via Resend
