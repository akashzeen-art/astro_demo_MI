import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle, RefreshCw } from "lucide-react";

interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
  errorInfo?: React.ErrorInfo;
}

class ErrorBoundary extends React.Component<
  React.PropsWithChildren<{}>,
  ErrorBoundaryState
> {
  constructor(props: React.PropsWithChildren<{}>) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    this.setState({ error, errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <Card className="glass-card max-w-md w-full">
            <CardContent className="p-6 text-center">
              <AlertTriangle className="h-12 w-12 text-cosmic mx-auto mb-4" />
              <h2 className="text-xl font-bold mb-2">Something went wrong</h2>
              <p className="text-muted-foreground mb-4">
                An unexpected error occurred. Don't worry, your cosmic journey
                continues!
              </p>

              {process.env.NODE_ENV === "development" && this.state.error && (
                <details className="mb-4 text-left bg-muted p-3 rounded text-sm">
                  <summary className="cursor-pointer font-medium">
                    Error Details
                  </summary>
                  <pre className="mt-2 whitespace-pre-wrap">
                    {this.state.error.toString()}
                  </pre>
                </details>
              )}

              <div className="space-y-2">
                <Button
                  onClick={this.handleReset}
                  className="w-full bg-stellar-gradient hover:opacity-90"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Try Again
                </Button>
                <Button
                  variant="outline"
                  onClick={() => window.location.reload()}
                  className="w-full border-cosmic/50 text-cosmic hover:bg-cosmic/20"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
