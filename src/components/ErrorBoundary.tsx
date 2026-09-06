import React, { Component, ReactNode, ErrorInfo } from 'react';
import { RefreshCw, AlertTriangle } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught component error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#000000] text-[#F5F5F4] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-[#0A0A0B] border border-[#1E1E21] rounded-2xl p-8 shadow-2xl space-y-5">
            <div className="w-12 h-12 rounded-2xl bg-[#FF453A]/10 border border-[#FF453A]/30 flex items-center justify-center mx-auto text-[#FF453A]">
              <AlertTriangle className="w-6 h-6" />
            </div>
            
            <div>
              <h2 className="text-xl font-bold text-[#F5F5F4]">App Syncing</h2>
              <p className="text-xs text-[#9C9DA3] mt-2">
                Click below to reload your live workspace.
              </p>
            </div>

            <button
              onClick={() => {
                this.setState({ hasError: false, error: null });
                window.location.reload();
              }}
              className="w-full flex items-center justify-center gap-2 py-3 bg-[#39FFB0] text-[#000000] rounded-xl font-bold text-xs hover:bg-[#39FFB0]/90 transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reload Application</span>
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
