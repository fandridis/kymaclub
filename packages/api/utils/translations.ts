/**
 * Backend translations for push notifications and emails
 * Mirrors the mobile app's supported languages (en, el)
 */

export const SUPPORTED_LANGUAGES = ['en', 'el'] as const;
export type SupportedLanguage = typeof SUPPORTED_LANGUAGES[number];
export const DEFAULT_LANGUAGE: SupportedLanguage = 'el'; // Default to Greek for users without language preference

// Push notification translations
const pushNotificationTranslations = {
    en: {
        credits_arrived: {
            title: 'Credits arrived!',
            body: 'You have been gifted {{credits}} credits from KymaClub.',
        },
        booking_cancelled_by_business: {
            title: 'Booking cancelled',
            body: 'Your booking for {{className}} - {{venueName}} at {{classTime}} has been cancelled by the venue.',
        },
        booking_approved: {
            title: 'Booking approved!',
            body: 'Your booking for {{className}} at {{venueName}} has been approved.',
        },
        booking_rejected: {
            title: 'Booking request declined',
            body: 'Your booking request for {{className}} was declined.{{reason}} Your credits have been refunded.',
        },
        class_rebookable: {
            title: 'Booking Available Again',
            body: 'Your cancelled booking for {{className}} - {{venueName}} at {{classTime}} is now available to rebook.',
        },
        credits_received_subscription_renewal: {
            title: 'Monthly credits renewed!',
            body: "You've received {{credits}} credits from your {{planName}} subscription.",
        },
        credits_received_subscription_initial: {
            title: 'Welcome credits received!',
            body: "You've received {{credits}} credits from your {{planName}} subscription.",
        },
        welcome_bonus: {
            title: 'Welcome to KymaClub!',
            body: "You've received {{credits}} welcome bonus credits!",
        },
        class_reminder_1h: {
            title: 'Class starting soon!',
            body: '{{className}} starts in 1 hour. Get ready!',
        },
        class_reminder_3h: {
            title: 'Reminder: Class in 3 hours',
            body: '{{className}} starts in 3 hours. Don\'t forget!',
        },
        class_reminder_30m: {
            title: 'Class starting very soon!',
            body: '{{className}} starts in 30 minutes. Time to head out!',
        },
    },
    el: {
        credits_arrived: {
            title: 'Τα credits έφτασαν!',
            body: 'Μόλις λάβατε δώρο {{credits}} credits από το KymaClub.',
        },
        booking_cancelled_by_business: {
            title: 'Η κράτηση ακυρώθηκε',
            body: 'Η κράτησή σας για {{className}} - {{venueName}} στις {{classTime}} ακυρώθηκε από το κατάστημα.',
        },
        booking_approved: {
            title: 'Η κράτηση εγκρίθηκε!',
            body: 'Η κράτησή σας για {{className}} στο {{venueName}} εγκρίθηκε.',
        },
        booking_rejected: {
            title: 'Το αίτημα κράτησης απορρίφθηκε',
            body: 'Το αίτημα κράτησης για {{className}} απορρίφθηκε. Τα credits σας επιστράφηκαν.',
        },
        class_rebookable: {
            title: 'Η κράτηση είναι ξανά διαθέσιμη',
            body: 'Η ακυρωμένη κράτησή σας για {{className}} - {{venueName}} στις {{classTime}} είναι τώρα διαθέσιμη για νέα κράτηση.',
        },
        credits_received_subscription_renewal: {
            title: 'Τα μηνιαία credits ανανεώθηκαν!',
            body: 'Λάβατε {{credits}} credits από τη συνδρομή {{planName}}.',
        },
        credits_received_subscription_initial: {
            title: 'Λήφθηκαν τα credits καλωσορίσματος!',
            body: 'Λάβατε {{credits}} credits από τη συνδρομή {{planName}}.',
        },
        welcome_bonus: {
            title: 'Καλώς ήρθατε στο KymaClub!',
            body: 'Λάβατε {{credits}} bonus credits καλωσορίσματος!',
        },
        class_reminder_1h: {
            title: 'Το μάθημα ξεκινά σύντομα!',
            body: 'Το {{className}} ξεκινά σε 1 ώρα. Ετοιμαστείτε!',
        },
        class_reminder_3h: {
            title: 'Υπενθύμιση: Μάθημα σε 3 ώρες',
            body: 'Το {{className}} ξεκινά σε 3 ώρες. Μην το ξεχάσετε!',
        },
        class_reminder_30m: {
            title: 'Το μάθημα ξεκινά πολύ σύντομα!',
            body: 'Το {{className}} ξεκινά σε 30 λεπτά. Ώρα να ξεκινήσετε!',
        },
    },
} as const;

