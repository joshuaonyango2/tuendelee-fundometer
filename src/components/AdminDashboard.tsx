import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { Download, Settings, TrendingUp, Users, DollarSign, RefreshCw } from "lucide-react";
import { Pledge } from "./RecentPledges";
import { format } from "date-fns";

interface AdminDashboardProps {
  goalAmount: number;
  onUpdateGoal: (newGoal: number) => void;
  pledges: Pledge[];
  onReset: () => void;
  onExport: () => void;
}

export function AdminDashboard({
  goalAmount,
  onUpdateGoal,
  pledges,
  onReset,
  onExport,
}: AdminDashboardProps) {
  const [newGoal, setNewGoal] = useState(goalAmount);
  const [isUpdating, setIsUpdating] = useState(false);

  const totalRaisedKES = pledges.reduce((sum, p) => sum + p.amountInKES, 0);
  const totalRaisedUSD = pledges.reduce((sum, p) => sum + p.amountInUSD, 0);
  const averageDonation = pledges.length > 0 ? totalRaisedUSD / pledges.length : 0;

  const handleUpdateGoal = async () => {
    if (newGoal <= 0) {
      toast.error("Goal amount must be greater than 0");
      return;
    }

    setIsUpdating(true);
    try {
      await onUpdateGoal(newGoal);
      toast.success("Goal updated successfully!");
    } catch (error) {
      toast.error("Failed to update goal");
    } finally {
      setIsUpdating(false);
    }
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to reset all pledges? This action cannot be undone.")) {
      onReset();
      toast.success("Campaign reset successfully");
    }
  };

  const formatAmount = (amount: number, currency: string) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      <Card className="shadow-xl border-primary/10">
        <CardHeader className="bg-gradient-primary text-white">
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Admin Dashboard
          </CardTitle>
          <CardDescription className="text-primary-foreground/90">
            Manage your fundraising campaign
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="pledges">Pledges</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-4">
              <div className="grid gap-4 md:grid-cols-3">
                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Raised (USD)</CardTitle>
                    <DollarSign className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{formatAmount(totalRaisedUSD, 'USD')}</div>
                    <p className="text-xs text-muted-foreground">
                      {formatAmount(totalRaisedKES, 'KES')} in KES
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total Pledges</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{pledges.length}</div>
                    <p className="text-xs text-muted-foreground">
                      Avg: {formatAmount(averageDonation, 'USD')}
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Progress</CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {((totalRaisedUSD / goalAmount) * 100).toFixed(1)}%
                    </div>
                    <p className="text-xs text-muted-foreground">
                      of {formatAmount(goalAmount, 'USD')} goal
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="pledges">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-lg font-semibold">All Pledges</h3>
                  <Button onClick={onExport} size="sm" className="gap-2">
                    <Download className="w-4 h-4" />
                    Export CSV
                  </Button>
                </div>
                
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Email</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>USD Value</TableHead>
                        <TableHead>Message</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {pledges.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={6} className="text-center text-muted-foreground">
                            No pledges yet
                          </TableCell>
                        </TableRow>
                      ) : (
                        pledges.map((pledge) => (
                          <TableRow key={pledge.id}>
                            <TableCell>
                              {format(pledge.timestamp, 'MMM dd, HH:mm')}
                            </TableCell>
                            <TableCell className="font-medium">{pledge.name}</TableCell>
                            <TableCell className="text-muted-foreground">
                              {pledge.name}@example.com
                            </TableCell>
                            <TableCell>
                              {formatAmount(pledge.amount, pledge.currency)}
                            </TableCell>
                            <TableCell>
                              {formatAmount(pledge.amountInUSD, 'USD')}
                            </TableCell>
                            <TableCell className="max-w-xs truncate">
                              {pledge.message || '-'}
                            </TableCell>
                          </TableRow>
                        ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4">
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="goal">Fundraising Goal (USD)</Label>
                  <div className="flex gap-2">
                    <Input
                      id="goal"
                      type="number"
                      min="100"
                      value={newGoal}
                      onChange={(e) => setNewGoal(parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <Button 
                      onClick={handleUpdateGoal}
                      disabled={isUpdating}
                    >
                      {isUpdating ? "Updating..." : "Update Goal"}
                    </Button>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <h3 className="text-lg font-semibold mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    These actions are irreversible. Please be certain.
                  </p>
                  <Button
                    onClick={handleReset}
                    variant="destructive"
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Reset Campaign
                  </Button>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}