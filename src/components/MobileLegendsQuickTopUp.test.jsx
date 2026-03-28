import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import MobileLegendsQuickTopUp from './MobileLegendsQuickTopUp';
import { checkPlayer, checkPlayerHealth } from '../services/api';

vi.mock('../services/api', () => ({
  checkPlayer: vi.fn(),
  checkPlayerHealth: vi.fn(),
  createOrder: vi.fn(),
}));

describe('MobileLegendsQuickTopUp', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    vi.useRealTimers();
    checkPlayerHealth.mockResolvedValue({ success: true, service: 'player-api' });
  });

  it('sanitizes user and zone input to digits only', async () => {
    checkPlayer.mockResolvedValue({ data: { nickname: 'DemoUser' } });

    render(<MobileLegendsQuickTopUp />);
    await act(async () => {});

    const userInput = screen.getByLabelText('User ID');
    const zoneInput = screen.getByLabelText('Zone ID');

    fireEvent.change(userInput, { target: { value: 'ab12!@#34xyz' } });
    fireEvent.change(zoneInput, { target: { value: 'z9-8-7q' } });

    expect(userInput).toHaveValue('1234');
    expect(zoneInput).toHaveValue('987');
  });

  it('shows timeout error and allows retry verification', async () => {
    vi.useFakeTimers();

    checkPlayer
      .mockImplementationOnce(() => new Promise(() => {}))
      .mockResolvedValueOnce({ data: { nickname: 'RetryHero' } });

    render(<MobileLegendsQuickTopUp />);
    await act(async () => {});

    fireEvent.change(screen.getByLabelText('User ID'), { target: { value: '12345' } });
    fireEvent.change(screen.getByLabelText('Zone ID'), { target: { value: '6789' } });

    await act(async () => {
      await vi.advanceTimersByTimeAsync(9000);
    });

    expect(screen.getByText(/Verification timed out\. Please retry\./)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Verification' }));

    await act(async () => {
      await vi.advanceTimersByTimeAsync(700);
    });

    expect(screen.getByText(/Verified User:/)).toBeInTheDocument();
    expect(screen.getAllByText('RetryHero').length).toBeGreaterThan(0);

    expect(checkPlayer).toHaveBeenCalledTimes(2);
  });

  it('supports keyboard selection navigation in package and payment radios', async () => {
    checkPlayer.mockResolvedValue({ data: { nickname: 'KeyboardUser' } });

    render(<MobileLegendsQuickTopUp />);
    await act(async () => {});

    const packageRadios = screen.getAllByRole('radio', { name: /Diamonds for/ });
    const paymentRadios = screen.getAllByRole('radio', { name: /Select/ });

    fireEvent.keyDown(packageRadios[0], { key: 'End' });
    expect(packageRadios[packageRadios.length - 1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(packageRadios[packageRadios.length - 1], { key: 'Home' });
    expect(packageRadios[0]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(paymentRadios[0], { key: 'ArrowDown' });
    expect(paymentRadios[1]).toHaveAttribute('aria-checked', 'true');

    fireEvent.keyDown(paymentRadios[1], { key: 'Home' });
    expect(paymentRadios[0]).toHaveAttribute('aria-checked', 'true');
  });

  it('retries player API preflight from warning banner', async () => {
    checkPlayerHealth
      .mockRejectedValueOnce(new Error('wrong backend'))
      .mockResolvedValueOnce({ success: true, service: 'player-api' });

    render(<MobileLegendsQuickTopUp />);
    await act(async () => {});

    expect(screen.getByText(/Player API preflight failed/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: 'Retry Preflight' }));

    await waitFor(() => {
      expect(screen.queryByText(/Player API preflight failed/)).not.toBeInTheDocument();
    });
  });
});