// Email translations
const emailTranslations = {
    en: {
        credits_gift: {
            subject: "🎁 You've been gifted {{credits}} credits!",
            greeting: 'Hi {{name}}, KymaClub have just sent you',
            credits_text: '{{credits}} credits',
            note_label: 'Note',
            balance_title: '📊 Your Credit Balance',
            balance_label: 'Total Credits Available',
            cta_button: 'Book a Class Now',
            footer: "Questions? We're here to help! Contact us at",
        },
        otp_sign_in: {
            subject: 'Sign in to KymaClub',
            preheader: 'Your verification code is {{code}}',
            title: 'Welcome back!',
            body: 'Use the verification code below to sign in to your KymaClub account. This code will expire in 15 minutes for your security.',
            code_label: 'Verification Code',
            warning: 'Never share this code with anyone. KymaClub will never ask you for this code via phone or email.',
            ignore_notice: "If you didn't request this code, you can safely ignore this email.",
            plain_text: 'Welcome to KymaClub! Your verification code is: {{code}}. This code expires in 15 minutes.',
        },
        otp_password_reset: {
            subject: 'Reset your password - KymaClub',
            preheader: 'Your password reset code is {{code}}',
            title: 'Reset your password',
            body: 'Use the verification code below to reset your password. This code will expire in 24 hours.',
            code_label: 'Reset Code',
            warning: 'If you did not request a password reset, please ignore this email or contact support.',
            ignore_notice: 'Your password will not change until you use this code.',
            plain_text: 'Reset your password. Your verification code is: {{code}}. This code expires in 24 hours.',
        },
    },
    el: {
        credits_gift: {
            subject: '🎁 {{credits}} credits από εμάς. Go crazy!',
            greeting: 'Γεια σου {{name}}, το KymaClub μόλις σου έστειλε',
            credits_text: '{{credits}} credits',
            note_label: 'Σημείωση',
            balance_title: '📊 Το Υπόλοιπό σου',
            balance_label: 'Συνολικά Διαθέσιμα Credits',
            cta_button: 'Κάνε Κράτηση Τώρα',
            footer: 'Ερωτήσεις; Είμαστε εδώ για να βοηθήσουμε! Επικοινωνήστε μαζί μας στο',
        },
        otp_sign_in: {
            subject: 'Σύνδεση στο KymaClub',
            preheader: 'Ο κωδικός επαλήθευσής σου είναι {{code}}',
            title: 'Καλώς ήρθες πίσω!',
            body: 'Χρησιμοποίησε τον παρακάτω κωδικό επαλήθευσης για να συνδεθείς στον λογαριασμό σου KymaClub. Αυτός ο κωδικός λήγει σε 15 λεπτά για την ασφάλειά σου.',
            code_label: 'Κωδικός Επαλήθευσης',
            warning: 'Μην μοιράζεσαι ποτέ αυτόν τον κωδικό. Το KymaClub δεν θα σου ζητήσει ποτέ αυτόν τον κωδικό μέσω τηλεφώνου ή email.',
            ignore_notice: 'Αν δεν ζήτησες αυτόν τον κωδικό, μπορείς να αγνοήσεις αυτό το email.',
            plain_text: 'Καλώς ήρθες στο KymaClub! Ο κωδικός επαλήθευσής σου είναι: {{code}}. Αυτός ο κωδικός λήγει σε 15 λεπτά.',
        },
        otp_password_reset: {
            subject: 'Επαναφορά κωδικού - KymaClub',
            preheader: 'Ο κωδικός επαναφοράς σου είναι {{code}}',
            title: 'Επαναφορά κωδικού',
            body: 'Χρησιμοποίησε τον παρακάτω κωδικό επαλήθευσης για να επαναφέρεις τον κωδικό σου. Αυτός ο κωδικός λήγει σε 24 ώρες.',
            code_label: 'Κωδικός Επαναφοράς',
            warning: 'Αν δεν ζήτησες επαναφορά κωδικού, αγνόησε αυτό το email ή επικοινώνησε με την υποστήριξη.',
            ignore_notice: 'Ο κωδικός σου δεν θα αλλάξει μέχρι να χρησιμοποιήσεις αυτόν τον κωδικό.',
            plain_text: 'Επαναφορά κωδικού. Ο κωδικός επαλήθευσής σου είναι: {{code}}. Αυτός ο κωδικός λήγει σε 24 ώρες.',
        },
    },
} as const;

