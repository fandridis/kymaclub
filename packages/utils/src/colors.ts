export const TEMPLATE_COLORS = {
    Green: "green",
    Yellow: "yellow",
    Red: "red",
    Blue: "blue",
    Purple: "purple",
    Orange: "orange",
    Pink: "pink",
} as const;

export const TEMPLATE_COLORS_ARRAY = Object.values(TEMPLATE_COLORS);

export type TemplateColorType = (typeof TEMPLATE_COLORS)[keyof typeof TEMPLATE_COLORS];
