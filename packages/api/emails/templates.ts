// Email template system inspired by your flowing logo
// emails/createEmailTemplate.ts
export const createEmailTemplate = ({
  title,
  preheader,
  content,
  primaryColor = "#16a34a", // Green from your logo
  accentColor = "#F97316",  // Orange accent
}: {
  title?: string;
  preheader?: string;
  content?: string;
  primaryColor?: string;
  accentColor?: string;
}) => {
  return `
  <!DOCTYPE html>
  <html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="x-apple-disable-message-reformatting">
    <title>${title ?? "KymaClub Email"}</title>
  
    <!--[if mso]>
    <noscript>
      <xml>
        <o:OfficeDocumentSettings>
          <o:PixelsPerInch>96</o:PixelsPerInch>
        </o:OfficeDocumentSettings>
      </xml>
    </noscript>
    <![endif]-->
  
    <style>
      /* Reset styles */
      * { box-sizing: border-box; margin: 0; padding: 0; }
      body {
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        background-color: #f8fafc;
        color: #334155;
        line-height: 1.6;
        margin: 0;
        padding: 0;
      }
      .email-container {
        max-width: 600px;
        margin: 0 auto;
        background-color: #ffffff;
        box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        border-radius: 16px;
        overflow: hidden;
      }
      .email-header {
        background: linear-gradient(
          135deg, ${primaryColor} 0%, #06D6A0 25%, #7C3AED 50%, #F472B6 75%, ${accentColor} 100%
        );
        background-size: 400% 400%;
        animation: flow 8s ease-in-out infinite;
        padding: 40px 32px;
        text-align: center;
        position: relative;
        overflow: hidden;
      }
      @keyframes flow {
        0%, 100% { background-position: 0% 50%; }
        50% { background-position: 100% 50%; }
      }
      .email-header::before {
        content: '';
        position: absolute;
        top: 0; left: 0; right: 0; bottom: 0;
        background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 320"><path fill="rgba(255,255,255,0.1)" d="M0,160L48,138.7C96,117,192,75,288,80C384,85,480,139,576,154.7C672,171,768,149,864,138.7C960,128,1056,128,1152,144C1248,160,1344,192,1392,208L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"></path></svg>')
          no-repeat bottom center;
        background-size: cover;
        opacity: 0.3;
      }
      .logo {
        color: white;
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        position: relative;
        z-index: 1;
      }
      .tagline {
        color: rgba(255, 255, 255, 0.9);
        font-size: 16px;
        font-weight: 500;
        position: relative;
        z-index: 1;
      }
      .email-content { padding: 48px 32px; }
      .content-title {
        font-size: 24px;
        font-weight: 700;
        color: #1e293b;
        margin-bottom: 16px;
        text-align: center;
      }
      .content-body {
        font-size: 16px;
        color: #475569;
        margin-bottom: 32px;
        text-align: center;
      }
      .cta-button {
        display: inline-block;
        background: linear-gradient(135deg, ${primaryColor}, #06D6A0);
        color: white !important;
        text-decoration: none;
        padding: 16px 32px;
        border-radius: 12px;
        font-weight: 600;
        font-size: 16px;
        text-align: center;
        box-shadow: 0 4px 15px rgba(16, 185, 129, 0.4);
        transition: all 0.3s ease;
        border: none;
        cursor: pointer;
      }
      .cta-button:hover {
        transform: translateY(-2px);
        box-shadow: 0 8px 25px rgba(16, 185, 129, 0.5);
      }
      .otp-code {
        border: 2px dashed ${primaryColor};
        border-radius: 16px;
        padding: 24px;
        margin: 32px 0;
        text-align: center;
      }
      .otp-digits {
        font-family: 'SF Mono', Monaco, 'Consolas', monospace;
        font-size: 36px;
        font-weight: bold;
        color: #1e293b;
        letter-spacing: 8px;
        text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
      }
      .otp-label {
        font-size: 14px;
        color: #64748b;
        margin-top: 8px;
        font-weight: 500;
      }
      .email-footer {
        background: #f8fafc;
        padding: 32px;
        text-align: center;
        border-top: 1px solid #e2e8f0;
      }
      .footer-links { margin-bottom: 20px; }
      .footer-links a {
        color: ${primaryColor};
        text-decoration: none;
        margin: 0 16px;
        font-weight: 500;
      }
      .footer-text {
        font-size: 14px;
        color: #64748b;
        margin-bottom: 8px;
      }
      .footer-address {
        font-size: 12px;
        color: #94a3b8;
      }
      @media only screen and (max-width: 600px) {
        .email-container { margin: 0; border-radius: 0; }
        .email-header { padding: 32px 20px; }
        .email-content { padding: 32px 20px; }
        .email-footer { padding: 24px 20px; }
        .otp-digits { font-size: 28px; letter-spacing: 4px; }
        .content-title { font-size: 20px; }
      }
      @media (prefers-color-scheme: dark) {
        .email-container { background-color: #1e293b; }
        .content-title { color: #f1f5f9; }
        .content-body { color: #cbd5e1; }
        .email-footer { background: #0f172a; border-top-color: #334155; }
        .footer-text { color: #94a3b8; }
        .footer-address { color: #64748b; }
        .otp-digits { color: #f1f5f9; }
      }
    </style>
  </head>
  <body>
    <!-- Preheader text (hidden) -->
    ${preheader
      ? `<span style="display:none; font-size:0; line-height:0; max-height:0; max-width:0; opacity:0; overflow:hidden; mso-hide:all;">
            ${preheader}
          </span>`
      : ""
    }
  
    <div class="email-container">
      <!-- Header -->
      <div class="email-header">
        <div class="logo">KymaClub</div>
        <div class="tagline">Το wellness, όπως το θες!</div>
      </div>
  
      <!-- Content -->
      <div class="email-content">
        ${content ?? ""}
      </div>
  
      <!-- Footer -->
      <div class="email-footer">
        <div class="footer-links">
          <a href="https://kymaclub.com/help">Help Center</a>
          <a href="https://kymaclub.com/contact">Contact</a>
          <a href="https://kymaclub.com/privacy">Privacy</a>
        </div>
        <div class="footer-text">
          Thanks for choosing KymaClub to power your fitness journey!
        </div>
        <div class="footer-address">
          KymaClub Inc. • Made with ❤️ for fitness enthusiasts
        </div>
      </div>
    </div>
  </body>
  </html>
  `;
};

