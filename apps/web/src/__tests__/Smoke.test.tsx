import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PRCheckPage from '../app/pr-check/page';

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams('pr=123&status=blocked&author=@alice')
}));

describe('PR Check Page Smoke Test', () => {
  it('renders the blocked status correctly based on URL parameters', () => {
    render(<PRCheckPage />);
    
    // Check if the PR number from the URL is rendered
    expect(screen.getByText(/Architectural integrity verification for PR #123/i)).toBeInTheDocument();
    
    // Check if the Blocked status is rendered
    expect(screen.getByText('Architectural Conflict Detected')).toBeInTheDocument();
    
    // Check if the author is rendered (might be rendered multiple times)
    expect(screen.getAllByText('@alice').length).toBeGreaterThan(0);
    
    // Check if the action required message is rendered
    expect(screen.getByText(/To proceed with this PR/i)).toBeInTheDocument();
  });
});
