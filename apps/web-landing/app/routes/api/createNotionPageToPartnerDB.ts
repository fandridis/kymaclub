import type { Route } from "./+types/createNotionPageToPartnerDB";
import { Resend } from "resend";

interface FormData {
  email: string;
  name: string;
  phone: string;
  area: string;
  website: string;
}

// Security constants
const MAX_NAME_LENGTH = 100;
const MAX_REQUEST_SIZE = 1024; // 1KB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_PHONE_LENGTH = 15;
const MAX_AREA_LENGTH = 100;
const MAX_WEBSITE_LENGTH = 200;

// Rate limiting storage (in production, use Redis or similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, "") // Remove potential HTML tags
    .replace(/[&]/g, "&amp;") // Escape ampersands
    .replace(/["]/g, "&quot;") // Escape quotes
    .replace(/[']/g, "&#x27;") // Escape apostrophes
    .replace(/[/]/g, "&#x2F;"); // Escape forward slashes
}

function validateEmail(email: string): boolean {
  return EMAIL_REGEX.test(email) && email.length <= 254; // RFC 5321 limit
}

function validateName(name: string): boolean {
  return name.length > 0 && name.length <= MAX_NAME_LENGTH;
}

function validatePhone(phone: string): boolean {
  return phone.length > 0 && phone.length <= MAX_PHONE_LENGTH;
}

function validateArea(area: string): boolean {
  return area.length > 0 && area.length <= MAX_AREA_LENGTH;
}

function validateWebsite(website: string): boolean {
  return website.length > 0 && website.length <= MAX_WEBSITE_LENGTH;
}

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  if (!rateLimit || now > rateLimit.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 300000 }); // 5 minutes
    return false;
  }

  if (rateLimit.count >= 1) {
    // 1 request per 5 minutes
    return true;
  }

  rateLimit.count++;
  return false;
}

function createPartnerWaitlistEmailHtml(data: {
  name: string;
  email: string;
  phone: string;
  area: string;
  website: string;
}): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>New Business Partner Signup</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 32px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
        <h2 style="color: #7c3aed; margin-bottom: 24px; font-size: 24px;">🏢 New Business Partner Signup</h2>
        
        <table style="width: 100%; border-collapse: collapse;">
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569; width: 120px;">Business Name:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.name}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Email:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
              <a href="mailto:${data.email}" style="color: #7c3aed;">${data.email}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Phone:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
              <a href="tel:${data.phone}" style="color: #7c3aed;">${data.phone}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Location:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">${data.area}</td>
          </tr>
          <tr>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #475569;">Website:</td>
            <td style="padding: 12px 0; border-bottom: 1px solid #e2e8f0; color: #1e293b;">
              <a href="${data.website.startsWith("http") ? data.website : `https://${data.website}`}" style="color: #7c3aed;" target="_blank">${data.website}</a>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 0; font-weight: 600; color: #475569;">Date:</td>
            <td style="padding: 12px 0; color: #1e293b;">${new Date().toLocaleString("el-GR", { timeZone: "Europe/Athens" })}</td>
          </tr>
        </table>
        
        <div style="margin-top: 24px; padding: 16px; background-color: #f5f3ff; border-radius: 8px; border-left: 4px solid #7c3aed;">
          <p style="margin: 0; color: #5b21b6; font-size: 14px;">
            A new business partner has signed up from the KymaClub landing page. Reach out to schedule a meeting!
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}

export async function action({ request, context }: Route.ActionArgs) {
  try {
    // Only handle POST requests
    if (request.method !== "POST") {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Method not allowed",
        }),
        {
          status: 405,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "POST",
            "Access-Control-Allow-Headers": "Content-Type",
          },
        }
      );
    }

    // Get client IP for rate limiting
    const clientIP =
      request.headers.get("CF-Connecting-IP") ||
      request.headers.get("X-Forwarded-For") ||
      "unknown";

    // Rate limiting check
    if (isRateLimited(clientIP)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Too many requests. Please try again later.",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": "60",
          },
        }
      );
    }

    // Check request size
    const contentLength = request.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > MAX_REQUEST_SIZE) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Request too large",
        }),
        {
          status: 413,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Parse the request body
    const body: FormData = await request.json();
    const { email, name, phone, area, website } = body;

    if (!email || !name || !phone || !area || !website) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email, name, phone, area and website are required",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Sanitize and validate inputs
    const sanitizedEmail = sanitizeInput(email);
    const sanitizedName = sanitizeInput(name);
    const sanitizedPhone = sanitizeInput(phone);
    const sanitizedArea = sanitizeInput(area);
    const sanitizedWebsite = sanitizeInput(website);

    if (!validateEmail(sanitizedEmail)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Invalid email format",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!validateName(sanitizedName)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Name must be between 1 and ${MAX_NAME_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!validatePhone(sanitizedPhone)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Phone must be between 1 and ${MAX_PHONE_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!validateArea(sanitizedArea)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Area must be between 1 and ${MAX_AREA_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    if (!validateWebsite(sanitizedWebsite)) {
      return new Response(
        JSON.stringify({
          success: false,
          message: `Website must be between 1 and ${MAX_WEBSITE_LENGTH} characters`,
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Get Resend API key from environment
    const resendApiKey = context.cloudflare.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("Missing RESEND_API_KEY environment variable");
      return new Response(
        JSON.stringify({
          success: false,
          message: "Service temporarily unavailable",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Send email notification
    const resend = new Resend(resendApiKey);
    const { error } = await resend.emails.send({
      from: "KymaClub Partners <waitlist@app.orcavo.com>",
      to: "hello@orcavo.com",
      subject: `🏢 New Business Partner Signup: ${sanitizedName}`,
      html: createPartnerWaitlistEmailHtml({
        name: sanitizedName,
        email: sanitizedEmail,
        phone: sanitizedPhone,
        area: sanitizedArea,
        website: sanitizedWebsite,
      }),
      replyTo: sanitizedEmail,
    });

    if (error) {
      console.error("Failed to send email:", error);
      return new Response(
        JSON.stringify({
          success: false,
          message: "Failed to add to waitlist. Please try again.",
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added to waitlist",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing partner signup:", error);

    return new Response(
      JSON.stringify({
        success: false,
        message: "Failed to add to waitlist. Please try again.",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}

export async function loader({ context }: Route.LoaderArgs) {
  return new Response(
    JSON.stringify({
      message: "This endpoint accepts POST requests with email and name data",
    }),
    {
      headers: { "Content-Type": "application/json" },
    }
  );
}
