# Portfolio Images Guide

This document outlines which images and screenshots you should capture from each of your projects to showcase on the redesigned website.

## 1. ChatRecept
**GitHub:** https://github.com/mjoechia/chatrecept

### Images to Capture:

1. **Main Dashboard/Conversations Hub** (1920x1080 or 16:9) ⭐ PRIMARY
   - Show the unified inbox with multiple customer conversations
   - Display conversations from WhatsApp, Telegram, and Web channels
   - Show conversation list with preview text, customer names, timestamps
   - Highlight any lead scoring indicators or priority badges
   - Purpose: Featured image for the large project card

2. **Customer Conversation in Progress**
   - Screenshot of AI Frontdesk chatting with a customer
   - Show natural conversation flow (customer question → AI helpful response)
   - Display typical business queries being answered automatically
   - Show chat interface with message bubbles, timestamps
   - Purpose: Demonstrate core AI capability in action

3. **Lead Scoring/Dashboard View**
   - Show prospects categorized as "Hot," "Warm," or "Cold"
   - Display lead priority indicators
   - Show customer intelligence/qualification metrics
   - Purpose: Highlight business value and lead prioritization

4. **WebsiteBot Interface**
   - Show the website generation flow or final generated website preview
   - Display a beautifully designed business website created by AI
   - Show the simplicity of the setup (Telegram conversation or form)
   - Purpose: Showcase the free website builder feature

5. **Analytics/Reporting Dashboard**
   - Show conversation metrics and business insights
   - Display charts showing response rates, customer satisfaction, or conversion data
   - Show conversation trends, busiest times, popular questions
   - Purpose: Demonstrate data-driven decision making capability

6. **Mobile Responsiveness**
   - Customer chat interface on mobile device
   - Show how the dashboard looks on mobile
   - Purpose: Show mobile-first design

### Suggested Image Treatments:
- Capture in a modern browser (Chrome/Safari)
- Use realistic but anonymized customer data (change names, real details)
- Show active conversations to demonstrate real usage
- Clean UI without cluttered elements
- File format: PNG (for transparency) or JPEG (for compressed storage)
- Recommended sizes: 1200x800px for web optimization

---

## 2. nexamatrix HRMS
**GitHub:** https://github.com/mjoechia/nexahrsoft2

### Images to Capture:

1. **Attendance Heatmap Dashboard** (1920x1080 or 16:9) ⭐ PRIMARY & UNIQUE
   - Show the stunning color-coded attendance visualization
   - Display the weekly or monthly heatmap with color gradients
   - Green = present, Yellow = partial, Red = absent
   - Show multiple departments/teams at a glance
   - Purpose: Showcase the unique and visually striking feature that sets this apart

2. **Location-Based Login Screen**
   - Show the AI-powered location verification during login
   - Display GPS verification or location challenge
   - Show security confirmation
   - Purpose: Highlight AI security innovation

3. **Employee Attendance/Clock-In Interface**
   - Screenshot of the clock-in/clock-out screen
   - Show GPS location capture, timestamp, employee verification
   - Display instant attendance confirmation
   - Purpose: Show core daily feature

4. **Leave Management Dashboard**
   - Show leave balance, pending requests, approval workflow
   - Display leave calendar or leave history
   - Show different leave types (Annual, Medical, Maternity, etc.)
   - Purpose: Demonstrate key HR feature

5. **Payroll Processing Screen**
   - Show payroll calculation with CPF, allowances, deductions
   - Display payroll summary or report
   - Show payslip generation
   - Purpose: Highlight financial accuracy

6. **HR Analytics/Reports**
   - Dashboard showing department-level metrics
   - Display attendance patterns, trends, insights
   - Show any data visualizations or KPIs
   - Purpose: Demonstrate business intelligence capability

7. **Mobile Clock-In View**
   - Mobile/responsive view of attendance feature
   - Purpose: Show mobile accessibility

