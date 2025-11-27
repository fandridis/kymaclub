export interface DurationOption {
    value: string;
    label: string;
}

const formatDurationLabel = (minutes: number, t: (key: any, options?: any) => string): string => {
    if (minutes < 60) {
        return t('common.minutes', { count: minutes });
    }

    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;

    if (remainingMinutes === 0) {
        return hours === 1
            ? t('common.hour', { count: hours })
            : t('common.hours', { count: hours });
    }

    const hoursText = hours === 1
        ? t('common.hour', { count: hours })
        : t('common.hours', { count: hours });
    const minutesText = t('common.minutes', { count: remainingMinutes });
    return t('common.hourMinutes', { hours: hoursText, minutes: minutesText });
};

export const getDurationOptions = (t: (key: any, options?: any) => string): DurationOption[] => {
    const durationOptions: DurationOption[] = [];

    // From 15 minutes to 2 hours (120 minutes): per 15 minutes
    for (let i = 15; i <= 120; i += 15) {
        durationOptions.push({
            value: i.toString(),
            label: formatDurationLabel(i, t)
        });
    }

    // From 2 hours (120 minutes) to 6 hours (360 minutes): per 30 minutes
    for (let i = 150; i <= 360; i += 30) {
        durationOptions.push({
            value: i.toString(),
            label: formatDurationLabel(i, t)
        });
    }

    return durationOptions;
}