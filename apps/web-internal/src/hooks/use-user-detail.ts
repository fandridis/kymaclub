import { useState, useEffect } from 'react';
import { Id } from '@repo/api/convex/_generated/dataModel';

export interface MockUserDetail {
    user: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        businessId?: Id<"businesses">;
        businessRole?: "owner" | "admin" | "user";
        credits?: number;
        hasBusinessOnboarded?: boolean;
        hasConsumerOnboarded?: boolean;
    };
    business?: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        address?: {
            street: string;
            city: string;
            zipCode: string;
            country: string;
        };
    };
    businessMetrics?: {
        totalScheduledClasses: number;
        completedClassesThisMonth: number;
        cancelledClassesThisMonth: number;
        completedBookingsThisMonth: number;
        earningsThisMonth: number; // in cents
    };
    consumerMetrics?: {
        bookingsThisMonth: number;
        cancelledBookings: number;
        noShows: number;
    };
    venues?: Array<{
        _id: string;
        name: string;
        address: {
            city: string;
            street: string;
        };
        isActive: boolean;
    }>;
    classTemplates?: Array<{
        _id: string;
        name: string;
        duration: number;
        capacity: number;
        price: number;
        isActive: boolean;
    }>;
    classInstances?: Array<{
        _id: string;
        name: string;
        startTime: number;
        endTime: number;
        status: "scheduled" | "cancelled" | "completed";
        bookedCount: number;
        capacity: number;
        price: number;
    }>;
    bookings?: Array<{
        _id: string;
        status: "pending" | "completed" | "cancelled_by_consumer" | "cancelled_by_business" | "no_show";
        bookedAt: number;
        finalPrice: number;
        classInstanceSnapshot?: {
            name: string;
            startTime: number;
            endTime?: number;
        };
        venueSnapshot?: {
            name: string;
        };
    }>;
    earnings?: Array<{
        _id: string;
        amount: number; // in cents
        createdAt: number;
        description: string;
        bookingId?: string;
    }>;
    transactions?: Array<{
        _id: string;
        type: "purchase" | "gift" | "spend" | "refund";
        amount: number;
        createdAt: number;
        description: string;
        status: "completed" | "pending" | "failed";
    }>;
}

