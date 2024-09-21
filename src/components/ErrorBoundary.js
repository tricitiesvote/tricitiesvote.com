// src/components/ErrorBoundary.js
import React from 'react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    // Update state to display fallback UI
    console.log('ErrorBoundary getDerivedStateFromError:', error);
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    // Log error details
    console.warn('ErrorBoundary caught an error:', error, info);
    // Store error details in state
    this.setState({ error, info });
  }

  render() {
    const { hasError, error, info } = this.state; // Destructure state
    const { children } = this.props; // Destructure props

    if (hasError) {
      return (
        <>
          <h2>Something went wrong.</h2>
          <p>
            Please <a href="mailto:guide@tricitiesvote.com">email us</a> to let
            us know if you receive an error.
          </p>
          {error && (
            <>
              <h3>Error Details:</h3>
              <pre>
                <code>{error.toString()}</code>
              </pre>
              {info && (
                <>
                  <h4>Component Stack:</h4>
                  <pre>
                    <code>{info.componentStack}</code>
                  </pre>
                </>
              )}
            </>
          )}
        </>
      );
    }

    return children; // Use destructured props
  }
}

export default ErrorBoundary;
