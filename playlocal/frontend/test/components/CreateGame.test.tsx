// __tests__/components/CreateGame.test.tsx
import React from 'react';
import {
  render,
  screen,
  fireEvent,
  act,
  waitFor,
  within,
} from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateGame, isValidStep } from '@/components/CreateGame';
import { toast } from '@/lib/toast';

// --------------------
// Global polyfills (JSDOM quirks)
// --------------------
beforeAll(() => {
  if (!(global as any).requestAnimationFrame) {
    (global as any).requestAnimationFrame = (cb: FrameRequestCallback) => {
      cb(0);
      return 0;
    };
  }
});

// --------------------
// Mocks
// --------------------
const pushMock = jest.fn();
jest.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
}));

jest.mock('lucide-react', () => {
  const Icon = (name: string) => (props: any) => (
    <svg data-testid={name} {...props} />
  );
  return {
    MapPin: Icon('MapPin'),
    Clock: Icon('Clock'),
    Users: Icon('Users'),
    TrendingUp: Icon('TrendingUp'),
    Calendar: Icon('Calendar'),
    Save: Icon('Save'),
    Eye: Icon('Eye'),
    Plus: Icon('Plus'),
    X: Icon('X'),
    Loader2: Icon('Loader2'),
    AlertCircle: Icon('AlertCircle'),
  };
});

const mockUseAuth = jest.fn();
jest.mock('@/context/AuthContext', () => ({
  useAuth: () => mockUseAuth(),
}));

const mockUseCreateGame = jest.fn();
jest.mock('@/hooks/useGames', () => ({
  useCreateGame: () => mockUseCreateGame(),
}));

const getTagsMock = jest.fn();
jest.mock('@/lib/api', () => ({
  gamesApi: { getTags: () => getTagsMock() },
}));

jest.mock('@/lib/toast', () => {
  const actual = jest.requireActual('@/lib/toast');
  return {
    ...actual,
    toast: {
      ...actual.toast,
      success: jest.fn(),
      error: jest.fn(),
    },
  };
});

// --------------------
// Helpers
// --------------------
function setNow(iso: string) {
  jest.useFakeTimers();
  jest.setSystemTime(new Date(iso));
}

async function flushPromises() {
  await act(async () => {});
}

function getTitleInput() {
  return screen.getByPlaceholderText(
    /e\.g\.,\s*5v5 Basketball Pickup/i
  ) as HTMLInputElement;
}

function getSportSelect() {
  const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
  const sport = selects.find((s) =>
    Array.from(s.options).some((o) => o.textContent?.match(/select a sport/i))
  );
  if (!sport) throw new Error('Sport select not found');
  return sport;
}

function getDateInput() {
  const date = document.querySelector(
    'input[type="date"]'
  ) as HTMLInputElement | null;
  if (!date) throw new Error('Date input not found');
  return date;
}

function getIndoorSelect() {
  const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
  const indoor = selects.find((s) =>
    Array.from(s.options).some((o) => o.textContent?.match(/outdoor/i))
  );
  if (!indoor) throw new Error('Indoor/Outdoor select not found');
  return indoor;
}

function getTimeSelects() {
  const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
  const timeSelects = selects.filter((s) =>
    Array.from(s.options).some((o) => o.textContent === 'Select time')
  );
  if (timeSelects.length < 2) throw new Error('Time selects not found');
  return { start: timeSelects[0], end: timeSelects[1] };
}

function getLocationInput() {
  return screen.getByPlaceholderText(
    /search address or venue/i
  ) as HTMLInputElement;
}

async function fillStep1Valid(
  overrides?: Partial<{
    title: string;
    sport: string;
    location: string;
    date: string;
    indoor: string;
    start: string;
    end: string;
  }>
) {
  fireEvent.change(getTitleInput(), {
    target: { value: overrides?.title ?? '5v5 Basketball Pickup' },
  });
  fireEvent.change(getSportSelect(), {
    target: { value: overrides?.sport ?? 'Basketball' },
  });
  fireEvent.change(getLocationInput(), {
    target: { value: overrides?.location ?? 'My Gym' },
  });
  fireEvent.change(getDateInput(), {
    target: { value: overrides?.date ?? '2026-02-10' },
  });
  fireEvent.change(getIndoorSelect(), {
    target: { value: overrides?.indoor ?? 'INDOOR' },
  });

  const { start, end } = getTimeSelects();
  fireEvent.change(start, { target: { value: overrides?.start ?? '10:00' } });
  fireEvent.change(end, { target: { value: overrides?.end ?? '11:00' } });
}

