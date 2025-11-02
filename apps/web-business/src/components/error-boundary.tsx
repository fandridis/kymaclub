import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from './ui/card';
import { createTypedT } from '@/lib/typed';
import i18n from '@/lib/i18n';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (import.meta.env.DEV) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }

    // TODO: Log to your error reporting service here
    // Example: logErrorToService(error, errorInfo);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = () => {
    window.location.reload();
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      const t = createTypedT(i18n.t.bind(i18n));

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle className="text-red-600">{t('errors.somethingWentWrong')}</CardTitle>
              <CardDescription>
                {t('errors.unexpectedError')}
              </CardDescription>
            </CardHeader>

            <CardContent>
              {import.meta.env.DEV && this.state.error && (
                <details className="mt-4 p-3 bg-gray-100 rounded text-sm">
                  <summary className="cursor-pointer font-medium">
                    {t('errors.errorDetails')}
                  </summary>
                  <div className="mt-2 space-y-2">
                    <div>
                      <strong>Error:</strong> {this.state.error.message}
                    </div>
                    {this.state.errorInfo && (
                      <div>
                        <strong>Stack:</strong>
                        <pre className="text-xs overflow-auto mt-1">
                          {this.state.errorInfo.componentStack}
                        </pre>
                      </div>
                    )}
                  </div>
                </details>
              )}
            </CardContent>

            <CardFooter className="flex gap-2">
              <Button onClick={this.handleReset} variant="outline">
                {t('errors.tryAgain')}
              </Button>
              <Button onClick={this.handleReload}>
                {t('errors.reloadPage')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}