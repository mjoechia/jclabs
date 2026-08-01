// Shared vCard Builder Module
// Consolidates vCard text generation across the site

function buildVCardText({
  fullName,
  title = "",
  company = "",
  email = "",
  phone = "",
  website = "",
  wechatId = "",
  whatsappNumber = "",
} = {}) {
  if (!fullName) {
    throw new Error("fullName is required");
  }

  const lines = ["BEGIN:VCARD", "VERSION:4.0"];

  // FN (formatted name) - required in vCard 4.0
  lines.push(`FN:${fullName}`);

  // N (structured name) - optional but recommended
  // Format: N:LastName;FirstName;;;
  const nameParts = fullName.trim().split(/\s+/);
  if (nameParts.length > 1) {
    const lastName = nameParts[nameParts.length - 1];
    const firstName = nameParts.slice(0, -1).join(" ");
    lines.push(`N:${lastName};${firstName};;;`);
  } else {
    lines.push(`N:${fullName};;;;`);
  }

  // Optional fields
  if (title) {
    lines.push(`TITLE:${title}`);
  }

  if (company) {
    lines.push(`ORG:${company}`);
  }

  if (email) {
    lines.push(`EMAIL:${email.toLowerCase()}`);
  }

  if (phone) {
    lines.push(`TEL:${phone}`);
  }

  if (website) {
    let url = website;
    if (!url.startsWith("http://") && !url.startsWith("https://")) {
      url = "https://" + url;
    }
    lines.push(`URL:${url}`);
  }

  // Custom properties for social/messaging (vCard 4.0 supports X- fields)
  if (wechatId) {
    lines.push(`X-WECHAT:${wechatId}`);
  }

  if (whatsappNumber) {
    lines.push(`X-WHATSAPP:${whatsappNumber}`);
  }

  lines.push("END:VCARD");
  return lines.join("\r\n");
}

// Helper: Download vCard as .vcf file
function downloadVCard(filename, vcardText) {
  const element = document.createElement("a");
  element.setAttribute("href", "data:text/plain;charset=utf-8," + encodeURIComponent(vcardText));
  element.setAttribute("download", `${filename}.vcf`);
  element.style.display = "none";
  document.body.appendChild(element);
  element.click();
  document.body.removeChild(element);
}

// Helper: Sanitize filename (spaces to hyphens, lowercase)
function sanitizeFilename(name) {
  return name.toLowerCase().replace(/\s+/g, "-").replace(/[^\w\-]/g, "");
}