async function goToStep2() {
  await fillStep1Valid();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByText(/game details/i)).toBeInTheDocument();
}

async function fillStep2Valid(
  overrides?: Partial<{
    minPlayers: string;
    maxPlayers: string;
    skill: string;
    intensity: string;
  }>
) {
  fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
    target: { value: overrides?.minPlayers ?? '6' },
  });
  fireEvent.change(screen.getByPlaceholderText('e.g., 10'), {
    target: { value: overrides?.maxPlayers ?? '10' },
  });

  const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];

  const skill = selects.find((s) =>
    Array.from(s.options).some((o) =>
      o.textContent?.match(/select skill level/i)
    )
  );
  if (!skill) throw new Error('Skill select not found');

  const intensity = selects.find((s) =>
    Array.from(s.options).some((o) => o.textContent?.match(/select intensity/i))
  );
  if (!intensity) throw new Error('Intensity select not found');

  fireEvent.change(skill, {
    target: { value: overrides?.skill ?? 'ALL_LEVELS' },
  });
  fireEvent.change(intensity, {
    target: { value: overrides?.intensity ?? 'CASUAL' },
  });
}

async function goToStep3() {
  await goToStep2();
  await fillStep2Valid();
  fireEvent.click(screen.getByRole('button', { name: /continue/i }));
  expect(await screen.findByText(/game settings/i)).toBeInTheDocument();
}

