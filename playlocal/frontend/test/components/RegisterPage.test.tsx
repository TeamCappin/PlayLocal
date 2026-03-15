// __tests__/RegisterPage.test.tsx
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RegisterPage } from '@/components/RegisterPage'; // <-- adjust path if needed
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

// Mock constants (with simple icon components)
jest.mock('@/lib/constants', () => {
  const Icon =
    (name: string) =>
    (props: any): JSX.Element => <svg data-testid={name} {...props} />;

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
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /continue/i })
    ).toBeInTheDocument();

    // footer link
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute(
      'href',
      '/login'
    );
  });

  it('shows password checklist when password field is focused', () => {
    setAuthMock({});
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.focus(passwordInput);

    // At least one rule from PASSWORD_RULES should be visible
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();
  });

  it('hides password checklist when password field is blurred and still empty', () => {
    setAuthMock({});
    render(<RegisterPage />);

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.focus(passwordInput);
    // Checklist is visible while focused
    expect(screen.getByText(/at least 8 characters/i)).toBeInTheDocument();

    fireEvent.blur(passwordInput);
    // Checklist should be gone when field is empty and blurred
    expect(screen.queryByText(/at least 8 characters/i)).not.toBeInTheDocument();
  });

  it('shows error when a weak password is submitted (e.g. all same chars)', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: '11111111' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText(/password does not meet requirements/i)
    ).toBeInTheDocument();
    // Should NOT advance to step 2
    expect(
      screen.getByRole('heading', { name: /create account/i })
    ).toBeInTheDocument();
  });

  it('shows error if age is not confirmed when submitting step 1', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText(/you must confirm you are at least 13 years old/i)
    ).toBeInTheDocument();
  });

  it('shows error if EULA is not accepted when submitting step 1', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });

    // check only age confirmed
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      screen.getByText(
        /you must accept the terms of service and privacy policy/i
      )
    ).toBeInTheDocument();
  });

  it('moves to step 2 when age + EULA are accepted', () => {
    setAuthMock({});
    render(<RegisterPage />);

    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });

    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));

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

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // submit without intensity
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    expect(
      screen.getByText(/please select your play intensity/i)
    ).toBeInTheDocument();
  });

  it('step 2 shows error if availability not selected', () => {
    setAuthMock({});
    render(<RegisterPage />);

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // pick intensity only
    fireEvent.click(screen.getByRole('button', { name: /casual/i }));

    // submit without availability
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

    // Step 1 inputs
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 selections
    fireEvent.click(screen.getByRole('button', { name: /competitive/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekdays/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(register).toHaveBeenCalledWith(
        'hudson@x.com',
        'Password1!',
        'Hudson',
        true,
        true
      );
    });

    expect(pushMock).toHaveBeenCalledWith('/discover');
  });

  it("shows 'Registration failed' fallback when register throws without a message", async () => {
    const { register } = setAuthMock({
      register: jest.fn().mockRejectedValue({}),
    });

    render(<RegisterPage />);

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 selections
    fireEvent.click(screen.getByRole('button', { name: /casual/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekends/i }));

    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => expect(register).toHaveBeenCalled());

    expect(screen.getByText(/registration failed/i)).toBeInTheDocument();
    expect(pushMock).not.toHaveBeenCalledWith('/discover');
  });

  it('shows the error message when register throws with a message', async () => {
    const { register } = setAuthMock({
      register: jest.fn().mockRejectedValue(new Error('Email already used')),
    });

    render(<RegisterPage />);

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 selections
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

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'hudson@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    // Step 2 selections
    fireEvent.click(screen.getByRole('button', { name: /casual/i }));
    fireEvent.click(screen.getByRole('button', { name: /weekends/i }));

    const submitBtn = screen.getByRole('button', { name: /create account/i });
    fireEvent.click(submitBtn);

    await waitFor(() => expect(register).toHaveBeenCalled());

    // while pending
    expect(
      screen.getByRole('button', { name: /creating account/i })
    ).toBeDisabled();

    // resolve promise to finish
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

    // Step 1 -> Step 2
    fireEvent.change(screen.getByLabelText(/display name/i), {
      target: { value: 'Hudson' },
    });
    fireEvent.change(screen.getByLabelText(/^email$/i), {
      target: { value: 'h@x.com' },
    });
    fireEvent.change(screen.getByLabelText(/password/i), {
      target: { value: 'Password1!' },
    });
    fireEvent.click(
      screen.getByRole('checkbox', { name: /at least 13 years old/i })
    );
    fireEvent.click(screen.getByRole('checkbox', { name: /i agree to the/i }));
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

    // effect should not redirect because authLoading is true
    expect(pushMock).not.toHaveBeenCalledWith('/discover');
  });
});
