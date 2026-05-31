import { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col items-center justify-center gap-4 p-8">
          <p className="text-2xl font-bold">出錯了 😵</p>
          <p className="text-zinc-400 text-sm">請重新整理頁面，或清除瀏覽器快取後再試。</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm font-semibold transition-colors"
          >
            重新整理
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
