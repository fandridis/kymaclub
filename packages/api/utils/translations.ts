/**
 * Backend translations for push notifications and emails
 * Mirrors the mobile app's supported languages (en, el)
 */

import type {
    OTPEmailTranslations,
    BookingConfirmationTranslations,
    ClassCancellationTranslations,
    CreditsGiftTranslations,
    WelcomeEmailTranslations,
    CreditsReceivedTranslations,
} from "../emails/consumer/types";

import type {
    BusinessNewBookingTranslations,
    BusinessBookingCancelledByConsumerTranslations,
    BusinessBookingCancelledByBusinessTranslations,
    BusinessBookingAwaitingApprovalTranslations,
    BusinessBookingApprovedTranslations,
    BusinessBookingRejectedTranslations,
    BusinessReviewTranslations,
} from "../emails/business/types";

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

// =============================================================================
// CONSUMER EMAIL TRANSLATIONS
// =============================================================================

const consumerEmailTranslations: {
    en: ConsumerEmailTranslationsMap;
    el: ConsumerEmailTranslationsMap;
} = {
    en: {
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
        booking_confirmation: {
            subject: 'Booking Confirmed: {{className}}',
            preheader: 'Your {{className}} class is confirmed',
            title: 'Booking Confirmed!',
            body: "Great news! Your class booking has been confirmed. We can't wait to see you there!",
            details_title: 'Class Details',
            class_label: 'Class',
            venue_label: 'Venue',
            instructor_label: 'Instructor',
            location_label: 'Location',
            time_label: 'Time',
            cta_button: 'View My Bookings',
            reminder: 'Please arrive 10-15 minutes early and bring a water bottle and towel if needed.',
        },
        class_cancellation: {
            subject: 'Class Cancelled: {{className}}',
            preheader: '{{className}} has been cancelled',
            title: 'Class Cancellation Notice',
            body: "We're sorry to inform you that the following class has been cancelled by the studio:",
            cancelled_class_title: 'Cancelled Class',
            class_label: 'Class',
            venue_label: 'Venue',
            original_time_label: 'Original Time',
            refund_title: 'Automatic Refund',
            refund_notice: 'Your {{credits}} credits have been automatically refunded to your account and are available for immediate use.',
            cta_button: 'Browse Other Classes',
            apology: 'We apologize for any inconvenience caused. Thank you for your understanding!',
        },
        credits_gift: {
            subject: "You've been gifted {{credits}} credits!",
            greeting: 'Hi {{name}}, KymaClub have just sent you',
            credits_text: '{{credits}} credits',
            note_label: 'Note',
            balance_title: 'Your Credit Balance',
            balance_label: 'Total Credits Available',
            cta_button: 'Book a Class Now',
            footer: "Questions? We're here to help! Contact us at",
        },
        welcome: {
            subject: 'Welcome to KymaClub! Your {{credits}} bonus credits are ready',
            title: 'Welcome to KymaClub!',
            greeting: 'Hi {{name}}!',
            credits_label: 'Welcome Bonus Credits',
            credits_ready: 'Ready to use right now!',
            what_can_you_do_title: 'What can you do with credits?',
            what_can_you_do_body: 'Use your credits to book amazing fitness classes across the city - from yoga and pilates to HIIT and dance classes!',
            cta_button: 'Explore Classes',
            how_to_start_title: "Here's how to get started:",
            step_1: 'Browse classes by location, type, or time',
            step_2: 'Find a class that fits your schedule',
            step_3: 'Book instantly with your credits',
            step_4: 'Show up and enjoy your workout!',
            help_text: "Need help? We're here for you! Contact us at",
        },
        credits_received: {
            subject_renewal: 'Your monthly credits have arrived!',
            subject_initial: 'Welcome! Your subscription credits are ready',
            title_renewal: 'Monthly Credits Renewed!',
            title_initial: 'Welcome Credits!',
            greeting: 'Hi {{name}}!',
            credits_label: 'Credits Added',
            from_plan: 'From your {{planName}}',
            balance_title: 'Your Credit Balance',
            balance_label: 'Total Credits Available',
            cta_button: 'Book Your Next Class',
            pro_tip_title: 'Pro Tip',
            pro_tip_renewal: 'Your credits renew monthly, so make sure to use them before your next billing cycle!',
            pro_tip_initial: 'Welcome to KymaClub! Use your credits to book amazing fitness classes across the city.',
            help_text: "Questions? We're here to help! Contact us at",
        },
    },
    el: {
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
        booking_confirmation: {
            subject: 'Η κράτηση επιβεβαιώθηκε: {{className}}',
            preheader: 'Το μάθημα {{className}} επιβεβαιώθηκε',
            title: 'Η κράτηση επιβεβαιώθηκε!',
            body: 'Υπέροχα νέα! Η κράτησή σου έχει επιβεβαιωθεί. Ανυπομονούμε να σε δούμε!',
            details_title: 'Λεπτομέρειες Μαθήματος',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            instructor_label: 'Εκπαιδευτής',
            location_label: 'Τοποθεσία',
            time_label: 'Ώρα',
            cta_button: 'Δες τις Κρατήσεις μου',
            reminder: 'Παρακαλούμε έλα 10-15 λεπτά νωρίτερα και φέρε μπουκάλι νερό και πετσέτα αν χρειάζεται.',
        },
        class_cancellation: {
            subject: 'Ακύρωση Μαθήματος: {{className}}',
            preheader: 'Το {{className}} ακυρώθηκε',
            title: 'Ειδοποίηση Ακύρωσης Μαθήματος',
            body: 'Λυπούμαστε που σας ενημερώνουμε ότι το παρακάτω μάθημα ακυρώθηκε από το studio:',
            cancelled_class_title: 'Ακυρωμένο Μάθημα',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            original_time_label: 'Αρχική Ώρα',
            refund_title: 'Αυτόματη Επιστροφή',
            refund_notice: 'Τα {{credits}} credits σου έχουν επιστραφεί αυτόματα στον λογαριασμό σου και είναι διαθέσιμα για άμεση χρήση.',
            cta_button: 'Δες Άλλα Μαθήματα',
            apology: 'Ζητούμε συγγνώμη για την αναστάτωση. Ευχαριστούμε για την κατανόησή σου!',
        },
        credits_gift: {
            subject: '{{credits}} credits από εμάς. Go crazy!',
            greeting: 'Γεια σου {{name}}, το KymaClub μόλις σου έστειλε',
            credits_text: '{{credits}} credits',
            note_label: 'Σημείωση',
            balance_title: 'Το Υπόλοιπό σου',
            balance_label: 'Συνολικά Διαθέσιμα Credits',
            cta_button: 'Κάνε Κράτηση Τώρα',
            footer: 'Ερωτήσεις; Είμαστε εδώ για να βοηθήσουμε! Επικοινωνήστε μαζί μας στο',
        },
        welcome: {
            subject: 'Καλώς ήρθες στο KymaClub! Τα {{credits}} bonus credits σου είναι έτοιμα',
            title: 'Καλώς ήρθες στο KymaClub!',
            greeting: 'Γεια σου {{name}}!',
            credits_label: 'Bonus Credits Καλωσορίσματος',
            credits_ready: 'Έτοιμα για χρήση αμέσως!',
            what_can_you_do_title: 'Τι μπορείς να κάνεις με τα credits;',
            what_can_you_do_body: 'Χρησιμοποίησε τα credits σου για να κλείσεις υπέροχα fitness μαθήματα σε όλη την πόλη - από yoga και pilates μέχρι HIIT και χορό!',
            cta_button: 'Εξερεύνησε Μαθήματα',
            how_to_start_title: 'Πώς να ξεκινήσεις:',
            step_1: 'Δες μαθήματα ανά τοποθεσία, τύπο ή ώρα',
            step_2: 'Βρες ένα μάθημα που ταιριάζει στο πρόγραμμά σου',
            step_3: 'Κλείσε αμέσως με τα credits σου',
            step_4: 'Εμφανίσου και απόλαυσε το workout σου!',
            help_text: 'Χρειάζεσαι βοήθεια; Είμαστε εδώ για σένα! Επικοινώνησε μαζί μας στο',
        },
        credits_received: {
            subject_renewal: 'Τα μηνιαία credits σου έφτασαν!',
            subject_initial: 'Καλώς ήρθες! Τα credits της συνδρομής σου είναι έτοιμα',
            title_renewal: 'Τα Μηνιαία Credits Ανανεώθηκαν!',
            title_initial: 'Τα Credits Καλωσορίσματος!',
            greeting: 'Γεια σου {{name}}!',
            credits_label: 'Credits που Προστέθηκαν',
            from_plan: 'Από τη συνδρομή {{planName}}',
            balance_title: 'Το Υπόλοιπό σου',
            balance_label: 'Συνολικά Διαθέσιμα Credits',
            cta_button: 'Κλείσε το Επόμενο Μάθημα',
            pro_tip_title: 'Συμβουλή',
            pro_tip_renewal: 'Τα credits σου ανανεώνονται μηνιαίως, οπότε φρόντισε να τα χρησιμοποιήσεις πριν τον επόμενο κύκλο χρέωσης!',
            pro_tip_initial: 'Καλώς ήρθες στο KymaClub! Χρησιμοποίησε τα credits σου για να κλείσεις υπέροχα fitness μαθήματα σε όλη την πόλη.',
            help_text: 'Ερωτήσεις; Είμαστε εδώ για να βοηθήσουμε! Επικοινωνήστε μαζί μας στο',
        },
    },
};

