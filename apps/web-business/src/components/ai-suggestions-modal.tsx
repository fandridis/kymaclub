import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
    Lightbulb,
    TrendingUp,
    AlertTriangle,
    Sparkles,
    CheckCircle,
    AlertCircle,
} from "lucide-react";

interface AISuggestion {
    id: string;
    type: 'positive' | 'pain_point' | 'suggestion';
    title: string;
    description: string;
    confidence?: number;
}

interface AISuggestionsData {
    positives: AISuggestion[];
    painPoints: AISuggestion[];
    suggestions: AISuggestion[];
    lastAnalyzed: string;
    totalReviews: number;
}

const mockAISuggestions: AISuggestionsData = {
    positives: [
        {
            id: 'pos-1',
            type: 'positive',
            title: 'Excellent instructor adjustments',
            description: 'Members consistently praise personalized attention and form corrections',
            confidence: 92
        },
        {
            id: 'pos-2',
            type: 'positive',
            title: 'Strong community atmosphere',
            description: 'Multiple mentions of friendly, welcoming environment and member connections',
            confidence: 87
        },
        {
            id: 'pos-3',
            type: 'positive',
            title: 'Consistent class quality',
            description: 'High ratings across different class types and time slots',
            confidence: 89
        }
    ],
    painPoints: [
        {
            id: 'pain-1',
            type: 'pain_point',
            title: 'Temperature control issues',
            description: 'Several members mention rooms being too warm, especially during peak hours',
            confidence: 78
        },
        {
            id: 'pain-2',
            type: 'pain_point',
            title: 'Equipment availability',
            description: 'Occasional shortages of mats and props during busy periods',
            confidence: 71
        },
        {
            id: 'pain-3',
            type: 'pain_point',
            title: 'Parking challenges',
            description: 'Limited parking spaces mentioned by members attending evening classes',
            confidence: 65
        }
    ],
    suggestions: [
        {
            id: 'sug-1',
            type: 'suggestion',
            title: 'Install smart thermostats',
            description: 'Consider automated temperature control to maintain optimal room conditions throughout the day',
            confidence: 85
        },
        {
            id: 'sug-2',
            type: 'suggestion',
            title: 'Expand equipment inventory',
            description: 'Add 20% more mats and props to handle peak capacity and reduce wait times',
            confidence: 82
        }
    ],
    lastAnalyzed: '2 hours ago',
    totalReviews: 20
};

interface AISuggestionsModalProps {
    className?: string;
    size?: 'sm' | 'default' | 'lg';
    showIcon?: boolean;
    text?: string;
}

export function AISuggestionsModal({
    className = "",
    size = "default",
    showIcon = true,
    text = "AI Insights"
}: AISuggestionsModalProps) {
    const data = mockAISuggestions;

    const getIcon = (type: string) => {
        switch (type) {
            case 'positive':
                return <CheckCircle className="h-4 w-4 text-emerald-600" />;
            case 'pain_point':
                return <AlertCircle className="h-4 w-4 text-amber-600" />;
            case 'suggestion':
                return <Lightbulb className="h-4 w-4 text-blue-600" />;
            default:
                return <Sparkles className="h-4 w-4 text-purple-600" />;
        }
    };

    const getBadgeColor = (type: string) => {
        switch (type) {
            case 'positive':
                return 'bg-emerald-100 text-emerald-800 border-emerald-200';
            case 'pain_point':
                return 'bg-amber-100 text-amber-800 border-amber-200';
            case 'suggestion':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            default:
                return '';
        }
    };

    return (
        <Dialog>
            <DialogTrigger asChild>
                <Button
                    variant="ghost"
                    size={size === "sm" ? "sm" : size === "lg" ? "lg" : "default"}
                    className={`cursor-pointer hover:bg-purple-100 hover:border-purple-200 transition-colors focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 border border-purple-200 bg-purple-50/50 text-purple-950 ${className}`}
                    aria-label={`Open AI insights modal - ${text}`}
                >
                    {showIcon && <Sparkles className="h-3 w-3 mr-1" aria-hidden="true" />}
                    {text}
                </Button>
            </DialogTrigger>

            <DialogContent className="w-full max-w-3xl md:max-w-3xl max-h-[85vh] overflow-y-auto">
                <DialogHeader className="pb-6">
                    <div className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-purple-600" />
                        <DialogTitle className="text-xl font-semibold text-purple-950">
                            AI Insights
                        </DialogTitle>
                        <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200">
                            Beta
                        </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                        Analysis of your latest {data.totalReviews} reviews • Updated {data.lastAnalyzed}
                    </p>
                </DialogHeader>

                <div className="space-y-8 px-2" role="main" aria-label="AI insights content">
                    {/* Positive Highlights */}
                    <section className="space-y-4" aria-labelledby="positives-heading">
                        <div className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-emerald-600" aria-hidden="true" />
                            <h2 id="positives-heading" className="font-semibold text-emerald-950 text-lg">What's Working Well</h2>
                        </div>
                        <div className="grid gap-4">
                            {data.positives.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-emerald-50/50 border border-emerald-200/50">
                                    {getIcon(item.type)}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-base text-emerald-950">{item.title}</p>
                                            {item.confidence && (
                                                <Badge variant="outline" className={`text-xs ${getBadgeColor(item.type)}`}>
                                                    {item.confidence}% confidence
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-emerald-700 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Pain Points */}
                    <section className="space-y-4" aria-labelledby="pain-points-heading">
                        <div className="flex items-center gap-2">
                            <AlertTriangle className="h-5 w-5 text-amber-600" aria-hidden="true" />
                            <h2 id="pain-points-heading" className="font-semibold text-amber-950 text-lg">Areas for Improvement</h2>
                        </div>
                        <div className="grid gap-4">
                            {data.painPoints.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-amber-50/50 border border-amber-200/50">
                                    {getIcon(item.type)}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-base text-amber-950">{item.title}</p>
                                            {item.confidence && (
                                                <Badge variant="outline" className={`text-xs ${getBadgeColor(item.type)}`}>
                                                    {item.confidence}% confidence
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-amber-700 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    <Separator />

                    {/* Suggestions */}
                    <section className="space-y-4" aria-labelledby="suggestions-heading">
                        <div className="flex items-center gap-2">
                            <Lightbulb className="h-5 w-5 text-blue-600" aria-hidden="true" />
                            <h2 id="suggestions-heading" className="font-semibold text-blue-950 text-lg">Recommended Actions</h2>
                        </div>
                        <div className="grid gap-4">
                            {data.suggestions.map((item) => (
                                <div key={item.id} className="flex items-start gap-4 p-4 rounded-lg bg-blue-50/50 border border-blue-200/50">
                                    {getIcon(item.type)}
                                    <div className="flex-1 space-y-2">
                                        <div className="flex items-center gap-2">
                                            <p className="font-medium text-base text-blue-950">{item.title}</p>
                                            {item.confidence && (
                                                <Badge variant="outline" className={`text-xs ${getBadgeColor(item.type)}`}>
                                                    {item.confidence}% confidence
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-sm text-blue-700 leading-relaxed">{item.description}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </section>

                    {/* Footer note */}
                    <footer className="pt-6 border-t border-purple-200/50">
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                            💡 These insights are generated by AI analysis of your recent reviews.
                            <span className="font-medium"> Consider implementing suggested improvements to enhance member experience.</span>
                        </p>
                    </footer>
                </div>
            </DialogContent>
        </Dialog>
    );
}