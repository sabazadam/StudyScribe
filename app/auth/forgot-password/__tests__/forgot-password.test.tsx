/**
 * PASSWORD RESET PAGE TESTS
 * ==============================================================================
 * Test suite for password reset flow validation
 * Tests email validation, error handling, and user feedback
 * ==============================================================================
 */

import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useRouter } from 'next/navigation';
import ForgotPasswordPage from '../page';
import { useAuth } from '@/components/contexts/AuthContext';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// Mock AuthContext
jest.mock('@/components/contexts/AuthContext', () => ({
  useAuth: jest.fn(),
}));

describe('ForgotPasswordPage', () => {
  const mockSendPasswordReset = jest.fn();
  const mockRouter = {
    push: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (useAuth as jest.Mock).mockReturnValue({
      user: null,
      sendPasswordReset: mockSendPasswordReset,
    });
  });

  describe('Page Structure', () => {
    it('should render the forgot password form', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByRole('heading', { name: /Forgot Password\?/i })).toBeInTheDocument();
    });

    it('should have all necessary form elements', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Send Reset Link/i })).toBeInTheDocument();
    });

    it('should have navigation links', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByRole('link', { name: /Sign in/i })).toHaveAttribute('href', '/auth/signin');
      expect(screen.getByRole('link', { name: /Back to home/i })).toHaveAttribute('href', '/');
    });
  });

  describe('Email Validation', () => {
    it('should show error when email is empty', async () => {
      render(<ForgotPasswordPage />);
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Email address is required/i)).toBeInTheDocument();
      });
    });

    it('should show error for invalid email format', async () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'invalid-email');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Please enter a valid email address/i)).toBeInTheDocument();
      });
    });

    it('should accept valid email formats', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'user@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendPasswordReset).toHaveBeenCalledWith('user@example.com');
      });
    });

    it('should clear error message on valid input', async () => {
      render(<ForgotPasswordPage />);
      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;

      // Type invalid email
      await userEvent.type(emailInput, 'invalid');

      // Error should appear after submit attempt
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });
      await userEvent.click(submitButton);

      // Type valid email
      await userEvent.clear(emailInput);
      await userEvent.type(emailInput, 'valid@example.com');

      // Error should be cleared
      await waitFor(() => {
        expect(screen.queryByText(/Please enter a valid email address/i)).not.toBeInTheDocument();
      });
    });
  });

  describe('Form Submission', () => {
    it('should send password reset email on valid submission', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockSendPasswordReset).toHaveBeenCalledWith('test@example.com');
      });
    });

    it('should show loading state while submitting', async () => {
      mockSendPasswordReset.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      expect(screen.getByText(/Sending email.../i)).toBeInTheDocument();
    });

    it('should disable form during submission', async () => {
      mockSendPasswordReset.mockImplementation(
        () =>
          new Promise((resolve) =>
            setTimeout(() => resolve({ success: true }), 100)
          )
      );
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      expect(emailInput).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('Error Handling', () => {
    it('should handle user-not-found error', async () => {
      mockSendPasswordReset.mockResolvedValue({
        success: false,
        error: 'auth/user-not-found',
      });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'notfound@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/No account found with this email/i)).toBeInTheDocument();
      });
    });

    it('should handle invalid-email error', async () => {
      mockSendPasswordReset.mockResolvedValue({
        success: false,
        error: 'auth/invalid-email',
      });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Invalid email address/i)).toBeInTheDocument();
      });
    });

    it('should handle rate limiting error', async () => {
      mockSendPasswordReset.mockResolvedValue({
        success: false,
        error: 'auth/too-many-requests',
      });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Too many reset requests/i)
        ).toBeInTheDocument();
      });
    });

    it('should handle network errors', async () => {
      mockSendPasswordReset.mockRejectedValue(new Error('Network error'));
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/unexpected error/i)).toBeInTheDocument();
      });
    });
  });

  describe('Success State', () => {
    it('should show success message after submission', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(
          screen.getByText(/Password reset email sent!/i)
        ).toBeInTheDocument();
      });
    });

    it('should show help information in success state', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByText(/Check your email spam\/junk folder/i)).toBeInTheDocument();
        expect(screen.getByText(/Didn't receive the email\?/i)).toBeInTheDocument();
      });
    });

    it('should provide retry button in success state', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });
    });

    it('should reset form when retry button is clicked', async () => {
      mockSendPasswordReset.mockResolvedValue({ success: true });
      render(<ForgotPasswordPage />);

      const emailInput = screen.getByLabelText(/Email Address/i) as HTMLInputElement;
      const submitButton = screen.getByRole('button', { name: /Send Reset Link/i });

      await userEvent.type(emailInput, 'test@example.com');
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: /Try Again/i })).toBeInTheDocument();
      });

      const retryButton = screen.getByRole('button', { name: /Try Again/i });
      await userEvent.click(retryButton);

      // Form should be reset
      expect(emailInput.value).toBe('');
      expect(screen.queryByText(/Password reset email sent!/i)).not.toBeInTheDocument();
    });
  });

  describe('Authentication Check', () => {
    it('should redirect authenticated users to /create', () => {
      (useAuth as jest.Mock).mockReturnValue({
        user: { uid: '123', email: 'test@example.com' },
        sendPasswordReset: mockSendPasswordReset,
      });

      render(<ForgotPasswordPage />);

      expect(mockRouter.push).toHaveBeenCalledWith('/create');
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA labels', () => {
      render(<ForgotPasswordPage />);
      expect(screen.getByLabelText(/Email Address/i)).toHaveAttribute('aria-label');
    });

    it('should have proper form structure', () => {
      render(<ForgotPasswordPage />);
      const form = screen.getByRole('button', { name: /Send Reset Link/i }).closest('form');
      expect(form).toBeInTheDocument();
    });
  });
});
