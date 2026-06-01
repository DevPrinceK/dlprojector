import React from "react";
import { safeProjectionError } from "../../lib/error-handling";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.warn(safeProjectionError(), error);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? <div className="p-6 text-sm text-muted-foreground">The app recovered safely.</div>;
    }

    return this.props.children;
  }
}
