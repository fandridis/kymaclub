import React from "react";

export const useCurrentTime = () => {
    const [currentTime, setCurrentTime] = React.useState(() => new Date());

    React.useEffect(() => {
        const interval = setInterval(() => {
            setCurrentTime(new Date());
        }, 120000); // 120 seconds

        return () => clearInterval(interval);
    }, []);

    return currentTime;
};