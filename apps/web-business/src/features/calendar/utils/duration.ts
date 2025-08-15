export const getDurationOptions = () => {
    const durationOptions: { value: string; label: string }[] = [];

    for (let i = 15; i <= 180; i += 15) {
        durationOptions.push({ value: i.toString(), label: `${i} minutes` });
    }
    return durationOptions;
}