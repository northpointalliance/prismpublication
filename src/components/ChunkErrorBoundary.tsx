import { Component, type ReactNode } from "react";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

class ChunkErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background p-6 text-center">
          <p className="text-lg font-semibold text-foreground">Page failed to load</p>
          <p className="text-sm text-muted-foreground">A network error prevented this page from loading. This usually resolves on retry.</p>
          <button
            onClick={() => window.location.reload()}
            className="rounded-full bg-primary px-6 py-2 text-sm font-semibold text-primary-foreground"
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ChunkErrorBoundary;