### Suggested Image Treatments:
- Use realistic sample employee data (anonymize or use fake names/IDs)
- The Attendance Heatmap should be vibrant and eye-catching (it's the hero feature!)
- Capture in professional blue/teal color scheme
- Ensure sensitive information is anonymized
- File format: PNG or JPEG
- Recommended sizes: 1200x800px for web optimization

---

## 3. KhunCaddy
**GitHub:** https://github.com/BkkBabe/bkkbabe

### Images to Capture:

1. **Browse/Search Marketplace** (1920x1080 or 16:9) ⭐ PRIMARY
   - Show the companion browsing interface with profiles
   - Display verified badges, ratings, pricing
   - Show filters (location, price, services, etc.)
   - Highlight the "Verified" badge/checkmark on profiles
   - Purpose: Main featured image showing the marketplace

2. **AI Face Verification Process**
   - Screenshot of the selfie/facial verification flow
   - Show "Take a selfie" prompt and verification in progress
   - Display AI matching/verification confirmation
   - **IMPORTANT:** Blur or redact actual faces - show UI elements instead
   - Purpose: Highlight core AI identity verification capability

3. **Companion Profile Details**
   - Show a detailed companion profile page
   - Display verified badge, ratings, services offered, pricing
   - Show verification status/badges
   - Purpose: Demonstrate trust and verification system

4. **Booking/Chat Interface**
   - Show in-app messaging between client and companion
   - Display conversation with booking details
   - Show profile information visible in chat
   - Purpose: Demonstrate built-in communication system

5. **Telegram Login Screen**
   - Show the one-tap Telegram login
   - Display authentication confirmation
   - Purpose: Highlight easy Telegram integration

6. **Payment Confirmation Screen**
   - Show blockchain payment via TON/Telegram Wallet
   - Display transparent pricing and fees (5% platform fee shown)
   - Show instant payment confirmation
   - Purpose: Highlight modern payment technology

7. **Ratings & Community Governance**
   - Show 5-star rating system
   - Display tier levels (New, Trusted, Elite, Legend)
   - Purpose: Demonstrate community trust system

8. **Mobile Marketplace View**
   - Mobile browsing experience
   - Purpose: Show mobile-first design

### Suggested Image Treatments:
- **CRITICAL - PRIVACY:** Blur or completely obscure all actual faces in verification screenshots
- Use sample/demo profiles with generic names (not real people)
- Use placeholder or masked face images for verification screens
- Emphasize the verified badges and trust indicators
- Show the clean, modern UI design
- Professional color scheme with trust-building elements
- File format: PNG or JPEG
- Recommended sizes: 1200x800px for web optimization

---

## Technical Specifications for Web Use

### General Requirements:
- **Format:** PNG (with transparency) or optimized JPEG
- **Minimum Width:** 1200px (for retina displays, 1920px ideal)
- **Aspect Ratio:** 16:9 (1920x1080) or 4:3 (1280x960)
- **File Size:** Keep under 500KB per image
- **Color Space:** sRGB for web consistency
- **Compression:** Use tools like TinyPNG or ImageOptim for optimization

### For Each Project Card:
1. **Hero/Feature Image** (16:9, 1200x675px)
   - Primary showcase screenshot
   - This is the main visual on the card

2. **Optional Secondary Images** (for future gallery/carousel)
   - Additional screenshots showing different features
   - Same dimensions as primary

---

## Where to Use These Images

1. **ChatRecept Section:**
   - Main dashboard screenshot → Background/Feature image in the large card
   - Used at: `index.html` - Featured Projects Portfolio section

2. **nexamatrix HRMS Section:**
   - Dashboard/metrics → Background image in medium card
   - Used at: `index.html` - Featured Projects Portfolio section

3. **KhunCaddy Section:**
   - KYC verification screen → Background/accent for dark card
   - Used at: `index.html` - Featured Projects Portfolio section

---

## Implementation Notes

- Images can be added as CSS backgrounds or `<img>` tags
- Consider lazy-loading for performance
- Use `alt` text for accessibility
- Ensure images display well on mobile (test at 375px, 768px, 1024px, 1920px widths)
- Consider WebP format with JPEG fallback for better performance

---

## Privacy & Security Considerations

⚠️ **Important:** When capturing these images:
- Do NOT include real personal/sensitive data
- Do NOT include real ID numbers, passport details, or biometric data
- DO blur or redact any actual faces
- DO use sample/demo data or placeholder information
- DO ensure compliance with privacy regulations (GDPR, CCPA, etc.)
- Consider obtaining screenshots from staging/demo environments, not production

---

## Next Steps

1. Capture the recommended screenshots from each project
2. Resize and optimize images per specifications above
3. Update `index.html` to include image paths in the portfolio cards
4. Test responsive behavior across devices
5. Verify all images load correctly and display well
