import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import { Lock, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export default function AdminAuth() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("joshuaonyango372@gmail.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showResetInfo, setShowResetInfo] = useState(false);
  const [isFirstTimeSetup, setIsFirstTimeSetup] = useState(false);
  
  const DEFAULT_ADMIN_EMAIL = "joshuaonyango372@gmail.com";
  const DEFAULT_ADMIN_PASSWORD = "TuendeleeAdmin2025!";

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    try {
      // First, try to sign in
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        // Check if this is the first time setup with default credentials
        if (email === DEFAULT_ADMIN_EMAIL && password === DEFAULT_ADMIN_PASSWORD && signInError.message.includes("Invalid login credentials")) {
          // Create the admin account with default password
          const { error: signUpError } = await supabase.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: `${window.location.origin}/admin/dashboard`,
              data: {
                full_name: 'Tuendelee Foundation Admin'
              }
            }
          });

          if (signUpError) throw signUpError;
          
          // Now sign in with the newly created account
          const { error: newSignInError } = await supabase.auth.signInWithPassword({
            email,
            password,
          });
          
          if (newSignInError) throw newSignInError;
          
          setIsFirstTimeSetup(true);
          toast.success("Admin account created successfully! Redirecting to dashboard...");
          
          // Store flag for first-time setup
          localStorage.setItem("showPasswordChangePrompt", "true");
          navigate("/admin/dashboard");
        } else {
          throw signInError;
        }
      } else {
        toast.success("Welcome to Tuendelee Foundation Admin Portal!");
        navigate("/admin/dashboard");
      }
    } catch (err: any) {
      setError(err.message || "An error occurred");
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordReset = async () => {
    if (!email) {
      setError("Please enter your email address");
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/admin/reset-password`,
      });

      if (error) throw error;
      toast.success("Password reset link sent to your email!");
    } catch (err: any) {
      setError(err.message || "Failed to send reset email");
      toast.error(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-primary/10 rounded-full">
              <Lock className="w-8 h-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">Tuendelee Foundation</CardTitle>
          <CardDescription>
            Sign in to manage fundraising events
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          {showResetInfo && (
            <Alert className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Password reset link will be sent to the admin email address.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Admin Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter admin email"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={isLoading}
                placeholder="Enter your password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>
          </form>

          <div className="mt-4">
            <Button
              variant="outline"
              className="w-full"
              onClick={handlePasswordReset}
              disabled={isLoading}
            >
              Forgot Password?
            </Button>
          </div>
          
          <div className="mt-4 p-3 bg-muted/50 rounded-lg">
            <p className="text-xs text-muted-foreground text-center">
              Default credentials: <br />
              Email: joshuaonyango372@gmail.com<br />
              Password: TuendeleeAdmin2025!<br />
              <span className="font-medium">Please change email and password after first login</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}