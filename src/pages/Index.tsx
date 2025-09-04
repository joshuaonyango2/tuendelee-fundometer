import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSection } from "@/components/HeroSection";
import { Shield, Users, Calendar, Gift } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <HeroSection />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Virtual Fundraising Platform
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Host secure, passcode-protected fundraising events where participants can contribute in real-time
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-6 mb-12">
          <Card>
            <CardHeader>
              <Calendar className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Schedule Events</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Admins can schedule fundraising events with specific dates, times, and goals
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Shield className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Secure Access</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Each event has a unique passcode for participants to join securely
              </CardDescription>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Gift className="w-8 h-8 text-primary mb-2" />
              <CardTitle>Real-time Tracking</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Watch contributions come in live with automatic currency conversion
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="flex justify-center gap-4">
          <Button size="lg" onClick={() => navigate("/admin/auth")}>
            <Shield className="w-5 h-5 mr-2" />
            Admin Portal
          </Button>
          <Button size="lg" variant="outline" onClick={() => {
            const link = prompt("Enter your event link:");
            if (link) {
              const match = link.match(/\/join\/([^\/]+)/);
              if (match) {
                navigate(`/join/${match[1]}`);
              } else {
                alert("Invalid event link format");
              }
            }
          }}>
            <Users className="w-5 h-5 mr-2" />
            Join Event
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;