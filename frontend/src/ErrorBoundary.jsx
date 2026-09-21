import React from "react";

// Shows a recovery screen instead of a blank page if a component crashes
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("App crashed:", error, info);
  }

  render() {
    if (!this.state.hasError) return this.props.children;
    return (
      <div className="min-h-dvh flex flex-col items-center justify-center text-center px-6 bg-bg">
        <p className="text-xl font-semibold">Something went wrong</p>
        <p className="text-sm text-ink-3 mt-2 max-w-xs">Reload the page to try again. Your data is safe.</p>
        <button onClick={() => window.location.reload()}
          className="mt-6 h-12 px-6 rounded-2xl bg-accent text-white font-semibold">
          Reload
        </button>
      </div>
    );
  }
}

export default ErrorBoundary;