type PushNotificationKey = keyof typeof pushNotificationTranslations['en'];
type EmailKey = keyof typeof emailTranslations['en'];

// Type-safe OTP email translations interface
// Both otp_sign_in and otp_password_reset share this structure
export interface OTPEmailTranslations {
    readonly subject: string;
    readonly preheader: string;
    readonly title: string;
    readonly body: string;
    readonly code_label: string;
    readonly warning: string;
    readonly ignore_notice: string;
    readonly plain_text: string;
}

/**
 * Resolve language to a supported language, falling back to default
 */
export function resolveLanguage(language: string | undefined | null): SupportedLanguage {
    if (language && SUPPORTED_LANGUAGES.includes(language as SupportedLanguage)) {
        return language as SupportedLanguage;
    }
    return DEFAULT_LANGUAGE;
}

/**
 * Simple string interpolation for templates
 */
function interpolate(template: string, params: Record<string, string | number>): string {
    let result = template;
    for (const [key, value] of Object.entries(params)) {
        result = result.replace(new RegExp(`\\{\\{${key}\\}\\}`, 'g'), String(value));
    }
    return result;
}

/**
 * Get push notification text in the user's language
 */
export function getPushNotificationText(
    language: string | undefined | null,
    key: PushNotificationKey,
    params?: Record<string, string | number>
): { title: string; body: string } {
    const lang = resolveLanguage(language);
    const template = pushNotificationTranslations[lang][key];

    let title: string = template.title;
    let body: string = template.body;

    if (params) {
        title = interpolate(title, params);
        body = interpolate(body, params);
    }

    return { title, body };
}

// Type for credits gift email translation content
type CreditsGiftEmailContent = {
    subject: string;
    greeting: string;
    credits_text: string;
    note_label: string;
    balance_title: string;
    balance_label: string;
    cta_button: string;
    footer: string;
};

/**
 * Get email content in the user's language (legacy function for credits_gift)
 */
export function getEmailTranslations(
    language: string | undefined | null,
    key: 'credits_gift'
): CreditsGiftEmailContent {
    const lang = resolveLanguage(language);
    return emailTranslations[lang][key];
}

/**
 * Get OTP email translations in the user's language
 */
export function getOTPEmailTranslations(
    language: string | undefined | null,
    key: 'otp_sign_in' | 'otp_password_reset'
): OTPEmailTranslations {
    const lang = resolveLanguage(language);
    return emailTranslations[lang][key];
}

/**
 * Interpolate a single text field with parameters
 */
export function interpolateText(
    text: string,
    params: Record<string, string | number>
): string {
    return interpolate(text, params);
}

