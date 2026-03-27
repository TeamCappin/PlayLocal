// __tests__/RegisterPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegisterPage } from '@/components/RegisterPage';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

// --------------------
// Mocks
// --------------------
jest.mock('next/link', () => {
  return ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  );
});

const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

jest.mock('react-google-recaptcha-v3', () => ({
  useGoogleReCaptcha: () => ({ executeRecaptcha: jest.fn().mockResolvedValue('mock-captcha-token') }),
}));

jest.mock('@/lib/constants', () => {
  const Icon =
    (name: string) =>
    (props: any): React.ReactElement =>
      <svg data-testid={name} {...props} />;

  return {
    INTENSITY_OPTIONS: [
      {
        id: 'casual',
        label: 'Casual',
        description: 'Just for fun',
        icon: Icon('IntensityCasualIcon'),
      },
      {
        id: 'competitive',
        label: 'Competitive',
        description: 'Try hard',
        icon: Icon('IntensityCompetitiveIcon'),
      },
      {
        id: 'mixed',
        label: 'Mixed',
        description: 'Depends',
        icon: Icon('IntensityMixedIcon'),
      },
    ],
    AVAILABILITY_OPTIONS: [
      { id: 'weekday', label: 'Weekdays', icon: Icon('AvailWeekdayIcon') },
      { id: 'weekend', label: 'Weekends', icon: Icon('AvailWeekendIcon') },
    ],
  };
});

// --------------------
// Helpers
// --------------------
function setAuthMock({
  register = jest.fn().mockResolvedValue(undefined),
  user = null,
  authLoading = false,
}: {
  register?: jest.Mock;
  user?: any;
  authLoading?: boolean;
}) {
  (useAuth as unknown as jest.Mock).mockReturnValue({
    register,
    user,
    isLoading: authLoading,
  });
  return { register };
}

function deferred<T>() {
  let resolve!: (v: T) => void;
  let reject!: (e: any) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

const getPasswordInput = () =>
  screen.getByLabelText(/^password$/i, { selector: 'input' });

describe('RegisterPage', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as unknown as jest.Mock).mockReturnValue({ push: pushMock });
  });

  it('renders step 1 (Create Account) by default', () => {
    setAuthMock({});
    render(<RegisterPage />);

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
    expect(screen.getByLabelText(/display name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(getPasswordInput()).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue/i })
    ).toBeInTheDocument();

    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
    expect(
      screen
        .getAllByRole('link', { name: /terms-of-service of service/i })
        .some((link) => link.getAttribute('href') === '/terms-of-service')
    ).toBe(true);
    expect(
      screen
        .getAllByRole('link', { name: /privacy policy/i })
        .some((link) => link.getAttribute('href') === '/privacy-policy')
    ).toBe(true);
  });

  it('shows password checklist when password field is focused', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.focus(getPasswordInput());

    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('hides password checklist when password field is blurred and still empty', () => {
    setAuthMock({});
    render(<RegisterPage />);

    const passwordInput = getPasswordInput();
    fireEvent.focus(passwordInput);
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    fireEvent.blur(passwordInput);
    expect(
      screen.queryByText(/at least 8 characters/i)
    ).not.toBeInTheDocument();
  });

  it('keeps Continue disabled when password is weak', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: '11111111' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('keeps Continue disabled until age is confirmed', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('keeps Continue disabled until terms are accepted', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });

    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('keeps Continue disabled until privacy policy is accepted', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });

    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('keeps Continue disabled when email is invalid', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'invalid-email' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );

    expect(screen.getByRole('button', { name: /continue/i })).toBeDisabled();
  });

  it('enables Continue only when all step 1 fields and acknowledgments are valid', () => {
    setAuthMock({});
    render(<RegisterPage />);

    const continueButton = screen.getByRole('button', { name: /continue/i });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    expect(continueButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    expect(continueButton).toBeDisabled();

    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    expect(continueButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    expect(continueButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    expect(continueButton).toBeDisabled();

    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );

    expect(continueButton).toBeEnabled();
  });

  it('moves to step 2 when age + terms + privacy are accepted', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });

    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByRole('heading', { name: /tell us about you/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/self-rated intensity/i)).toBeInTheDocument();
    expect(screen.getByText(/availability/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('step 2 shows error if intensity not selected', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/please select your play intensity/i)
    ).toBeInTheDocument();
  });

  it('step 2 shows error if availability not selected', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /casual/i }));
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/please select at least one availability option/i)
    ).toBeInTheDocument();
  });

  it('submits step 2: calls register and navigates to /discover on success', async () => {
    const { register } = setAuthMock({
      register: jest.fn().mockResolvedValue(undefined),
      user: null,
      authLoading: false,
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /competitive/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekdays/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        'hudson@x.com',
        'Password1!',
        'Hudson',
        true,
        true,
        'mock-captcha-token'
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/discover');
  });

  it("shows 'Registration failed' fallback when register throws without a message", async () => {
    const { register } = setAuthMock({
      register: jest.fn().mockRejectedValue({}),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /casual/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekends/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());

    await waitFor(() => {
      expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    });
    expect(pushMock).not.toHaveBeenCalledWith('/discover');
  });

  it('shows the error message when register throws with a message', async () => {
    const { register } = setAuthMock({
      register: jest.fn().mockRejectedValue(new Error('Email already used')),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /mixed/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekdays/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());
    expect(screen.getByText(/email already used/i)).toBeInTheDocument();
  });

  it('disables submit button and shows loading text while creating account', async () => {
    const d = deferred<void>();
    const { register } = setAuthMock({
      register: jest.fn().mockReturnValue(d.promise),
    });

    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    fireEvent.click(screen.getByRole('button', { name: /casual/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekends/i }));

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(register).toHaveBeenCalled());

    expect(
      screen.getByRole('button', { name: /creating account/i })
    ).toBeDisabled();

    d.resolve();
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: /create account/i })
      ).toBeInTheDocument()
    );
  });

  it('Back button on step 2 returns to step 1', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(getPasswordInput(), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the terms of service/i })
    );
    fireEvent.click(
      screen.getByRole('checkbox', { name: /accept the privacy policy/i })
    );
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByRole('heading', { name: /tell us about you/i })
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('redirects authenticated users to /discover when auth loading finishes', async () => {
    setAuthMock({
      user: { id: 'u1' },
      authLoading: false,
    });

    render(<RegisterPage />);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/discover');
    });
  });

  it('does NOT redirect while auth is loading', async () => {
    setAuthMock({
      user: { id: 'u1' },
      authLoading: true,
    });

    render(<RegisterPage />);

    expect(pushMock).not.toHaveBeenCalledWith('/discover');
  });
});