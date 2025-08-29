import { CircleOffIcon } from 'lucide-react-native';
import { Component, type ErrorInfo, type ReactNode } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';

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
    if (__DEV__) {
      console.error('Error boundary caught an error:', error, errorInfo);
    }

    // TODO: Log to your crash reporting service here
    // Example: crashlytics().recordError(error);
  }

  private handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleRestart = () => {
    // Note: You'll need to install react-native-restart for this to work
    // npm install react-native-restart
    // For now, we'll just show an alert
    Alert.alert(
      'Restart Required',
      'Please close and reopen the app to continue.',
      [{ text: 'OK', style: 'default' }]
    );

    // If you have react-native-restart installed, uncomment:
    // import RNRestart from 'react-native-restart';
    // RNRestart.Restart();
  };

  private showErrorDetails = () => {
    if (!__DEV__ || !this.state.error) return;

    const errorDetails = `${this.state.error.message}\n\nStack:\n${this.state.error.stack}`;

    Alert.alert(
      'Error Details (Dev Mode)',
      errorDetails,
      [{ text: 'OK', style: 'default' }]
    );
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <View style={styles.container}>
          <View style={styles.content}>
            <View style={styles.iconContainer}>
              <CircleOffIcon size={32} color="#ef4444" />
            </View>

            <Text style={styles.title}>Something went wrong</Text>
            <Text style={styles.description}>
              An unexpected error occurred. We apologize for the inconvenience.
            </Text>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={this.handleReset}
              >
                <Text style={styles.primaryButtonText}>Try Again</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={this.handleRestart}
              >
                <Text style={styles.secondaryButtonText}>Restart App</Text>
              </TouchableOpacity>
            </View>

            {__DEV__ && this.state.error && (
              <TouchableOpacity
                style={styles.debugButton}
                onPress={this.showErrorDetails}
              >
                <Text style={styles.debugButtonText}>
                  Show Error Details (Dev Mode)
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  content: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    maxWidth: 320,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#ef4444',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 24,
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#667eea',
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#d1d5db',
  },
  secondaryButtonText: {
    color: '#374151',
    fontSize: 16,
    fontWeight: '500',
  },
  debugButton: {
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  debugButtonText: {
    color: '#6b7280',
    fontSize: 14,
    textDecorationLine: 'underline',
  },
});