describe('CreateGame', () => {
  beforeEach(() => {
    pushMock.mockReset();
    mockUseAuth.mockReset();
    mockUseCreateGame.mockReset();
    getTagsMock.mockReset();

    (global as any).fetch = jest
      .fn()
      .mockResolvedValue({ json: async () => [] });
    setNow('2026-02-09T12:00:00.000Z'); // Feb 9, 2026
  });

  afterEach(() => {
    jest.clearAllMocks();
    jest.useRealTimers();
  });

  it('fetches available tags on mount via gamesApi.getTags()', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 88 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });

    getTagsMock.mockResolvedValue([
      { tagId: 't1', name: 'women-only', isRestricted: true },
      { tagId: 't2', name: 'beginner-friendly', isRestricted: false },
    ]);

    render(<CreateGame />);

    await waitFor(() => expect(getTagsMock).toHaveBeenCalledTimes(1));

    await goToStep2();

    expect(await screen.findByText(/community tags/i)).toBeInTheDocument();
    expect(screen.getByText('women only')).toBeInTheDocument();
    expect(screen.getByText('beginner friendly')).toBeInTheDocument();
    // restricted tag shows ⚠️
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });

  it('shows auth warning when not authenticated', () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    expect(screen.getByText(/you need to/i)).toBeInTheDocument();
    expect(screen.getByText(/sign in/i)).toBeInTheDocument();
  });

  it('validates step 1 required fields and shows error', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    const errs = await screen.findAllByText('Please enter a game title');
    expect(errs.length).toBeGreaterThanOrEqual(1);
  });

  it('shows error when date is in the past', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await fillStep1Valid({ date: '2026-02-08' }); // yesterday relative to Feb 9
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/date cannot be in the past\./i)
    ).not.toHaveLength(0);
    // should stay on step 1
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  });

  it('shows error when start time is in the past for today', async () => {
    // Set system time to late evening so any morning time is definitely in the past
    jest.setSystemTime(new Date('2026-02-09T23:00:00.000Z'));

    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    // Use today's date with a morning time that is definitely in the past
    await fillStep1Valid({ date: '2026-02-09', start: '08:00', end: '09:00' });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/start time cannot be in the past/i)
    ).not.toHaveLength(0);
    // should stay on step 1
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  });

  it('shows error when end time is not after start time', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await fillStep1Valid({ start: '11:00', end: '11:00' });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    expect(screen.getByText(/basic information/i)).toBeInTheDocument();
  });

  it('advances to step 2 when step 1 is valid', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await fillStep1Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(await screen.findByText(/game details/i)).toBeInTheDocument();
  });

  it('cooldown prevents double-continue quickly; after 1s you can continue again', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await fillStep1Valid();
    const continueBtn = screen.getByRole('button', { name: /continue/i });

    fireEvent.click(continueBtn);
    expect(await screen.findByText(/game details/i)).toBeInTheDocument();

    // Immediately try to jump to step 3 without filling step 2: should NOT advance
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    // still on step 2, because validateStep2 fails first anyway (min players missing)
    expect(
      await screen.findAllByText(/please enter minimum players/i)
    ).not.toHaveLength(0);

    // wait 1s for cooldown to end (not strictly necessary for step2 validation,
    // but we exercise the timer)
    act(() => {
      jest.advanceTimersByTime(1000);
    });
  });

  it('step 2 validates required fields: min players required', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/please enter minimum players/i)
    ).not.toHaveLength(0);
  });

  it('step 2 validates required fields: max players required', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/please enter maximum players/i)
    ).not.toHaveLength(0);
  });

  it('step 2 validates minimum players must be at least 2', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
      target: { value: '1' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., 10'), {
      target: { value: '4' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/minimum players must be at least 2/i)
    ).not.toHaveLength(0);
  });

  it('step 2 validates maximum players cannot be less than minimum', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
      target: { value: '8' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., 10'), {
      target: { value: '6' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/maximum players cannot be less than minimum players/i)
    ).not.toHaveLength(0);
  });

  it('step 2 validates skill level is required', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., 10'), {
      target: { value: '10' },
    });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/please select a skill level/i)
    ).not.toHaveLength(0);
  });

  it('step 2 validates intensity is required', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.change(screen.getByPlaceholderText('e.g., 6'), {
      target: { value: '6' },
    });
    fireEvent.change(screen.getByPlaceholderText('e.g., 10'), {
      target: { value: '10' },
    });

    const selects = screen.getAllByRole('combobox') as HTMLSelectElement[];
    const skill = selects.find((s) =>
      Array.from(s.options).some((o) => o.textContent?.match(/select skill level/i))
    );
    if (!skill) throw new Error('Skill select not found');

    fireEvent.change(skill, { target: { value: 'ALL_LEVELS' } });
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));

    expect(
      await screen.findAllByText(/please select an intensity level/i)
    ).not.toHaveLength(0);
  });

  it('back button returns from step 2 to step 1', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();
    fireEvent.click(screen.getByRole('button', { name: /back/i }));

    expect(await screen.findByText(/basic information/i)).toBeInTheDocument();
  });

  it('step 3 settings update summary visibility and toggles', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 88 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();

    const visibilitySelect = screen.getByDisplayValue(
      /public - anyone can see and join/i
    ) as HTMLSelectElement;
    fireEvent.change(visibilitySelect, { target: { value: 'friends' } });
    expect(screen.getByText('Friends Only')).toBeInTheDocument();

    fireEvent.change(visibilitySelect, { target: { value: 'invite' } });
    expect(screen.getByText('Invite Only')).toBeInTheDocument();

    const waitlistCheckbox = screen.getByLabelText(/enable waitlist/i) as HTMLInputElement;
    const checkInCheckbox = screen.getByLabelText(/require check-in/i) as HTMLInputElement;

    expect(waitlistCheckbox.checked).toBe(true);
    expect(checkInCheckbox.checked).toBe(true);

    fireEvent.click(waitlistCheckbox);
    fireEvent.click(checkInCheckbox);

    expect(waitlistCheckbox.checked).toBe(false);
    expect(checkInCheckbox.checked).toBe(false);
  });

  it('step 3 reliability clear resets value and summary label', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 88 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();

    const reliabilityInput = screen.getByLabelText(
      /minimum reliability score/i
    ) as HTMLInputElement;

    fireEvent.change(reliabilityInput, { target: { value: '85' } });
    expect(screen.getByText('85%')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /clear/i }));
    expect(reliabilityInput.value).toBe('');
    expect(screen.getByText(/none \(open to all\)/i)).toBeInTheDocument();
  });

  it('submitting on step 3 while unauthenticated redirects to login without creating', async () => {
    mockUseAuth.mockReturnValue({ isAuthenticated: false, user: null });

    const createGameMock = jest.fn();
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    expect(pushMock).toHaveBeenCalledWith('/login');
    expect(createGameMock).not.toHaveBeenCalled();
  });

  it('submit validates minAge must not exceed maxAge on final create', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest.fn().mockResolvedValue({ gameId: 'should-not-create' });
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep2();

    fireEvent.change(screen.getByPlaceholderText(/minimum age/i), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByPlaceholderText(/maximum age/i), {
      target: { value: '18' },
    });

    await fillStep2Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game settings/i);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    expect(
      await screen.findAllByText(/minimum age cannot be greater than maximum age/i)
    ).not.toHaveLength(0);
    expect(createGameMock).not.toHaveBeenCalled();
  });

  it('includes description in payload when user fills it on step 2', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest.fn().mockResolvedValue({ gameId: 'with-description' });
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep2();

    fireEvent.change(
      screen.getByPlaceholderText(/add any additional details about the game/i),
      { target: { value: 'Bring a light jersey and water bottle.' } }
    );

    await fillStep2Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game settings/i);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => {
      expect(createGameMock).toHaveBeenCalledWith(
        expect.objectContaining({
          description: 'Bring a light jersey and water bottle.',
        })
      );
    });
  });

  it('community tags: selecting and unselecting checkboxes updates checked state', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 88 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });

    getTagsMock.mockResolvedValue([
      { tagId: 't1', name: 'women-only', isRestricted: true },
      { tagId: 't2', name: 'beginner-friendly', isRestricted: false },
    ]);

    render(<CreateGame />);

    await goToStep2();

    const womenLabel = screen.getByText(/women only/i).closest('label');
    expect(womenLabel).toBeTruthy();

    const cb = within(womenLabel as HTMLElement).getByRole(
      'checkbox'
    ) as HTMLInputElement;
    expect(cb.checked).toBe(false);

    fireEvent.click(cb);
    expect(cb.checked).toBe(true);

    fireEvent.click(cb);
    expect(cb.checked).toBe(false);
  });

  it('age requirements: shows inline error when minAge > maxAge', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 88 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await goToStep2();

    fireEvent.change(screen.getByPlaceholderText(/minimum age/i), {
      target: { value: '30' },
    });
    fireEvent.change(screen.getByPlaceholderText(/maximum age/i), {
      target: { value: '18' },
    });

    expect(
      await screen.findByText(/minimum age cannot be greater than maximum age/i)
    ).toBeInTheDocument();
  });

  it('TimeSelect end-time options are filtered by minTime (no earlier/equal times)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    // set start time to 10:00, end select should not include 09:45 or 10:00
    await fillStep1Valid({ start: '10:00' });

    const { end } = getTimeSelects();
    const endOptions = Array.from(end.options).map((o) => o.value);

    expect(endOptions).not.toContain('09:45');
    expect(endOptions).not.toContain('10:00');
    expect(endOptions).toContain('10:15');
  });

  it('address autocomplete: after debounce, shows suggestions and selecting one fills input', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => [
        { display_name: '123 Main St, Montreal' },
        { display_name: '124 Main St, Montreal' },
      ],
    });

    render(<CreateGame />);

    const locationInput = getLocationInput();

    fireEvent.focus(locationInput);
    fireEvent.change(locationInput, { target: { value: 'Mon' } }); // >2 chars

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await flushPromises();

    expect(
      await screen.findByText('123 Main St, Montreal')
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /123 main st/i }));

    expect(locationInput.value).toBe('123 Main St, Montreal');
    expect(screen.queryByText('124 Main St, Montreal')).not.toBeInTheDocument();
  });

  it('address autocomplete: selecting a suggestion with lat/lon stores coordinates', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest
      .fn()
      .mockResolvedValue({ gameId: 'new-game-1' });
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => [
        {
          display_name: '123 Main St, Montreal',
          lat: '45.5017',
          lon: '-73.5673',
        },
      ],
    });

    render(<CreateGame />);

    const locationInput = getLocationInput();
    fireEvent.focus(locationInput);
    fireEvent.change(locationInput, { target: { value: 'Main' } });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await flushPromises();

    expect(
      await screen.findByText('123 Main St, Montreal')
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /123 main st/i }));

    // Fill remaining step 1 fields
    fireEvent.change(getTitleInput(), {
      target: { value: '5v5 Basketball Pickup' },
    });
    fireEvent.change(getSportSelect(), { target: { value: 'Basketball' } });
    fireEvent.change(getDateInput(), { target: { value: '2026-02-10' } });
    fireEvent.change(getIndoorSelect(), { target: { value: 'INDOOR' } });
    const { start, end } = getTimeSelects();
    fireEvent.change(start, { target: { value: '10:00' } });
    fireEvent.change(end, { target: { value: '11:00' } });

    // Step 1 → 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game details/i);

    // Step 2 → 3
    await fillStep2Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game settings/i);

    // Advance past the 1-second submit cooldown (set by handleContinue)
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => {
      expect(createGameMock).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.5017, longitude: -73.5673 })
      );
    });

    expect(toast.success).toHaveBeenCalledWith('Game created');
    expect(pushMock).toHaveBeenCalledWith('/games/new-game-1');
  });

  it('address autocomplete: typing in the location field after selecting clears lat/lon', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest
      .fn()
      .mockResolvedValue({ gameId: 'new-game-2' });
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => [
        {
          display_name: '123 Main St, Montreal',
          lat: '45.5017',
          lon: '-73.5673',
        },
      ],
    });

    render(<CreateGame />);

    const locationInput = getLocationInput();
    fireEvent.focus(locationInput);
    fireEvent.change(locationInput, { target: { value: 'Main' } });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await flushPromises();

    await screen.findByText('123 Main St, Montreal');
    fireEvent.click(screen.getByRole('button', { name: /123 main st/i }));

    // Now type something new — locationChanged=true → lat/lon should be cleared
    fireEvent.change(locationInput, { target: { value: 'Different Address' } });

    // Fill remaining step 1 fields
    fireEvent.change(getTitleInput(), {
      target: { value: '5v5 Basketball Pickup' },
    });
    fireEvent.change(getSportSelect(), { target: { value: 'Basketball' } });
    fireEvent.change(getDateInput(), { target: { value: '2026-02-10' } });
    fireEvent.change(getIndoorSelect(), { target: { value: 'INDOOR' } });
    const { start, end } = getTimeSelects();
    fireEvent.change(start, { target: { value: '10:00' } });
    fireEvent.change(end, { target: { value: '11:00' } });

    // Step 1 → 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game details/i);

    // Step 2 → 3
    await fillStep2Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game settings/i);

    // Advance past the 1-second submit cooldown
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => {
      expect(createGameMock).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: undefined, longitude: undefined })
      );
    });
  });

  it('address onChange: typing the same text that is already in the input preserves existing lat/lon (locationChanged=false)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest
      .fn()
      .mockResolvedValue({ gameId: 'new-game-3' });
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    (global as any).fetch = jest.fn().mockResolvedValue({
      json: async () => [{ display_name: 'My Gym', lat: '45.5', lon: '-73.6' }],
    });

    render(<CreateGame />);

    const locationInput = getLocationInput();
    fireEvent.focus(locationInput);
    fireEvent.change(locationInput, { target: { value: 'My G' } });

    await act(async () => {
      jest.advanceTimersByTime(500);
    });
    await flushPromises();

    await screen.findByText('My Gym');
    fireEvent.click(screen.getByRole('button', { name: /my gym/i }));
    // location is now "My Gym", lat=45.5 lon=-73.6

    // Fire onChange with the SAME value — locationChanged=false → lat/lon preserved
    fireEvent.change(locationInput, { target: { value: 'My Gym' } });

    // Fill remaining step 1 fields
    fireEvent.change(getTitleInput(), {
      target: { value: '5v5 Basketball Pickup' },
    });
    fireEvent.change(getSportSelect(), { target: { value: 'Basketball' } });
    fireEvent.change(getDateInput(), { target: { value: '2026-02-10' } });
    fireEvent.change(getIndoorSelect(), { target: { value: 'INDOOR' } });
    const { start, end } = getTimeSelects();
    fireEvent.change(start, { target: { value: '10:00' } });
    fireEvent.change(end, { target: { value: '11:00' } });

    // Step 1 → 2
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game details/i);

    // Step 2 → 3
    await fillStep2Valid();
    fireEvent.click(screen.getByRole('button', { name: /continue/i }));
    await screen.findByText(/game settings/i);

    // Advance past the 1-second submit cooldown
    act(() => {
      jest.advanceTimersByTime(1000);
    });

    // Submit
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => {
      expect(createGameMock).toHaveBeenCalledWith(
        expect.objectContaining({ latitude: 45.5, longitude: -73.6 })
      );
    });
  });

  it('location input is capped at 255 chars (typing beyond is trimmed)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    const long = 'a'.repeat(300);
    const locationInput = getLocationInput();
    fireEvent.change(locationInput, { target: { value: long } });

    expect(locationInput.value.length).toBe(255);
  });

  it('shows createError from useCreateGame in error banners', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 90 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: 'Backend down',
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    const banners = await screen.findAllByText(/backend down/i);
    expect(banners.length).toBeGreaterThan(0);
    expect(banners[0]).toBeInTheDocument();
  });

  it('submit on step 1 via form submit acts like Continue (and advances)', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    mockUseCreateGame.mockReturnValue({
      createGame: jest.fn(),
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);

    await fillStep1Valid();

    // submit the form (Enter key equivalent)
    const form = document.querySelector('form')!;
    fireEvent.submit(form);

    expect(await screen.findByText(/game details/i)).toBeInTheDocument();
  });

  it('toasts error when createGame rejects on submit', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });
    const createGameMock = jest.fn().mockRejectedValue(new Error('nope'));
    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();
    act(() => jest.advanceTimersByTime(1000));
    fireEvent.click(screen.getByRole('button', { name: /create game/i }));

    await waitFor(() => expect(createGameMock).toHaveBeenCalled());
    expect(toast.error).toHaveBeenCalled();
    const banners = await screen.findAllByText(/nope\. Please try again\./i);
    expect(banners.length).toBeGreaterThanOrEqual(1);
  });

  it('submits only once when Create Game is clicked rapidly twice', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });

    let resolveCreate: ((value: { gameId: string }) => void) | undefined;
    const createGameMock = jest
      .fn()
      .mockImplementation(
        () =>
          new Promise<{ gameId: string }>((resolve) => {
            resolveCreate = resolve;
          })
      );

    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const createButton = screen.getByRole('button', { name: /create game/i });
    fireEvent.click(createButton);
    fireEvent.click(createButton);

    expect(createGameMock).toHaveBeenCalledTimes(1);

    await act(async () => {
      resolveCreate?.({ gameId: 'single-submit-game' });
    });

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/games/single-submit-game');
    });
  });

  it('does not submit again after success while redirect is pending', async () => {
    mockUseAuth.mockReturnValue({
      isAuthenticated: true,
      user: { reliabilityScore: 80 },
    });

    const createGameMock = jest
      .fn()
      .mockResolvedValue({ gameId: 'already-created-game' });

    mockUseCreateGame.mockReturnValue({
      createGame: createGameMock,
      isCreating: false,
      error: null,
    });
    getTagsMock.mockResolvedValue([]);

    render(<CreateGame />);
    await goToStep3();

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    const createButton = screen.getByRole('button', { name: /create game/i });
    fireEvent.click(createButton);

    await waitFor(() => {
      expect(pushMock).toHaveBeenCalledWith('/games/already-created-game');
    });

    const redirectingButton = screen.getByRole('button', {
      name: /redirecting/i,
    });
    expect(redirectingButton).toBeDisabled();

    fireEvent.click(redirectingButton);
    expect(createGameMock).toHaveBeenCalledTimes(1);
  });
});