// =============================================================================
// BUSINESS EMAIL TRANSLATIONS
// =============================================================================

const businessEmailTranslations: {
    en: BusinessEmailTranslationsMap;
    el: BusinessEmailTranslationsMap;
} = {
    en: {
        new_booking: {
            subject: 'New Booking: {{className}}',
            preheader: '{{customerName}} booked {{className}}',
            title: 'New Booking Received!',
            body: 'Great news! You have a new booking from {{customerName}}.',
            details_title: 'Booking Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'View Dashboard',
            footer_note: 'This booking has been automatically confirmed. You can view all your bookings and manage your classes in your business dashboard.',
        },
        booking_cancelled_by_consumer: {
            subject: 'Booking Cancelled: {{className}}',
            preheader: '{{customerName}} cancelled {{className}}',
            title: 'Booking Cancelled',
            body: '{{customerName}} has cancelled their booking for {{className}}.',
            details_title: 'Cancelled Booking Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'View Dashboard',
            footer_note: "The customer's credits have been automatically refunded according to your cancellation policy. No action needed from your side.",
        },
        booking_cancelled_by_business: {
            subject: 'Booking Cancelled: {{className}}',
            preheader: 'Your booking for {{className}} has been cancelled',
            title: 'Your Booking Cancelled',
            body: 'Your booking for {{className}} has been cancelled. We apologize for any inconvenience.',
            details_title: 'Cancelled Booking Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'View Dashboard',
            footer_note: "The customer's credits have been automatically refunded. This is a confirmation of the cancellation.",
        },
        booking_awaiting_approval: {
            subject: 'Booking Request: {{className}}',
            preheader: '{{customerName}} requested to book {{className}}',
            title: 'New Booking Request',
            body: '{{customerName}} has requested to book {{className}}. Please review and approve or reject this request.',
            details_title: 'Booking Request Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'Review Request',
            footer_note: 'Please respond to this request as soon as possible. The customer is waiting for your confirmation.',
            action_required: 'Action Required',
            approve_button: 'Approve',
            reject_button: 'Reject',
        },
        booking_approved: {
            subject: 'Booking Approved: {{className}}',
            preheader: "You approved {{customerName}}'s booking for {{className}}",
            title: 'Booking Approved',
            body: 'You have approved the booking request from {{customerName}} for {{className}}.',
            details_title: 'Approved Booking Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'View Dashboard',
            footer_note: 'The customer has been notified. This is a confirmation of the approval.',
        },
        booking_rejected: {
            subject: 'Booking Rejected: {{className}}',
            preheader: "You rejected {{customerName}}'s booking for {{className}}",
            title: 'Booking Rejected',
            body: 'You have rejected the booking request from {{customerName}} for {{className}}.',
            details_title: 'Rejected Booking Details',
            customer_label: 'Customer',
            email_label: 'Email',
            class_label: 'Class',
            venue_label: 'Venue',
            time_label: 'Time',
            amount_label: 'Amount',
            cta_button: 'View Dashboard',
            footer_note: 'The customer has been notified and their credits have been refunded.',
        },
        review: {
            subject: 'New Review for {{venueName}}',
            preheader: '{{reviewerName}} left a review for {{venueName}}',
            title: 'New User Review!',
            body: '{{reviewerName}} left a new review for {{venueName}}.',
            business_label: 'Business',
            venue_label: 'Venue',
            rating_label: 'Rating',
            comment_label: 'Comment',
            cta_button: 'View in Dashboard',
        },
    },
    el: {
        new_booking: {
            subject: 'Νέα Κράτηση: {{className}}',
            preheader: 'Ο/Η {{customerName}} έκλεισε {{className}}',
            title: 'Νέα Κράτηση!',
            body: 'Υπέροχα νέα! Έχεις μια νέα κράτηση από τον/την {{customerName}}.',
            details_title: 'Λεπτομέρειες Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Δες το Dashboard',
            footer_note: 'Αυτή η κράτηση επιβεβαιώθηκε αυτόματα. Μπορείς να δεις όλες τις κρατήσεις σου και να διαχειριστείς τα μαθήματά σου στο business dashboard.',
        },
        booking_cancelled_by_consumer: {
            subject: 'Ακύρωση Κράτησης: {{className}}',
            preheader: 'Ο/Η {{customerName}} ακύρωσε {{className}}',
            title: 'Η Κράτηση Ακυρώθηκε',
            body: 'Ο/Η {{customerName}} ακύρωσε την κράτησή του/της για {{className}}.',
            details_title: 'Λεπτομέρειες Ακυρωμένης Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Δες το Dashboard',
            footer_note: 'Τα credits του πελάτη επιστράφηκαν αυτόματα σύμφωνα με την πολιτική ακύρωσής σου. Δεν απαιτείται καμία ενέργεια.',
        },
        booking_cancelled_by_business: {
            subject: 'Ακύρωση Κράτησης: {{className}}',
            preheader: 'Η κράτησή σου για {{className}} ακυρώθηκε',
            title: 'Η Κράτησή σου Ακυρώθηκε',
            body: 'Η κράτηση για {{className}} ακυρώθηκε. Ζητούμε συγγνώμη για την αναστάτωση.',
            details_title: 'Λεπτομέρειες Ακυρωμένης Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Δες το Dashboard',
            footer_note: 'Τα credits του πελάτη επιστράφηκαν αυτόματα. Αυτό είναι επιβεβαίωση της ακύρωσης.',
        },
        booking_awaiting_approval: {
            subject: 'Αίτημα Κράτησης: {{className}}',
            preheader: 'Ο/Η {{customerName}} ζήτησε να κλείσει {{className}}',
            title: 'Νέο Αίτημα Κράτησης',
            body: 'Ο/Η {{customerName}} ζήτησε να κλείσει {{className}}. Παρακαλούμε έλεγξε και έγκρινε ή απέρριψε το αίτημα.',
            details_title: 'Λεπτομέρειες Αιτήματος Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Έλεγξε το Αίτημα',
            footer_note: 'Παρακαλούμε απάντησε σε αυτό το αίτημα το συντομότερο δυνατό. Ο πελάτης περιμένει την επιβεβαίωσή σου.',
            action_required: 'Απαιτείται Ενέργεια',
            approve_button: 'Έγκριση',
            reject_button: 'Απόρριψη',
        },
        booking_approved: {
            subject: 'Κράτηση Εγκρίθηκε: {{className}}',
            preheader: 'Ενέκρινες την κράτηση του/της {{customerName}} για {{className}}',
            title: 'Η Κράτηση Εγκρίθηκε',
            body: 'Ενέκρινες το αίτημα κράτησης από τον/την {{customerName}} για {{className}}.',
            details_title: 'Λεπτομέρειες Εγκεκριμένης Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Δες το Dashboard',
            footer_note: 'Ο πελάτης έχει ειδοποιηθεί. Αυτό είναι επιβεβαίωση της έγκρισης.',
        },
        booking_rejected: {
            subject: 'Κράτηση Απορρίφθηκε: {{className}}',
            preheader: 'Απέρριψες την κράτηση του/της {{customerName}} για {{className}}',
            title: 'Η Κράτηση Απορρίφθηκε',
            body: 'Απέρριψες το αίτημα κράτησης από τον/την {{customerName}} για {{className}}.',
            details_title: 'Λεπτομέρειες Απορριφθείσας Κράτησης',
            customer_label: 'Πελάτης',
            email_label: 'Email',
            class_label: 'Μάθημα',
            venue_label: 'Χώρος',
            time_label: 'Ώρα',
            amount_label: 'Ποσό',
            cta_button: 'Δες το Dashboard',
            footer_note: 'Ο πελάτης έχει ειδοποιηθεί και τα credits του έχουν επιστραφεί.',
        },
        review: {
            subject: 'Νέα Κριτική για {{venueName}}',
            preheader: 'Ο/Η {{reviewerName}} άφησε κριτική για {{venueName}}',
            title: 'Νέα Κριτική Χρήστη!',
            body: 'Ο/Η {{reviewerName}} άφησε μια νέα κριτική για {{venueName}}.',
            business_label: 'Επιχείρηση',
            venue_label: 'Χώρος',
            rating_label: 'Βαθμολογία',
            comment_label: 'Σχόλιο',
            cta_button: 'Δες στο Dashboard',
        },
    },
};

