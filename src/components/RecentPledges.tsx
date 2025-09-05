import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Heart, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

export interface Pledge {
  id: string;
  name?: string; // Optional for backward compatibility
  display_name?: string; // Anonymized name from public view
  amount: number;
  currency: string;
  message?: string;
  timestamp: Date;
  amountInKES: number;
  amountInUSD: number;
}

interface RecentPledgesProps {
  pledges: Pledge[];
}

export function RecentPledges({ pledges }: RecentPledgesProps) {
  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Card className="shadow-xl border-primary/10">
      <CardHeader className="bg-gradient-primary text-white">
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Recent Pledges
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-96">
          <div className="p-4 space-y-3">
            {pledges.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Be the first to make a pledge!
              </p>
            ) : (
              pledges.map((pledge) => (
                <div
                  key={pledge.id}
                  className="p-4 rounded-lg bg-accent/50 border border-primary/10 animate-in slide-in-from-left duration-500"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-secondary flex items-center justify-center text-white font-bold">
                        {(pledge.display_name || pledge.name || 'A').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">{pledge.display_name || pledge.name || 'Anonymous'}</p>
                        <p className="text-sm text-muted-foreground">
                          {formatDistanceToNow(pledge.timestamp, { addSuffix: true })}
                        </p>
                        {pledge.message && (
                          <p className="mt-2 text-sm italic text-muted-foreground">
                            "{pledge.message}"
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-lg text-primary">
                        {formatAmount(pledge.amount, pledge.currency)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        ≈ {formatAmount(pledge.amountInUSD, 'USD')}
                      </p>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}