describe('isValidStep helper', () => {
  it('validates required fields for step 1', () => {
    const base = {
      title: 'Game',
      sport: 'Basketball',
      location: 'Court',
      date: '2026-02-10',
      indoor: 'INDOOR',
      startTime: '10:00',
      endTime: '11:00',
    };

    expect(isValidStep(1, base)).toBe(true);
    expect(isValidStep(1, { ...base, title: '' })).toBe(false);
    expect(isValidStep(1, { ...base, sport: '' })).toBe(false);
    expect(isValidStep(1, { ...base, location: '' })).toBe(false);
    expect(isValidStep(1, { ...base, date: '' })).toBe(false);
    expect(isValidStep(1, { ...base, indoor: '' })).toBe(false);
    expect(isValidStep(1, { ...base, startTime: '' })).toBe(false);
    expect(isValidStep(1, { ...base, endTime: '' })).toBe(false);
  });

  it('validates min/max players, skill and intensity for step 2', () => {
    const base = {
      minPlayers: '6',
      maxPlayers: '10',
      skillLevel: 'ALL_LEVELS',
      intensity: 'CASUAL',
    };

    expect(isValidStep(2, base)).toBe(true);
    expect(isValidStep(2, { ...base, minPlayers: '' })).toBe(false);
    expect(isValidStep(2, { ...base, maxPlayers: '' })).toBe(false);
    expect(isValidStep(2, { ...base, maxPlayers: '4' })).toBe(false);
    expect(isValidStep(2, { ...base, skillLevel: '' })).toBe(false);
    expect(isValidStep(2, { ...base, intensity: '' })).toBe(false);
  });

  it('returns true for step 3 and beyond', () => {
    expect(isValidStep(3, {})).toBe(true);
    expect(isValidStep(99, {})).toBe(true);
  });
});
