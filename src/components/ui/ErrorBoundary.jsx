'use client';

import { Component } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';

// Class component — required for React error boundaries. Wrapping each view in
// one means a crash in a single view degrades gracefully instead of taking the
// whole board down. Resets automatically when its `key` (the active view) changes.
export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    console.error('[view error]', error, info?.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="card flex flex-col items-center justify-center text-center py-16 px-6 fade-in">
          <span className="grid place-items-center w-14 h-14 rounded-2xl mb-4" style={{ background: 'var(--red-bg)', color: 'var(--red)' }}>
            <AlertTriangle size={26} />
          </span>
          <p className="font-display text-[19px]" style={{ color: 'var(--ink)' }}>Something went wrong here</p>
          <p className="text-[13px] mt-1.5 max-w-sm" style={{ color: 'var(--muted)' }}>{String(this.state.error?.message || this.state.error)}</p>
          <button onClick={() => this.setState({ error: null })} className="btn btn-primary mt-5">
            <RotateCw size={15} /> Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
