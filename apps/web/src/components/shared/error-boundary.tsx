import { Component, type ErrorInfo, type PropsWithChildren } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type ErrorBoundaryState = {
  hasError: boolean;
  error: Error | null;
};

export class ErrorBoundary extends Component<
  PropsWithChildren,
  ErrorBoundaryState
> {
  constructor(props: PropsWithChildren) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  override render() {
    if (this.state.hasError) {
      return (
        <main className="app-shell flex items-center justify-center">
          <Card className="max-w-lg space-y-4 text-center">
            <p className="text-sm font-semibold tracking-widest text-danger uppercase">
              Something went wrong
            </p>
            <h1 className="page-title">Unexpected error</h1>
            <p className="page-copy max-w-none">
              {this.state.error?.message ??
                "An unexpected error occurred. Please try again."}
            </p>
            <div className="flex justify-center gap-3">
              <Button onClick={this.handleReset} type="button">
                Try again
              </Button>
              <Button
                variant="outline"
                onClick={() => (window.location.href = "/")}
                type="button"
              >
                Go home
              </Button>
            </div>
          </Card>
        </main>
      );
    }

    return this.props.children;
  }
}
