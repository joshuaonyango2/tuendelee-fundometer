import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { HeroSection } from "@/components/HeroSection";
import { HomeHelpDialog } from "@/components/HomeHelpDialog";
import { Shield, Users, Lock, CreditCard, Database, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Hero Section */}
      <HeroSection />
      
      {/* Help Button */}
      <HomeHelpDialog />

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-16">
        <div className="text-center mb-8">
          <h2 className="text-2xl md:text-3xl font-bold mb-3">
            Empowering Bright Minds Through Education
          </h2>
          <p className="text-base text-muted-foreground max-w-2xl mx-auto">
            Support deserving students with scholarships. Every contribution transforms lives and builds a brighter future for Kenya.
          </p>
        </div>

        {/* Primary CTA - Join Event */}
        <div className="flex justify-center mb-16">
          <div className="bg-gradient-primary text-white rounded-2xl p-6 max-w-2xl w-full shadow-2xl">
            <h3 className="text-xl font-bold mb-3 text-center">Ready to Make a Difference?</h3>
            <div className="flex justify-center">
              <Button 
                size="lg" 
                onClick={() => navigate("/join")}
                className="bg-white text-primary hover:bg-white/90 font-bold text-base py-6 px-8 shadow-lg"
              >
                <Users className="w-5 h-5 mr-2" />
                Sign Up to Pledge & Track Progress
              </Button>
            </div>
          </div>
        </div>

        {/* Security & Data Protection Section */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <Shield className="w-12 h-12 text-success mx-auto mb-4" />
            <h3 className="text-2xl md:text-3xl font-bold mb-3">
              Your Security is Our Priority
            </h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              We understand the importance of protecting your personal and financial information. 
              Your trust matters to us.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Lock className="w-8 h-8 text-success mb-2" />
                <CardTitle>Encrypted Data Transfer</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your personal information is protected using SSL/TLS encryption during transmission, 
                  the same technology used by secure websites worldwide
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CreditCard className="w-8 h-8 text-success mb-2" />
                <CardTitle>Secure Payment Processing</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We never store your credit card details. All payments are processed through 
                  trusted providers like M-Pesa, PayPal, and secure bank transfers
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Database className="w-8 h-8 text-success mb-2" />
                <CardTitle>Protected Data Storage</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Your information is stored in secure, encrypted databases with restricted access 
                  and regular security audits
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Shield className="w-8 h-8 text-success mb-2" />
                <CardTitle>Privacy Guaranteed</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  We will never share, sell, or distribute your personal information to third parties. 
                  Your data is used solely for event participation and donation processing
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <CheckCircle className="w-8 h-8 text-success mb-2" />
                <CardTitle>Verified & Trusted</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Our platform is built with security best practices and regularly audited 
                  to ensure the highest standards of data protection and reliability
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="border-success/30 bg-success/5">
              <CardHeader>
                <Users className="w-8 h-8 text-success mb-2" />
                <CardTitle>Transparent Tracking</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  See real-time updates of contributions with full transparency. 
                  Track how your donation helps us reach our scholarship goals
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* How It Works Section */}
        <div className="mb-12">
          <h3 className="text-2xl md:text-3xl font-bold text-center mb-8">
            How It Works
          </h3>
          <div className="grid md:grid-cols-2 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">1</span>
              </div>
              <h4 className="font-bold mb-2">Join Instantly</h4>
              <p className="text-sm text-muted-foreground">
                Click "Join Event Now" and you're in. Simple as that. No complicated forms or long sign-ups.
              </p>
            </div>
            <div className="text-center">
              <div className="bg-primary/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-primary">2</span>
              </div>
              <h4 className="font-bold mb-2">Make Your Contribution</h4>
              <p className="text-sm text-muted-foreground">
                Choose to pay now for immediate impact or pledge to pay later. Pick your preferred payment method - it's flexible and secure.
              </p>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center">
          <p className="text-xl mb-6 font-medium">
            It takes just moments to make a lasting impact
          </p>
          <Button 
            size="lg" 
            onClick={() => navigate("/join")}
            className="bg-gradient-primary hover:opacity-90 text-white font-bold text-lg py-6 px-10"
          >
            <Users className="w-5 h-5 mr-2" />
            Start Making a Difference
          </Button>
          <p className="text-sm text-muted-foreground mt-4">
            Together, we empower deserving students to achieve their educational dreams
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;