import { Component } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';
import Button from './Button';

/**
 * Error Boundary component to catch React render errors.
 * Follows error-handling-patterns skill for graceful degradation.
 */
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    // Log error for debugging
    console.error('[ErrorBoundary] Caught error:', error);
    console.error('[ErrorBoundary] Component stack:', errorInfo.componentStack);

    this.setState({
      error,
      errorInfo,
    });
  }

  handleReload = () => {
    window.location.reload();
  };

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-background p-6">
          <div className="max-w-md w-full bg-surface dark:bg-surface-alt rounded-2xl shadow-xl p-8 text-center">
            <div className="bg-error/10 p-4 rounded-full w-16 h-16 mx-auto mb-6 flex items-center justify-center">
              <AlertTriangle size={32} className="text-error" />
            </div>

            <h2 className="text-xl font-bold text-text-primary mb-2">
              Algo salió mal
            </h2>

            <p className="text-text-secondary text-sm mb-6">
              Se produjo un error inesperado. Por favor, intenta recargar la página o vuelve a intentarlo.
            </p>

            {this.props.showErrorDetails && this.state.error && (
              <details className="text-left bg-background dark:bg-background p-4 rounded-xl mb-6 text-xs text-text-muted overflow-auto max-h-32">
                <summary className="cursor-pointer font-medium mb-2">
                  Detalles del error
                </summary>
                <pre className="whitespace-pre-wrap">
                  {this.state.error.toString()}
                </pre>
                {this.state.errorInfo && (
                  <pre className="whitespace-pre-wrap mt-2 opacity-75">
                    {this.state.errorInfo.componentStack}
                  </pre>
                )}
              </details>
            )}

            <div className="flex gap-3">
              <Button
                variant="secondary"
                onClick={this.handleReset}
                className="flex-1"
              >
                Reiniciar
              </Button>
              <Button
                onClick={this.handleReload}
                className="flex-1"
                icon={RefreshCw}
              >
                Recargar
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
