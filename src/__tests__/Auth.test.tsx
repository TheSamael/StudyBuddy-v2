import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Auth from '../pages/Auth';

// Mock AppContext
const mockShowToast = vi.fn();
const mockRefreshProfile = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    user: null,
    profile: null,
    showToast: mockShowToast,
    refreshProfile: mockRefreshProfile,
  }),
}));

// Mock Firebase module to avoid network requests
vi.mock('../lib/firebase', () => ({
  signInWithEmailAndPassword: vi.fn(),
  createUserWithEmailAndPassword: vi.fn(),
  sendPasswordResetEmail: vi.fn(),
  isMock: true,
}));

describe('Auth Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders login form elements properly', () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    // Verify header and fields are visible
    expect(screen.getByText('Welcome Back, Buddy')).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument();
    expect(screen.getByText('Sign In to Companion')).toBeInTheDocument();
  });

  it('renders password security checklist and updates dynamically during sign up', async () => {
    render(
      <MemoryRouter>
        <Auth />
      </MemoryRouter>
    );

    // Switch to Sign Up mode
    const signUpToggleBtn = screen.getByText(/Sign Up for free/i);
    expect(signUpToggleBtn).toBeInTheDocument();
    
    await act(async () => {
      fireEvent.click(signUpToggleBtn);
    });

    // Check that header is updated
    expect(screen.getByText('Begin Your Calm Journey')).toBeInTheDocument();

    // Confirm Password field should be rendered
    expect(screen.getByLabelText(/Confirm Password/i)).toBeInTheDocument();

    // Password checklist elements should be visible
    expect(screen.getByText('Password Requirements:')).toBeInTheDocument();
    expect(screen.getByText('At least 8 characters')).toBeInTheDocument();
    expect(screen.getByText('At least 1 uppercase letter (A-Z)')).toBeInTheDocument();
    expect(screen.getByText('At least 1 numerical digit (0-9)')).toBeInTheDocument();
    expect(screen.getByText('At least 1 special character (e.g. ! @ # $ % & *)')).toBeInTheDocument();

    // Check checklist classes / structure updates dynamically
    const passwordInput = screen.getByLabelText(/^Password/i);

    // Initial state: classes should show greyed out / standard state
    const lengthRule = screen.getByText('At least 8 characters');
    expect(lengthRule.className).toContain('text-slate-500');

    // Type a strong password: "SecurePass123!"
    await act(async () => {
      fireEvent.change(passwordInput, { target: { value: 'SecurePass123!' } });
    });

    // Rules should update and be marked green/emerald
    expect(lengthRule.className).toContain('text-emerald-700');
    
    const upperRule = screen.getByText('At least 1 uppercase letter (A-Z)');
    expect(upperRule.className).toContain('text-emerald-700');

    const numRule = screen.getByText('At least 1 numerical digit (0-9)');
    expect(numRule.className).toContain('text-emerald-700');

    const specialRule = screen.getByText('At least 1 special character (e.g. ! @ # $ % & *)');
    expect(specialRule.className).toContain('text-emerald-700');
  });
});
