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
          Recent Donations
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[500px]">
          <div className="divide-y divide-border">
            {pledges.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Be the first to make a pledge!
              </p>
            ) : (
              <>
                {pledges.map((pledge, index) => (
                  <div
                    key={pledge.id}
                    className="p-4 hover:bg-accent/50 transition-colors"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold text-foreground">
                          {pledge.display_name || pledge.name || 'Anonymous'}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(pledge.timestamp, { addSuffix: true })}
                        </p>
                      </div>
                      
                      {pledge.message && (
                        <p className="text-sm text-muted-foreground italic">
                          {pledge.message}
                        </p>
                      )}
                      
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="font-bold text-lg text-primary">
                            {formatAmount(pledge.amount, pledge.currency)}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">
                            ≈ {formatAmount(pledge.amountInKES, 'KES')}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {pledges.length > 5 && (
                  <div className="p-4 text-center bg-muted/30">
                    <p className="text-sm text-muted-foreground">
                      Scroll to see all {pledges.length} donations
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}