// Specific email templates
const createOTPEmail = ({ token }: { token: string }) => {
  return createEmailTemplate({
    title: "Sign in to KymaClub",
    preheader: `Your verification code is ${token}`,
    content: `
      <h1 class="content-title">Welcome back!</h1>
      <p class="content-body">
        Use the verification code below to sign in to your KymaClub account. This code will expire in 15 minutes for your security.
      </p>
      
      <div class="otp-code">
        <div class="otp-digits">${token}</div>
        <div class="otp-label">Verification Code</div>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 32px;">
        Never share this code with anyone. KymaClub will never ask you for this code via phone or email.
      </p>
      
      <p style="text-align: center; color: #64748b; font-size: 14px; margin-top: 16px;">
        If you didn't request this code, you can safely ignore this email.
      </p>
    `
  });
};

const createBookingConfirmationEmail = ({ className, venueName, venueLocation, startTime, instructorName }: { className: string, venueName: string, venueLocation: string, startTime: string, instructorName: string }) => {
  return createEmailTemplate({
    title: "Booking Confirmed - KymaClub",
    preheader: `New booking! Your ${className} class is confirmed`,
    content: `
      <h1 class="content-title">🎉 Booking Confirmed!</h1>
      <p class="content-body">
        Great news! Your class booking has been confirmed. We can't wait to see you there!
      </p>
      
      <div class="details-box">
        <h3 style="margin: 0 0 16px 0; color: #16a34a;">Class Details</h3>
        <p style="margin: 0 0 8px 0;"><strong>Class:</strong> ${className}</p>
        <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Instructor:</strong> ${instructorName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Location:</strong> ${venueLocation}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${new Date(startTime).toLocaleString()}</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com/bookings" class="cta-button">View My Bookings</a>
      </div>
      
      <div class="info-box">
        <strong>Remember:</strong> Please arrive 10-15 minutes early and bring a water bottle and towel if needed.
      </div>
        `
  });
};

const createClassCancellationEmail = ({ className, venueName, startTime, refundAmount }: { className: string, venueName: string, startTime: string, refundAmount: number }) => {
  return createEmailTemplate({
    title: "Class Cancelled - KymaClub",
    preheader: `Class cancelled: ${className} has been cancelled`,
    content: `
      <h1 class="content-title">Class Cancellation Notice</h1>
      <p class="content-body">
        We're sorry to inform you that the following class has been cancelled by the studio:
      </p>
      
      <div class="details-box warning">
        <h3 style="margin: 0 0 16px 0; color: #F97316;">Cancelled Class</h3>
        <p style="margin: 0 0 8px 0;"><strong>Class:</strong> ${className}</p>
        <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0;"><strong>Original Time:</strong> ${new Date(startTime).toLocaleString()}</p>
      </div>
      
      <div class="details-box success">
        <h3 style="margin: 0 0 16px 0; color: #16a34a;">Automatic Refund</h3>
        <p style="margin: 0;">Your ${refundAmount} credits have been automatically refunded to your account and are available for immediate use.</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://app.kymaclub.com/classes" class="cta-button">Browse Other Classes</a>
      </div>
      
      <p style="text-align: center; color: #64748b; font-size: 14px;">
        We apologize for any inconvenience caused. Thank you for your understanding!
      </p>
    `
  });
};

