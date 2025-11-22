import { useState, useEffect } from 'react';
import { Id } from '@repo/api/convex/_generated/dataModel';

export interface MockBusinessDetail {
    business: {
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
    owner: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        businessRole?: "owner" | "admin" | "user";
    };
    metrics: {
        totalScheduledClasses: number;
        completedClassesThisMonth: number;
        cancelledClassesThisMonth: number;
        completedBookingsThisMonth: number;
        earningsThisMonth: number; // in cents
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
        userSnapshot?: {
            name?: string;
            email?: string;
        };
    }>;
    earnings?: Array<{
        _id: string;
        amount: number; // in cents
        createdAt: number;
        description: string;
        bookingId?: string;
    }>;
}

const generateMockBusinessData = (businessId: string): MockBusinessDetail => {
    const business = {
        _id: businessId,
        name: "Yoga Studio Pro",
        email: "info@yogastudio.com",
        phone: "+1234567891",
        address: {
            street: "123 Main St",
            city: "San Francisco",
            zipCode: "94102",
            country: "USA",
        },
    };

    const owner = {
        _id: `user_${businessId}`,
        name: "Jane Business Owner",
        email: "jane@business.com",
        phone: "+1234567890",
        businessRole: "owner" as const,
    };

    const metrics = {
        totalScheduledClasses: 245,
        completedClassesThisMonth: 42,
        cancelledClassesThisMonth: 3,
        completedBookingsThisMonth: 128,
        earningsThisMonth: 12800 * 100, // €12,800 in cents
    };

    const venues = Array.from({ length: 5 }, (_, i) => ({
        _id: `venue_${i}` as Id<"venues">,
        name: `Venue ${i + 1}`,
        address: {
            city: ["San Francisco", "Oakland", "Berkeley"][i % 3],
            street: `${100 + i * 10} Street`,
        },
        isActive: i < 4,
    }));

    const classTemplates = Array.from({ length: 8 }, (_, i) => ({
        _id: `template_${i}` as Id<"classTemplates">,
        name: ["Vinyasa Flow", "Hot Yoga", "Yin Yoga", "Power Yoga", "Meditation", "Pilates", "Stretching", "Core Strength"][i],
        duration: [60, 75, 90, 60, 45, 60, 30, 45][i],
        capacity: [20, 15, 25, 20, 30, 20, 40, 25][i],
        price: ([2000, 2500, 1800, 2200, 1500, 2000, 1200, 2000][i]) * 100, // in cents
        isActive: i < 7,
    }));

    const classInstances = Array.from({ length: 12 }, (_, i) => {
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
    });

    const bookings = Array.from({ length: 15 }, (_, i) => {
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
            userSnapshot: {
                name: `User ${i + 1}`,
                email: `user${i + 1}@example.com`,
            },
        };
    });

    const earnings = Array.from({ length: 10 }, (_, i) => {
        const now = Date.now();
        return {
            _id: `earning_${i}` as Id<"creditTransactions">,
            amount: (Math.floor(Math.random() * 500) + 100) * 100, // €100-600 in cents
            createdAt: now - (i * 3 * 24 * 60 * 60 * 1000),
            description: `Earning from booking ${i + 1}`,
            bookingId: `booking_${i}` as Id<"bookings">,
        };
    });

    return {
        business,
        owner,
        metrics,
        venues,
        classTemplates,
        classInstances,
        bookings,
        earnings,
    };
};

export const useBusinessDetail = (businessId: string) => {
    const [data, setData] = useState<MockBusinessDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setData(generateMockBusinessData(businessId));
            setIsLoading(false);
        }, 500);
    }, [businessId]);

    return { data, isLoading };
};

