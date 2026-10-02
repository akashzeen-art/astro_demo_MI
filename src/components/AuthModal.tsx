import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Sparkles,
  Loader2,
  Star,
} from "lucide-react";
import { apiService } from "@/lib/apiService";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultTab?: "login" | "signup";
}

const AuthModal = ({
  isOpen,
  onClose,
  defaultTab = "login",
}: AuthModalProps) => {
  const [activeTab, setActiveTab] = useState<"login" | "signup">(defaultTab);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const { login } = useAuth();

  const [loginForm, setLoginForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  });

  const [signupForm, setSignupForm] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    agreeToTerms: false,
    subscribeNewsletter: true,
  });

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsLoading(true);

    try {
      const success = await login(loginForm.email, loginForm.password);
      if (success) {
        onClose();
        // Reset form
        setLoginForm({ email: "", password: "", rememberMe: false });
      } else {
        // Handle login error
        console.error("Login failed");
        setErrorMessage("Invalid email or password. Please try again.");
      }
    } catch (error) {
      console.error("Login error:", error);
      if (error instanceof Error) {
        setErrorMessage(error.message || "Login failed. Please try again.");
      } else {
        setErrorMessage("Login failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Client-side validation
    if (signupForm.password !== signupForm.confirmPassword) {
      setErrorMessage("Passwords do not match. Please re-check them.");
      return;
    }
    
    if (signupForm.password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }
    
    if (!signupForm.agreeToTerms) {
      setErrorMessage("You must accept the Terms of Service and Privacy Policy to create an account.");
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);

    try {
      // Call real signup API
      const { user } = await apiService.signup({
        full_name: signupForm.name,
        email: signupForm.email,
        password: signupForm.password,
        confirm_password: signupForm.confirmPassword,
        accepted_terms: signupForm.agreeToTerms,
        subscribe_newsletter: signupForm.subscribeNewsletter,
      });

      // Also set auth context state by logging in (using same credentials)
      const success = await login(signupForm.email, signupForm.password);
      if (success) {
        console.log("Signup + login successful for", user.email);
        onClose();
        // Reset form after success
        setSignupForm({
          name: "",
          email: "",
          password: "",
          confirmPassword: "",
          agreeToTerms: false,
          subscribeNewsletter: true,
        });
        setErrorMessage(null);
      } else {
        setErrorMessage("Signup succeeded, but automatic login failed. Please try signing in.");
      }
    } catch (error) {
      console.error("Signup error:", error);
      if (error instanceof Error) {
        // Show the actual error message from backend
        const errorMsg = error.message || "Signup failed. Please check your details.";
        setErrorMessage(errorMsg);
      } else {
        setErrorMessage("Signup failed. Please check your details.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setIsLoading(true);
    setErrorMessage(null);
    // Simulate Google OAuth
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const success = await login("demo@palmastro.com", "demo_password");
    if (success) {
      onClose();
    }
    setIsLoading(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="w-[95vw] sm:w-full sm:max-w-md glass-card border-cosmic/30 p-4 sm:p-6 max-h-[95vh] overflow-y-auto">
        <DialogHeader className="text-center space-y-2 sm:space-y-3">
          <div className="flex items-center justify-center gap-2 mb-1 sm:mb-2">
            <Sparkles className="h-5 w-5 sm:h-6 sm:w-6 text-cosmic animate-glow" />
            <DialogTitle className="text-xl sm:text-2xl cosmic-text font-bold">
              PalmAstro
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs sm:text-sm text-muted-foreground">
            Join thousands of users discovering their cosmic destiny
          </DialogDescription>
        </DialogHeader>

        <Tabs
          value={activeTab}
          onValueChange={(val) => {
            setActiveTab(val as "login" | "signup");
            setErrorMessage(null); // Clear errors when switching tabs
            setShowPassword(false);
            setShowConfirmPassword(false);
          }}
          className="w-full mt-4 sm:mt-6"
        >
          <TabsList className="grid w-full grid-cols-2 glass-card p-1 sm:p-1.5 rounded-lg sm:rounded-xl">
            <TabsTrigger 
              value="login" 
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all"
            >
              Sign In
            </TabsTrigger>
            <TabsTrigger 
              value="signup"
              className="text-xs sm:text-sm px-3 sm:px-4 py-2 sm:py-2.5 rounded-md sm:rounded-lg touch-manipulation data-[state=active]:bg-gradient-to-r data-[state=active]:from-orange-600 data-[state=active]:to-teal-600 data-[state=active]:text-white transition-all"
            >
              Sign Up
            </TabsTrigger>
          </TabsList>

          {/* Login Tab */}
          <TabsContent value="login" className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
            <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="login-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="Enter your email"
                    value={loginForm.email}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="login-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="login-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={loginForm.password}
                    onChange={(e) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 touch-manipulation"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 sm:gap-0">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="remember-me"
                    checked={loginForm.rememberMe}
                    onCheckedChange={(checked) =>
                      setLoginForm((prev) => ({
                        ...prev,
                        rememberMe: !!checked,
                      }))
                    }
                    className="touch-manipulation"
                  />
                  <Label
                    htmlFor="remember-me"
                    className="text-xs sm:text-sm text-muted-foreground cursor-pointer touch-manipulation"
                  >
                    Remember me
                  </Label>
                </div>
                <Button 
                  variant="link" 
                  className="text-cosmic p-0 h-auto text-xs sm:text-sm touch-manipulation"
                  type="button"
                >
                  Forgot password?
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full bg-stellar-gradient hover:opacity-90 sutra-glow h-11 sm:h-12 text-sm sm:text-base font-medium transition-all touch-manipulation"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  <>
                    <Star className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Sign In
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 sm:px-3 text-muted-foreground text-xs sm:text-xs">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-cosmic/30 text-cosmic hover:bg-cosmic/10 h-11 sm:h-12 text-sm sm:text-base font-medium transition-all touch-manipulation"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              type="button"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Continue with Google
            </Button>
          </TabsContent>

          {/* Signup Tab */}
          <TabsContent value="signup" className="space-y-4 sm:space-y-5 mt-4 sm:mt-6">
            <form onSubmit={handleSignup} className="space-y-4 sm:space-y-5">
              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-name" className="text-sm font-medium">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="signup-name"
                    type="text"
                    placeholder="Enter your full name"
                    value={signupForm.name}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    className="pl-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="name"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-email" className="text-sm font-medium">Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="signup-email"
                    type="email"
                    placeholder="Enter your email"
                    value={signupForm.email}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        email: e.target.value,
                      }))
                    }
                    className="pl-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="email"
                  />
                </div>
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-password" className="text-sm font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="signup-password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password (min. 8 characters)"
                    value={signupForm.password}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        password: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 touch-manipulation"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {signupForm.password && (
                  <p className="text-xs sm:text-xs text-muted-foreground">
                    {signupForm.password.length < 8 
                      ? `At least ${8 - signupForm.password.length} more characters needed`
                      : "✓ Password meets requirements"}
                  </p>
                )}
              </div>

              <div className="space-y-1.5 sm:space-y-2">
                <Label htmlFor="signup-confirm-password" className="text-sm font-medium">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />
                  <Input
                    id="signup-confirm-password"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={signupForm.confirmPassword}
                    onChange={(e) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        confirmPassword: e.target.value,
                      }))
                    }
                    className="pl-10 pr-10 h-11 sm:h-12 text-sm sm:text-base bg-background/50 border-border/50 focus:border-cosmic/50"
                    required
                    autoComplete="new-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 touch-manipulation"
                    aria-label={showConfirmPassword ? "Hide password" : "Show password"}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 sm:h-5 sm:w-5" />
                    ) : (
                      <Eye className="h-4 w-4 sm:h-5 sm:w-5" />
                    )}
                  </button>
                </div>
                {signupForm.confirmPassword && signupForm.password !== signupForm.confirmPassword && (
                  <p className="text-xs sm:text-xs text-red-400">
                    Passwords do not match
                  </p>
                )}
                {signupForm.confirmPassword && signupForm.password === signupForm.confirmPassword && signupForm.password.length >= 8 && (
                  <p className="text-xs sm:text-xs text-green-400">
                    ✓ Passwords match
                  </p>
                )}
              </div>

              <div className="space-y-3 sm:space-y-3">
                <div className="flex items-start space-x-2 sm:space-x-2.5">
                  <Checkbox
                    id="agree-terms"
                    checked={signupForm.agreeToTerms}
                    onCheckedChange={(checked) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        agreeToTerms: !!checked,
                      }))
                    }
                    required
                    className="mt-0.5 touch-manipulation"
                  />
                  <Label htmlFor="agree-terms" className="text-xs sm:text-sm leading-relaxed cursor-pointer touch-manipulation">
                    I agree to the{" "}
                    <Button variant="link" className="text-cosmic p-0 h-auto text-xs sm:text-sm inline touch-manipulation" type="button">
                      Terms of Service
                    </Button>{" "}
                    and{" "}
                    <Button variant="link" className="text-cosmic p-0 h-auto text-xs sm:text-sm inline touch-manipulation" type="button">
                      Privacy Policy
                    </Button>
                  </Label>
                </div>

                <div className="flex items-start space-x-2 sm:space-x-2.5">
                  <Checkbox
                    id="subscribe-newsletter"
                    checked={signupForm.subscribeNewsletter}
                    onCheckedChange={(checked) =>
                      setSignupForm((prev) => ({
                        ...prev,
                        subscribeNewsletter: !!checked,
                      }))
                    }
                    className="mt-0.5 touch-manipulation"
                  />
                  <Label
                    htmlFor="subscribe-newsletter"
                    className="text-xs sm:text-sm text-muted-foreground leading-relaxed cursor-pointer touch-manipulation"
                  >
                    Subscribe to cosmic insights and updates
                  </Label>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full bg-stellar-gradient hover:opacity-90 sutra-glow h-11 sm:h-12 text-sm sm:text-base font-medium transition-all touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed"
                disabled={isLoading || !signupForm.agreeToTerms}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 mr-2 animate-spin" />
                    Creating account...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 sm:h-5 sm:w-5 mr-2" />
                    Create Account
                  </>
                )}
              </Button>
            </form>

            <div className="relative my-4 sm:my-5">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t border-border/50" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-background px-2 sm:px-3 text-muted-foreground text-xs sm:text-xs">
                  Or continue with
                </span>
              </div>
            </div>

            <Button
              variant="outline"
              className="w-full border-cosmic/30 text-cosmic hover:bg-cosmic/10 h-11 sm:h-12 text-sm sm:text-base font-medium transition-all touch-manipulation"
              onClick={handleGoogleAuth}
              disabled={isLoading}
              type="button"
            >
              <svg className="h-4 w-4 sm:h-5 sm:w-5 mr-2 flex-shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign up with Google
            </Button>
          </TabsContent>
        </Tabs>

        {errorMessage && (
          <div className="mt-3 sm:mt-4 p-3 sm:p-3.5 rounded-lg bg-red-500/10 border border-red-500/30">
            <p className="text-xs sm:text-sm text-red-400 text-center leading-relaxed">{errorMessage}</p>
          </div>
        )}

        <div className="text-center text-xs sm:text-xs text-muted-foreground mt-4 sm:mt-5">
          {activeTab === "login" ? (
            <>
              Don't have an account?{" "}
              <button
                onClick={() => setActiveTab("signup")}
                className="text-cosmic hover:underline font-medium touch-manipulation transition-colors"
                type="button"
              >
                Sign up
              </button>
            </>
          ) : (
            <>
              Already have an account?{" "}
              <button
                onClick={() => setActiveTab("login")}
                className="text-cosmic hover:underline font-medium touch-manipulation transition-colors"
                type="button"
              >
                Sign in
              </button>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