// =============================================================================
// TYPES
// =============================================================================

type PushNotificationKey = keyof typeof pushNotificationTranslations['en'];

type ConsumerEmailKey = 'otp_sign_in' | 'otp_password_reset' | 'booking_confirmation' | 'class_cancellation' | 'credits_gift' | 'welcome' | 'credits_received';

type BusinessEmailKey = 'new_booking' | 'booking_cancelled_by_consumer' | 'booking_cancelled_by_business' | 'booking_awaiting_approval' | 'booking_approved' | 'booking_rejected' | 'review';

interface ConsumerEmailTranslationsMap {
    otp_sign_in: OTPEmailTranslations;
    otp_password_reset: OTPEmailTranslations;
    booking_confirmation: BookingConfirmationTranslations;
    class_cancellation: ClassCancellationTranslations;
    credits_gift: CreditsGiftTranslations;
    welcome: WelcomeEmailTranslations;
    credits_received: CreditsReceivedTranslations;
}

interface BusinessEmailTranslationsMap {
    new_booking: BusinessNewBookingTranslations;
    booking_cancelled_by_consumer: BusinessBookingCancelledByConsumerTranslations;
    booking_cancelled_by_business: BusinessBookingCancelledByBusinessTranslations;
    booking_awaiting_approval: BusinessBookingAwaitingApprovalTranslations;
    booking_approved: BusinessBookingApprovedTranslations;
    booking_rejected: BusinessBookingRejectedTranslations;
    review: BusinessReviewTranslations;
}