const createBusinessNotificationEmail = ({
  businessName,
  customerName,
  customerEmail,
  className,
  venueName,
  classTime,
  bookingAmount,
  notificationType
}: {
  businessName: string;
  customerName: string;
  customerEmail?: string;
  className: string;
  venueName: string;
  classTime: string;
  bookingAmount: number;
  notificationType: "booking_created" | "booking_cancelled_by_consumer" | "booking_cancelled_by_business";
}) => {
  const isBooking = notificationType === "booking_created";
  const isCancelledByBusiness = notificationType === "booking_cancelled_by_business";
  const title = isBooking ? "New Booking Received!" : isCancelledByBusiness ? "Your Booking Cancelled" : "Booking Cancelled";
  const emoji = isBooking ? "🎉" : "⚠️";
  const color = isBooking ? "#16a34a" : "#F97316";

  return createEmailTemplate({
    title: `Business Notification - ${title}`,
    preheader: `${customerName} ${isBooking ? 'booked' : 'cancelled'} ${className}`,
    content: `
      <h1 class="content-title">${emoji} ${title}</h1>
      <p class="content-body">
        ${isBooking
        ? `Great news! You have a new booking from ${customerName}.`
        : isCancelledByBusiness
          ? `Your booking for ${className} has been cancelled. We apologize for any inconvenience.`
          : `${customerName} has cancelled their booking for ${className}.`
      }
      </p>
      
      <div class="details-box" style="border: 2px solid ${color}; border-radius: 12px; padding: 24px; margin: 24px 0; background: ${isBooking ? '#f0fdf4' : '#fef3e2'};">
        <h3 style="margin: 0 0 16px 0; color: ${color};">${isBooking ? 'Booking' : 'Cancelled Booking'} Details</h3>
        <p style="margin: 0 0 8px 0;"><strong>Customer:</strong> ${customerName}</p>
        ${customerEmail ? `<p style="margin: 0 0 8px 0;"><strong>Email:</strong> ${customerEmail}</p>` : ''}
        <p style="margin: 0 0 8px 0;"><strong>Class:</strong> ${className}</p>
        <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Time:</strong> ${classTime}</p>
        <p style="margin: 0;"><strong>Amount:</strong> ${bookingAmount} credits</p>
      </div>
      
      <div style="text-align: center; margin: 32px 0;">
        <a href="https://business.orcavo.com/dashboard" class="cta-button">View Dashboard</a>
      </div>
      
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin: 24px 0; border-left: 4px solid ${color};">
        <p style="margin: 0; font-size: 14px; color: #64748b;">
          ${isBooking
        ? `This booking has been automatically confirmed. You can view all your bookings and manage your classes in your business dashboard.`
        : `The customer's credits have been automatically refunded according to your cancellation policy. No action needed from your side.`
      }
        </p>
      </div>
    `
  });
};

// Export the template functions for use in other parts of your app
export {
  createOTPEmail,
  createBookingConfirmationEmail,
  createClassCancellationEmail,
  createBusinessNotificationEmail
};

// New: Review notification email to businesses
export const createReviewNotificationEmail = ({
  businessName,
  venueName,
  reviewerName,
  rating,
  comment,
}: {
  businessName: string;
  venueName: string;
  reviewerName?: string;
  rating: number;
  comment?: string;
}) => {
  const safeReviewer = reviewerName || "A customer";
  const stars = "★".repeat(Math.max(0, Math.min(5, Math.round(rating)))) +
    "☆".repeat(Math.max(0, 5 - Math.round(rating)));

  return createEmailTemplate({
    title: "New user review!",
    preheader: `New review for ${venueName}`,
    content: `
      <h1 class="content-title">New user review!</h1>
      <p class="content-body">
        ${safeReviewer} left a new review for ${venueName}.
      </p>

      <div class="details-box" style="border: 2px solid #16a34a; border-radius: 12px; padding: 24px; margin: 24px 0; background: #f0fdf4;">
        <p style="margin: 0 0 8px 0;"><strong>Business:</strong> ${businessName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Venue:</strong> ${venueName}</p>
        <p style="margin: 0 0 8px 0;"><strong>Rating:</strong> ${stars} (${rating}/5)</p>
        ${comment ? `<p style="margin: 8px 0 0 0;"><strong>Comment:</strong> ${comment}</p>` : ''}
      </div>

      <div style="text-align: center; margin: 32px 0;">
        <a href="https://business.orcavo.com/dashboard" class="cta-button">View in Dashboard</a>
      </div>
    `,
  });
};