const generateMockData = (userId: string): MockUserDetail => {
    const isBusiness = Math.random() > 0.3; // 70% chance of being a business
    const isConsumer = Math.random() > 0.2; // 80% chance of being a consumer
    const isBoth = isBusiness && isConsumer;

    const user: MockUserDetail['user'] = {
        _id: userId,
        name: isBoth ? "John Business Consumer" : isBusiness ? "Jane Business Owner" : "Bob Consumer",
        email: isBoth ? "john@example.com" : isBusiness ? "jane@business.com" : "bob@consumer.com",
        phone: "+1234567890",
        businessId: isBusiness ? `business_${userId}` as Id<"businesses"> : undefined,
        businessRole: isBusiness ? (Math.random() > 0.5 ? "owner" : "admin") : undefined,
        credits: isConsumer ? Math.floor(Math.random() * 500) + 50 : undefined,
        hasBusinessOnboarded: isBusiness,
        hasConsumerOnboarded: isConsumer,
    };

    const business = isBusiness ? {
        _id: `business_${userId}` as Id<"businesses">,
        name: "Yoga Studio Pro",
        email: "info@yogastudio.com",
        phone: "+1234567891",
        address: {
            street: "123 Main St",
            city: "San Francisco",
            zipCode: "94102",
            country: "USA",
        },
    } : undefined;

    const businessMetrics = isBusiness ? {
        totalScheduledClasses: 245,
        completedClassesThisMonth: 42,
        cancelledClassesThisMonth: 3,
        completedBookingsThisMonth: 128,
        earningsThisMonth: 12800 * 100, // €12,800 in cents
    } : undefined;

    const consumerMetrics = isConsumer ? {
        bookingsThisMonth: 8,
        cancelledBookings: 2,
        noShows: 1,
    } : undefined;

    const venues = isBusiness ? Array.from({ length: 5 }, (_, i) => ({
        _id: `venue_${i}` as Id<"venues">,
        name: `Venue ${i + 1}`,
        address: {
            city: ["San Francisco", "Oakland", "Berkeley"][i % 3],
            street: `${100 + i * 10} Street`,
        },
        isActive: i < 4,
    })) : undefined;

    const classTemplates = isBusiness ? Array.from({ length: 8 }, (_, i) => ({
        _id: `template_${i}` as Id<"classTemplates">,
        name: ["Vinyasa Flow", "Hot Yoga", "Yin Yoga", "Power Yoga", "Meditation", "Pilates", "Stretching", "Core Strength"][i],
        duration: [60, 75, 90, 60, 45, 60, 30, 45][i],
        capacity: [20, 15, 25, 20, 30, 20, 40, 25][i],
        price: ([2000, 2500, 1800, 2200, 1500, 2000, 1200, 2000][i]) * 100, // in cents
        isActive: i < 7,
    })) : undefined;

    const classInstances = isBusiness ? Array.from({ length: 12 }, (_, i) => {
        const now = Date.now();
        const startTime = now + (i * 24 * 60 * 60 * 1000); // spread over 12 days
        const duration = [60, 75, 90, 60][i % 4] * 60 * 1000;
        const statuses: Array<"scheduled" | "cancelled" | "completed"> = ["scheduled", "scheduled", "completed", "cancelled"];
        return {
            _id: `instance_${i}` as Id<"classInstances">,
            name: `Class Instance ${i + 1}`,
            startTime,
            endTime: startTime + duration,
            status: statuses[i % 4],
            bookedCount: Math.floor(Math.random() * 20) + 5,
            capacity: 20,
            price: 2000 * 100, // €20 in cents
        };
    }) : undefined;

    const bookings = (isBusiness || isConsumer) ? Array.from({ length: 15 }, (_, i) => {
        const now = Date.now();
        const bookedAt = now - (i * 2 * 24 * 60 * 60 * 1000); // spread over 30 days
        const startTime = bookedAt + (Math.random() * 7 * 24 * 60 * 60 * 1000);
        const statuses: Array<"pending" | "completed" | "cancelled_by_consumer" | "cancelled_by_business" | "no_show"> =
            ["completed", "completed", "pending", "cancelled_by_consumer", "no_show"];
        return {
            _id: `booking_${i}` as Id<"bookings">,
            status: statuses[i % 5],
            bookedAt,
            finalPrice: (Math.floor(Math.random() * 30) + 15) * 100, // €15-45 in cents
            classInstanceSnapshot: {
                name: `Class ${i + 1}`,
                startTime,
                endTime: startTime + 60 * 60 * 1000,
            },
            venueSnapshot: {
                name: `Venue ${(i % 5) + 1}`,
            },
        };
    }) : undefined;

    const earnings = isBusiness ? Array.from({ length: 10 }, (_, i) => {
        const now = Date.now();
        return {
            _id: `earning_${i}` as Id<"creditTransactions">,
            amount: (Math.floor(Math.random() * 500) + 100) * 100, // €100-600 in cents
            createdAt: now - (i * 3 * 24 * 60 * 60 * 1000),
            description: `Earning from booking ${i + 1}`,
            bookingId: `booking_${i}` as Id<"bookings">,
        };
    }) : undefined;

    const transactions = isConsumer ? Array.from({ length: 12 }, (_, i) => {
        const now = Date.now();
        const types: Array<"purchase" | "gift" | "spend" | "refund"> = ["purchase", "spend", "spend", "refund", "gift"];
        return {
            _id: `transaction_${i}` as Id<"creditTransactions">,
            type: types[i % 5],
            amount: types[i % 5] === "spend" ? -(Math.floor(Math.random() * 30) + 15) * 100 : (Math.floor(Math.random() * 100) + 20) * 100,
            createdAt: now - (i * 2 * 24 * 60 * 60 * 1000),
            description: types[i % 5] === "purchase" ? "Credit purchase" : types[i % 5] === "spend" ? "Class booking" : types[i % 5] === "refund" ? "Cancellation refund" : "Welcome bonus",
            status: "completed" as const,
        };
    }) : undefined;

    return {
        user,
        business,
        businessMetrics,
        consumerMetrics,
        venues,
        classTemplates,
        classInstances,
        bookings,
        earnings,
        transactions,
    };
};

export const useUserDetail = (userId: string) => {
    const [data, setData] = useState<MockUserDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setData(generateMockData(userId));
            setIsLoading(false);
        }, 500);
    }, [userId]);

    return { data, isLoading };
};