// Re-export types for consumers
export type { OTPEmailTranslations };

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

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
 * Interpolate a single text field with parameters
 */
export function interpolateText(
    text: string,
    params: Record<string, string | number>
): string {
    return interpolate(text, params);
}

// =============================================================================
// PUSH NOTIFICATION TRANSLATIONS
// =============================================================================

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

// =============================================================================
// CONSUMER EMAIL TRANSLATIONS
// =============================================================================

/**
 * Get OTP email translations in the user's language
 */
export function getOTPEmailTranslations(
    language: string | undefined | null,
    key: 'otp_sign_in' | 'otp_password_reset'
): OTPEmailTranslations {
    const lang = resolveLanguage(language);
    return consumerEmailTranslations[lang][key];
}

/**
 * Get consumer email translations in the user's language
 */
export function getConsumerEmailTranslations<K extends ConsumerEmailKey>(
    language: string | undefined | null,
    key: K
): ConsumerEmailTranslationsMap[K] {
    const lang = resolveLanguage(language);
    return consumerEmailTranslations[lang][key];
}

// Legacy function - kept for backward compatibility
/**
 * Get email content in the user's language (legacy function for credits_gift)
 * @deprecated Use getConsumerEmailTranslations instead
 */
export function getEmailTranslations(
    language: string | undefined | null,
    key: 'credits_gift'
): CreditsGiftTranslations {
    const lang = resolveLanguage(language);
    return consumerEmailTranslations[lang][key];
}

// =============================================================================
// BUSINESS EMAIL TRANSLATIONS
// =============================================================================

/**
 * Get business email translations in the specified language
 */
export function getBusinessEmailTranslations<K extends BusinessEmailKey>(
    language: string | undefined | null,
    key: K
): BusinessEmailTranslationsMap[K] {
    const lang = resolveLanguage(language);
    return businessEmailTranslations[lang][key];
}
