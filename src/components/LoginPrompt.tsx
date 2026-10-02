import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Shield, LogIn, Sparkles } from "lucide-react";

interface LoginPromptProps {
  featureName: string;
  description?: string;
}

const LoginPrompt = ({ featureName, description }: LoginPromptProps) => {
  const handleOpenLogin = () => {
    // Dispatch event to open auth modal
    window.dispatchEvent(new CustomEvent("open-auth-modal"));
  };

  return (
    <div className="min-h-screen page-container flex items-center justify-center py-20">
      {/* Enhanced star background with gradients */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="stars-bg absolute inset-0"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900/70 via-orange-950/40 to-teal-950/50" />
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-orange-950/20 to-transparent" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-orange-950/30 via-transparent to-transparent" />
      </div>

      <div className="relative z-10 w-full max-w-2xl px-4">
        <Card className="glass-card border-orange-500/30 hover:border-amber-400/50 transition-all duration-300 rounded-2xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-50"></div>
          <CardHeader className="text-center relative z-10 pb-4">
            <div className="mx-auto mb-4 p-4 bg-gradient-to-br from-orange-500/30 to-teal-500/30 rounded-full w-24 h-24 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <Shield className="h-12 w-12 text-amber-300" />
            </div>
            <CardTitle className="text-3xl font-bold text-white mb-2">
              Please Log In
            </CardTitle>
            <p className="text-gray-300 text-lg">
              {description || `Please log in to use ${featureName}`}
            </p>
          </CardHeader>
          <CardContent className="text-center relative z-10 space-y-6">
            <div className="flex items-center justify-center gap-2 text-amber-300 mb-4">
              <Sparkles className="h-5 w-5" />
              <p className="text-sm">
                Access personalized readings, save your results, and track your spiritual journey
              </p>
            </div>
            <Button
              onClick={handleOpenLogin}
              className="bg-gradient-to-r from-orange-600 to-teal-600 hover:from-orange-700 hover:to-teal-700 text-white shadow-2xl shadow-orange-500/30 rounded-xl px-8 py-6 text-lg font-semibold transition-all duration-300 hover:scale-105 w-full sm:w-auto"
              size="lg"
            >
              <LogIn className="h-5 w-5 mr-2" />
              Log In
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LoginPrompt;

