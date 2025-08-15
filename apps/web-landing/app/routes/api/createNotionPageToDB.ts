import type { Route } from "./+types/createNotionPageToDB";

interface FormData {
  email: string;
  name: string;
}

interface NotionPageProperties {
  Name: {
    title: Array<{
      text: {
        content: string;
      };
    }>;
  };
  Email: {
    email: string;
  };
  Source: {
    select: {
      name: string;
    };
  };
  "Signup Date": {
    date: {
      start: Date;
    };
  };
}

interface NotionPageRequest {
  parent: {
    database_id: string;
  };
  properties: NotionPageProperties;
}

interface NotionPageResponse {
  id: string;
  [key: string]: any;
}

// Security constants
const MAX_NAME_LENGTH = 100;
const MAX_REQUEST_SIZE = 1024; // 1KB
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function isRateLimited(clientIP: string): boolean {
  const now = Date.now();
  const rateLimit = rateLimitMap.get(clientIP);

  if (!rateLimit || now > rateLimit.resetTime) {
    rateLimitMap.set(clientIP, { count: 1, resetTime: now + 60000 }); // 1 minute
    return false;
  }

  if (rateLimit.count >= 1) {
    // 1 request per minute
    return true;
  }

  rateLimit.count++;
  return false;
}

async function checkEmailExists(
  email: string,
  databaseId: string,
  apiKey: string
): Promise<boolean> {
  try {
    const response = await fetch(
      `https://api.notion.com/v1/databases/${databaseId}/query`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Notion-Version": "2022-06-28",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          filter: {
            property: "Email",
            email: {
              equals: email,
            },
          },
        }),
      }
    );

    if (response.ok) {
      const data = (await response.json()) as { results: any[] };
      return data.results.length > 0;
    }
    return false;
  } catch (error) {
    console.error("Error checking email existence:", error);
    return false;
  }
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
    const { email, name } = body;

    // Validate required fields
    if (!email || !name) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email and name are required",
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

    // Get database ID and API key from environment variables
    const databaseId = context.cloudflare.env.NOTION_PAGE_CONSUMER_WL_ID;
    const apiKey = context.cloudflare.env.NOTION_API_KEY;

    if (!databaseId || !apiKey) {
      console.error("Missing required environment variables");
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

    // Check if email already exists
    const emailExists = await checkEmailExists(
      sanitizedEmail,
      databaseId,
      apiKey
    );
    if (emailExists) {
      return new Response(
        JSON.stringify({
          success: false,
          message: "Email already registered",
        }),
        {
          status: 409,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Prepare page properties for Notion
    const pageProperties: NotionPageProperties = {
      Name: {
        title: [{ text: { content: sanitizedName } }],
      },
      Email: {
        email: sanitizedEmail,
      },
      Source: {
        select: {
          name: "Landing page",
        },
      },
      "Signup Date": {
        date: {
          start: new Date(),
        },
      },
    };

    // Create the page in Notion database using the Notion API
    const notionRequest: NotionPageRequest = {
      parent: {
        database_id: databaseId,
      },
      properties: pageProperties,
    };

    const response = await fetch("https://api.notion.com/v1/pages", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Notion-Version": "2022-06-28",
        "Content-Type": "application/json",
      },
      body: JSON.stringify(notionRequest),
    });

    if (!response.ok) {
      console.error("Notion API error:", response.status);
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

    const newPage = (await response.json()) as NotionPageResponse;
    console.log("Successfully created Notion page:", newPage.id);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Successfully added to waitlist",
        pageId: newPage.id,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error creating Notion page:", error);

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
