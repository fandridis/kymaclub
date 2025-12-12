import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { History, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";

interface FeeChangeLog {
  _id: string;
  adminEmail: string;
  previousValue?: string;
  newValue: string;
  reason: string;
  createdAt: number;
}

interface FeeChangeHistoryProps {
  logs: FeeChangeLog[];
}

/**
 * Parse fee rate from JSON string
 * Returns percentage as string (e.g., "20%")
 */
function parseFeeRate(jsonString: string | undefined): string {
  if (!jsonString) return "N/A";
  try {
    const parsed = JSON.parse(jsonString);
    const rate = parsed.baseFeeRate ?? 0;
    return `${Math.round(rate * 100)}%`;
  } catch {
    return "N/A";
  }
}

export function FeeChangeHistory({ logs }: FeeChangeHistoryProps) {
  if (!logs || logs.length === 0) {
    return (
      <Card className="bg-slate-800/30 border-slate-700/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-slate-100 flex items-center text-base">
            <History className="mr-2 h-4 w-4 text-cyan-500" />
            Fee Rate History
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <History className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400 text-sm">No fee rate changes recorded</p>
            <p className="text-slate-500 text-xs mt-1">
              Changes will appear here after updating the fee rate
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-slate-800/30 border-slate-700/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-slate-100 flex items-center text-base">
          <History className="mr-2 h-4 w-4 text-cyan-500" />
          Fee Rate History
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {logs.map((log) => {
            const previousRate = parseFeeRate(log.previousValue);
            const newRate = parseFeeRate(log.newValue);
            const date = new Date(log.createdAt);

            return (
              <div
                key={log._id}
                className="p-3 bg-slate-900/50 rounded-lg border border-slate-700/50"
              >
                {/* Header: Date and Admin */}
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs text-slate-400">
                    {format(date, "MMM dd, yyyy 'at' HH:mm")}
                  </span>
                  <div className="flex items-center gap-1 text-xs text-slate-500">
                    <User className="h-3 w-3" />
                    <span className="truncate max-w-[150px]">{log.adminEmail}</span>
                  </div>
                </div>

                {/* Rate Change */}
                <div className="flex items-center gap-2 mb-2">
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-mono",
                      previousRate === "0%"
                        ? "text-amber-400 border-amber-500/50"
                        : "text-slate-400 border-slate-600"
                    )}
                  >
                    {previousRate}
                  </Badge>
                  <ArrowRight className="h-3 w-3 text-slate-500" />
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs font-mono",
                      newRate === "0%"
                        ? "text-amber-400 border-amber-500/50"
                        : "text-cyan-400 border-cyan-500/50"
                    )}
                  >
                    {newRate}
                  </Badge>
                </div>

                {/* Reason */}
                <div className="text-sm text-slate-300 bg-slate-800/50 rounded px-2 py-1.5 border-l-2 border-cyan-500/30">
                  {log.reason}
                </div>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
