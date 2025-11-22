import { useState, useEffect } from 'react';
import { Id } from '@repo/api/convex/_generated/dataModel';

export interface MockConsumerDetail {
    user: {
        _id: string;
        name: string;
        email: string;
        phone?: string;
        credits?: number;
        hasConsumerOnboarded?: boolean;
    };
    metrics: {
        bookingsThisMonth: number;
        cancelledBookings: number;
        noShows: number;
    };
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
    transactions?: Array<{
        _id: string;
        type: "purchase" | "gift" | "spend" | "refund";
        amount: number;
        createdAt: number;
        description: string;
        status: "completed" | "pending" | "failed";
    }>;
}

const generateMockConsumerData = (userId: string): MockConsumerDetail => {
    const user = {
        _id: userId,
        name: "Bob Consumer",
        email: "bob@consumer.com",
        phone: "+1234567890",
        credits: Math.floor(Math.random() * 500) + 50,
        hasConsumerOnboarded: true,
    };

    const metrics = {
        bookingsThisMonth: 8,
        cancelledBookings: 2,
        noShows: 1,
    };

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
        };
    });

    const transactions = Array.from({ length: 12 }, (_, i) => {
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
    });

    return {
        user,
        metrics,
        bookings,
        transactions,
    };
};

export const useConsumerDetail = (userId: string) => {
    const [data, setData] = useState<MockConsumerDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        setIsLoading(true);
        // Simulate API call
        setTimeout(() => {
            setData(generateMockConsumerData(userId));
            setIsLoading(false);
        }, 500);
    }, [userId]);

    return { data, isLoading };
};

