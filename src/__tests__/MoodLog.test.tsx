import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import MoodLoggingModal from '../components/MoodLoggingModal';

const mockLogMood = vi.fn();
const mockSetShowMoodModal = vi.fn();

vi.mock('../context/AppContext', () => ({
  useApp: () => ({
    showMoodModal: true,
    setShowMoodModal: mockSetShowMoodModal,
    logMood: mockLogMood,
    profile: { name: "Test Student" },
  }),
}));

describe('MoodLoggingModal Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders range sliders for Stress, Anxiety, Happiness, and Confusion correctly', () => {
    const { container } = render(<MoodLoggingModal />);

    // Verify headers and sliders exist
    expect(screen.getByText('Pause for a Breather, Buddy')).toBeInTheDocument();
    expect(screen.getByText('Stress Level')).toBeInTheDocument();
    expect(screen.getByText('Anxiety Level')).toBeInTheDocument();
    expect(screen.getByText('Happiness Level')).toBeInTheDocument();
    expect(screen.getByText('Confusion Level')).toBeInTheDocument();

    // Verify 1 to 10 scale representation exists by checking the displays of default state (5 / 10)
    expect(screen.getAllByText('5')).toHaveLength(4);

    // Verify individual range inputs exist by querying the IDs
    const stressInput = container.querySelector('#mood-range-stre');
    const anxietyInput = container.querySelector('#mood-range-anxi');
    const happinessInput = container.querySelector('#mood-range-happ');
    const confusionInput = container.querySelector('#mood-range-conf');

    expect(stressInput).toBeInTheDocument();
    expect(anxietyInput).toBeInTheDocument();
    expect(happinessInput).toBeInTheDocument();
    expect(confusionInput).toBeInTheDocument();
  });

  it('updates slider values when range inputs are changed', async () => {
    const { container } = render(<MoodLoggingModal />);

    const stressSlider = container.querySelector('#mood-range-stre') as HTMLInputElement;
    const anxietySlider = container.querySelector('#mood-range-anxi') as HTMLInputElement;

    // Update Stress slider value to 8
    await act(async () => {
      fireEvent.change(stressSlider, { target: { value: '8' } });
    });
    expect(stressSlider.value).toBe('8');

    // Update Anxiety slider value to 2
    await act(async () => {
      fireEvent.change(anxietySlider, { target: { value: '2' } });
    });
    expect(anxietySlider.value).toBe('2');
  });
});
