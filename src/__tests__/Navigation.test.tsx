import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import TopNav from '../components/TopNav';

// Mock AppContext with a logged-in user to ensure authenticated links are visible
vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    user: { email: 'student@studybuddy.in' },
    profile: { name: 'Rahul' },
    showToast: vi.fn(),
    trigger2HourSimulation: vi.fn(),
  }),
}));

describe('TopNav Component', () => {
  it('renders top navigation bar and all core links when user is authenticated', () => {
    render(
      <MemoryRouter>
        <TopNav />
      </MemoryRouter>
    );

    // Verify brand logo/title
    expect(screen.getByText('StudyBuddy')).toBeInTheDocument();

    // Verify all major links are present
    expect(screen.getAllByText('Home')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Chat')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Diarium')[0]).toBeInTheDocument();
    expect(screen.getAllByText('Materials')[0]).toBeInTheDocument();
  });
});
