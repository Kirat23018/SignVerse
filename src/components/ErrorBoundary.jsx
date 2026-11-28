import React from 'react';

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      errorMessage: error?.message || 'An unexpected rendering error occurred.'
    };
  }

  componentDidCatch(error, info) {
    console.error('[SignVerse ErrorBoundary]', error, info);
  }

  handleReset = () => {
    this.setState({ hasError: false, errorMessage: '' });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          style={{
            minHeight: 'calc(100vh - 65px)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '32px 20px',
            backgroundColor: '#191C1A',
            color: '#E4EAE6',
            textAlign: 'center',
            gap: '16px'
          }}
        >
          <div
            style={{
              maxWidth: '480px',
              backgroundColor: '#242A27',
              border: '1px solid rgba(239, 68, 68, 0.35)',
              borderRadius: '20px',
              padding: '28px 24px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)'
            }}
          >
            <h2 style={{ margin: '0 0 10px 0', fontSize: '20px', fontWeight: '800', color: '#E4EAE6' }}>
              Something went wrong in this view
            </h2>
            <p style={{ margin: '0 0 20px 0', fontSize: '13.5px', color: '#9CAEA4', lineHeight: 1.5 }}>
              {this.state.errorMessage}
            </p>
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={this.handleReset}
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: 'none',
                  backgroundColor: '#7CA992',
                  color: '#191C1A',
                  fontWeight: '800',
                  fontSize: '13px',
                  cursor: 'pointer'
                }}
              >
                Try Again
              </button>
              <a
                href="/"
                style={{
                  padding: '10px 18px',
                  borderRadius: '12px',
                  border: '1px solid rgba(255, 255, 255, 0.14)',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  color: '#E4EAE6',
                  fontWeight: '700',
                  fontSize: '13px',
                  textDecoration: 'none'
                }}
              >
                Return Home
              </a>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
