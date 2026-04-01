import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import {
  MapPin,
  Clock,
  Users,
  TrendingUp,
  Calendar,
  Save,
  Eye,
  Plus,
  X,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { useCreateGame } from '@/hooks/useGames';
import { useAuth } from '@/context/AuthContext';
import { gamesApi, TagDto } from '@/lib/api';
import { getSportImage } from '@/constants/sportImages';
import { toast, getActionableErrorMessage } from '@/lib/toast';

function getVisibilityLabel(visibility: string): string {
  if (visibility === 'public') return 'Public';
  if (visibility === 'friends') return 'Friends Only';
  return 'Invite Only';
}

export function CreateGame() {
  const MAX_LOCATION_NAME_LENGTH = 255;
  const navigate = useRouter();
  const { isAuthenticated, user } = useAuth();
  const { createGame, isCreating, error: createError } = useCreateGame();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, boolean>>({});

  // Address Autocomplete State
  const [addressSuggestions, setAddressSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearchingAddress, setIsSearchingAddress] = useState(false);
  const [availableTags, setAvailableTags] = useState<TagDto[]>([]);
  const [formData, setFormData] = useState({
    title: '',
    sport: '',
    location: '',
    latitude: undefined as number | undefined,
    longitude: undefined as number | undefined,
    date: '',
    startTime: '',
    endTime: '',
    minPlayers: '',
    maxPlayers: '',
    skillLevel: '',
    intensity: '',
    indoor: '',
    allowWaitlist: true,
    requireCheckin: true,
    description: '',
    visibility: 'public',
    minReliabilityRequired: '',
    tagNames: [] as string[],
    minAge: '',
    maxAge: '',
  });

  const sports = [
    'Basketball',
    'Soccer',
    'Volleyball',
    'Tennis',
    'Badminton',
    'Ultimate Frisbee',
    'Flag Football',
    'Softball',
    'Baseball',
    'Pickleball',
    'Hockey',
  ];

  const [isSubmittingCooldown, setIsSubmittingCooldown] = useState(false);
  const createRequestInFlightRef = useRef(false);
  const createSucceededRef = useRef(false);
  const [hasCreateSucceeded, setHasCreateSucceeded] = useState(false);

  // US-4.2: Fetch available tags on mount
  useEffect(() => {
    gamesApi
      .getTags()
      .then(setAvailableTags)
      .catch((err) => console.error('Failed to load tags:', err));
  }, []);

  // Address search debounce
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (formData.location.length > 2 && showSuggestions) {
        setIsSearchingAddress(true);
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(formData.location)}`
          );
          const data = await response.json();
          setAddressSuggestions(data.slice(0, 5));
        } catch (e) {
          console.error('Address search failed', e);
        } finally {
          setIsSearchingAddress(false);
        }
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.location, showSuggestions]);

  const handleAddressSelect = (address: any) => {
    const selectedAddress = String(address.display_name || '').trim();
    const lat = address.lat ? parseFloat(address.lat) : undefined;
    const lon = address.lon ? parseFloat(address.lon) : undefined;
    setFormData({
      ...formData,
      location: selectedAddress.slice(0, MAX_LOCATION_NAME_LENGTH),
      latitude: lat,
      longitude: lon,
    });
    setShowSuggestions(false);
  };

  const validateStep1RequiredFields = (): boolean => {
    if (!formData.title) {
      setError('Please enter a game title');
      return false;
    }
    if (!formData.sport) {
      setError('Please select a sport');
      return false;
    }
    if (!formData.location) {
      setError('Please enter a location');
      return false;
    }
    const lat = formData.latitude;
    const lon = formData.longitude;
    if (
      lat == null ||
      lon == null ||
      !Number.isFinite(lat) ||
      !Number.isFinite(lon)
    ) {
      setError(
        'Please select a valid location from the suggestions list'
      );
      return false;
    }
    if (!formData.date) {
      setError('Please select a date');
      return false;
    }
    if (!formData.indoor) {
      setError('Please select location type (Indoor/Outdoor)');
      return false;
    }
    if (!formData.startTime) {
      setError('Please select a start time');
      return false;
    }
    if (!formData.endTime) {
      setError('Please select an end time');
      return false;
    }
    return true;
  };

  const validateStep1DateAndTime = (): boolean => {
    const selectedDate = new Date(formData.date + 'T00:00:00');
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate < today) {
      setError('Date cannot be in the past.');
      return false;
    }
    const start = new Date(`${formData.date}T${formData.startTime}:00`);
    if (start <= new Date()) {
      setError('Start time cannot be in the past. Please choose a future time.');
      return false;
    }
    const end = new Date(`${formData.date}T${formData.endTime}:00`);
    if (end <= start) {
      setError('End time must be after start time.');
      return false;
    }
    return true;
  };

  const validateStep1 = (): boolean => {
    return validateStep1RequiredFields() && validateStep1DateAndTime();
  };

  const validateStep2 = (): boolean => {
    const errors: Record<string, boolean> = {};
    
    if (!formData.minPlayers) {
      setError('Please enter minimum players');
      errors.minPlayers = true;
      setFieldErrors(errors);
      return false;
    }
    if (!formData.maxPlayers) {
      setError('Please enter maximum players');
      errors.maxPlayers = true;
      setFieldErrors(errors);
      return false;
    }
    const min = Number.parseInt(formData.minPlayers, 10);
    const max = Number.parseInt(formData.maxPlayers, 10);
    if (Number.isNaN(min) || Number.isNaN(max)) {
      setError('Player counts must be numbers');
      errors.minPlayers = true;
      errors.maxPlayers = true;
      setFieldErrors(errors);
      return false;
    }
    if (min < 2) {
      setError('Minimum players must be at least 2');
      errors.minPlayers = true;
      setFieldErrors(errors);
      return false;
    }
    if (max < min) {
      setError('Maximum players cannot be less than minimum players');
      errors.maxPlayers = true;
      setFieldErrors(errors);
      return false;
    }
    if (!formData.skillLevel) {
      setError('Please select a skill level');
      errors.skillLevel = true;
      setFieldErrors(errors);
      return false;
    }
    if (!formData.intensity) {
      setError('Please select an intensity level');
      errors.intensity = true;
      setFieldErrors(errors);
      return false;
    }
    setFieldErrors({});
    return true;
  };

  const validateStep = (currentStep: number): boolean => {
    setError(null);
    setFieldErrors({});
    if (currentStep === 1) return validateStep1();
    if (currentStep === 2) return validateStep2();
    return true;
  };

  const handleContinue = () => {
    if (validateStep(step)) {
      setStep(step + 1);
      setError(null);
      // Set cooldown to prevent accidental double-click submission on next step
      setIsSubmittingCooldown(true);
      setTimeout(() => setIsSubmittingCooldown(false), 1000);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent submission during cooldown
    if (isSubmittingCooldown) {
      return;
    }

    setError(null);

    // If not on the last step, treat "Enter" or submit as "Continue"
    if (step < 3) {
      handleContinue();
      return;
    }

    // Ignore duplicate submits while a create request is already in flight.
    if (
      createRequestInFlightRef.current ||
      createSucceededRef.current ||
      isCreating
    ) {
      return;
    }

    if (!isAuthenticated) {
      navigate.push('/login');
      return;
    }

    const latSubmit = formData.latitude;
    const lonSubmit = formData.longitude;
    if (
      latSubmit == null ||
      lonSubmit == null ||
      !Number.isFinite(latSubmit) ||
      !Number.isFinite(lonSubmit)
    ) {
      setError(
        'Please go back to step 1 and choose a location from the suggestions list'
      );
      return;
    }

    // Validate age requirements if both are provided
    if (formData.minAge && formData.maxAge) {
      const min = Number.parseInt(formData.minAge, 10);
      const max = Number.parseInt(formData.maxAge, 10);
      if (min > max) {
        setError('Minimum age cannot be greater than maximum age');
        return;
      }
    }

    try {
      createRequestInFlightRef.current = true;

      // Combine date and time into ISO string
      const startDateTime = `${formData.date}T${formData.startTime}:00`;
      const endDateTime = formData.endTime
        ? `${formData.date}T${formData.endTime}:00`
        : undefined;

      const game = await createGame({
        title: formData.title,
        description: formData.description || undefined,
        sportName: formData.sport,
        locationName: formData.location
          .trim()
          .slice(0, MAX_LOCATION_NAME_LENGTH),
        city: 'Montreal', // Could be extracted from location search
        latitude: formData.latitude,
        longitude: formData.longitude,
        indoorOutdoor: formData.indoor, // Now sends INDOOR/OUTDOOR
        intensityBand: formData.intensity, // Now sends BEGINNER/CASUAL/COMPETITIVE
        skillBand: formData.skillLevel, // Now sends ALL_LEVELS/BEGINNER/INTERMEDIATE/ADVANCED
        minPlayers: Number.parseInt(formData.minPlayers, 10) || 2,
        maxPlayers: Number.parseInt(formData.maxPlayers, 10) || 20,
        allowWaitlist: formData.allowWaitlist,
        minReliabilityRequired: formData.minReliabilityRequired
          ? Number.parseFloat(formData.minReliabilityRequired)
          : undefined,
        startTime: new Date(startDateTime).toISOString(),
        endTime: endDateTime ? new Date(endDateTime).toISOString() : undefined,
        visibility: formData.visibility,
        tagNames: formData.tagNames.length > 0 ? formData.tagNames : undefined,
        minAge: formData.minAge
          ? Number.parseInt(formData.minAge, 10)
          : undefined,
        maxAge: formData.maxAge
          ? Number.parseInt(formData.maxAge, 10)
          : undefined,
      });

      createSucceededRef.current = true;
      setHasCreateSucceeded(true);
      toast.success('Game created');
      navigate.push(`/games/${game.gameId}`);
    } catch (err: any) {
      const errorMessage = getActionableErrorMessage(err, 'create game');
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      createRequestInFlightRef.current = false;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl text-gray-900 mb-2">Create a Game</h1>
          <p className="text-gray-600">
            Set up your pickup game and invite players
          </p>
        </div>

        {/* Error Alert */}
        {(error || createError) && (
          <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
            <span className="text-red-700 font-medium">{error || createError}</span>
          </div>
        )}

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <StepIndicator
              number={1}
              label="Basic Info"
              active={step === 1}
              completed={step > 1}
            />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div
                className={`h-full transition-all ${step > 1 ? 'bg-emerald-600' : 'bg-gray-200'}`}
                style={{ width: step > 1 ? '100%' : '0%' }}
              ></div>
            </div>
            <StepIndicator
              number={2}
              label="Details"
              active={step === 2}
              completed={step > 2}
            />
            <div className="flex-1 h-0.5 bg-gray-200 mx-4">
              <div
                className={`h-full transition-all ${step > 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}
                style={{ width: step > 2 ? '100%' : '0%' }}
              ></div>
            </div>
            <StepIndicator
              number={3}
              label="Settings"
              active={step === 3}
              completed={step > 3}
            />
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          {/* Error Display - Inside Form */}
          {(error || createError) && (
            <div className="mb-6 p-4 bg-red-50 border-2 border-red-500 rounded-lg flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <span className="text-red-700 font-medium">{error || createError}</span>
            </div>
          )}

          {/* Auth Warning */}
          {!isAuthenticated && (
            <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-700">
              You need to{' '}
              <a href="/login" className="font-medium underline">
                sign in
              </a>{' '}
              to create a game.
            </div>
          )}

          <div className="bg-white rounded-xl border border-gray-200 p-8 mb-6">
            {step === 1 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">
                  Basic Information
                </h2>

                <div>
                  <label htmlFor="title" className="block text-gray-700 mb-2">
                    Game Title *
                  </label>
                  <input
                    id = "title"
                    type="text"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    placeholder="e.g., 5v5 Basketball Pickup"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="sport" className="block text-gray-700 mb-2">Sport *</label>
                  <select
                    id = "sport"
                    value={formData.sport}
                    onChange={(e) =>
                      setFormData({ ...formData, sport: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                    required
                  >
                    <option value="">Select a sport</option>
                    {sports.map((sport) => (
                      <option key={sport} value={sport}>
                        {sport}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label htmlFor="location" className="block text-gray-700 mb-2">Location *</label>
                  <div className="relative mb-2">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                    <input
                      id = "location"
                      type="text"
                      value={formData.location}
                      onChange={(e) => {
                        const nextLocation = e.target.value.slice(
                          0,
                          MAX_LOCATION_NAME_LENGTH
                        );
                        setFormData((prev) => {
                          const locationChanged =
                            nextLocation !== prev.location;
                          return {
                            ...prev,
                            location: nextLocation,
                            latitude: locationChanged
                              ? undefined
                              : prev.latitude,
                            longitude: locationChanged
                              ? undefined
                              : prev.longitude,
                          };
                        });
                        setShowSuggestions(true);
                      }}
                      onFocus={() => setShowSuggestions(true)}
                      placeholder="Search address or venue..."
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      autoComplete="off"
                      required
                    />
                    {isSearchingAddress && (
                      <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <Loader2 className="w-4 h-4 text-emerald-600 animate-spin" />
                      </div>
                    )}

                    {/* Autocomplete Dropdown */}
                    {showSuggestions && addressSuggestions.length > 0 && (
                      <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {addressSuggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            type="button"
                            onClick={() => handleAddressSelect(suggestion)}
                            className="w-full text-left px-4 py-3 hover:bg-gray-50 flex items-start gap-2 border-b border-gray-100 last:border-0"
                          >
                            <MapPin className="w-4 h-4 text-gray-400 flex-shrink-0 mt-1" />
                            <span className="text-sm text-gray-700 truncate">
                              {suggestion.display_name}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="hidden text-gray-500 sm:block">
                      Enter precise location for players
                    </span>
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(formData.location)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      Search on Google Maps ↗
                    </a>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label htmlFor="date" className="block text-gray-700 mb-2">Date *</label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        id="date"
                        type="date"
                        value={formData.date}
                        onChange={(e) =>
                          setFormData({ ...formData, date: e.target.value })
                        }
                        className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="locationtype" className="block text-gray-700 mb-2">
                      Location Type *
                    </label>
                    <select
                      id="locationtype"
                      value={formData.indoor}
                      onChange={(e) =>
                        setFormData({ ...formData, indoor: e.target.value })
                      }
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      required
                    >
                      <option value="">Select type</option>
                      <option value="OUTDOOR">Outdoor</option>
                      <option value="INDOOR">Indoor</option>
                    </select>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Start Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <TimeSelect
                        value={formData.startTime}
                        onChange={(val) =>
                          setFormData({ ...formData, startTime: val })
                        }
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      End Time *
                    </label>
                    <div className="relative">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <TimeSelect
                        value={formData.endTime}
                        onChange={(val) =>
                          setFormData({ ...formData, endTime: val })
                        }
                        minTime={formData.startTime}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">Game Details</h2>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Minimum Players *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.minPlayers}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minPlayers: e.target.value,
                          })
                        }
                        placeholder="e.g., 6"
                        min="2"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                          fieldErrors.minPlayers
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 focus:border-emerald-500'
                        }`}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Maximum Players *
                    </label>
                    <div className="relative">
                      <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                      <input
                        type="number"
                        value={formData.maxPlayers}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            maxPlayers: e.target.value,
                          })
                        }
                        placeholder="e.g., 10"
                        min="2"
                        className={`w-full pl-12 pr-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                          fieldErrors.maxPlayers
                            ? 'border-red-500 bg-red-50'
                            : 'border-gray-300 focus:border-emerald-500'
                        }`}
                        required
                      />
                    </div>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Skill Level *
                    </label>
                    <select
                      value={formData.skillLevel}
                      onChange={(e) =>
                        setFormData({ ...formData, skillLevel: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.skillLevel
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      required
                    >
                      <option value="">Select skill level</option>
                      <option value="ALL_LEVELS">All Levels Welcome</option>
                      <option value="BEGINNER">Beginner-Friendly</option>
                      <option value="INTERMEDIATE">Intermediate</option>
                      <option value="ADVANCED">Advanced</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-gray-700 mb-2">
                      Intensity *
                    </label>
                    <select
                      value={formData.intensity}
                      onChange={(e) =>
                        setFormData({ ...formData, intensity: e.target.value })
                      }
                      className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-emerald-500 ${
                        fieldErrors.intensity
                          ? 'border-red-500 bg-red-50'
                          : 'border-gray-300 focus:border-emerald-500'
                      }`}
                      required
                    >
                      <option value="">Select intensity</option>
                      <option value="CASUAL">Casual & Social</option>
                      <option value="COMPETITIVE">Competitive</option>
                      <option value="BEGINNER">Beginner-Friendly</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    placeholder="Add any additional details about the game..."
                    rows={4}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  ></textarea>
                </div>

                {/* US-4.2: Community Tags */}
                {availableTags.length > 0 && (
                  <div>
                    <label className="block text-gray-700 mb-2">
                      Community Tags
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      {availableTags.map((tag) => (
                        <label
                          key={tag.tagId}
                          className="flex items-center gap-2 p-3 border border-gray-300 rounded-lg hover:bg-gray-50 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={formData.tagNames.includes(tag.name)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setFormData({
                                  ...formData,
                                  tagNames: [...formData.tagNames, tag.name],
                                });
                              } else {
                                setFormData({
                                  ...formData,
                                  tagNames: formData.tagNames.filter(
                                    (t) => t !== tag.name
                                  ),
                                });
                              }
                            }}
                            className="w-4 h-4 text-emerald-600"
                          />
                          <span className="text-sm capitalize">
                            {tag.name.replace('-', ' ')}
                            {tag.isRestricted && (
                              <span className="ml-1 text-xs text-red-600">
                                ⚠️
                              </span>
                            )}
                          </span>
                        </label>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600 mt-2">
                      Tags marked with ⚠️ require players to confirm eligibility
                      when joining
                    </p>
                  </div>
                )}

                {/* US-4.2: Age Requirements */}
                <div>
                  <label className="block text-gray-700 mb-2">
                    Age Requirements (Optional)
                  </label>
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <input
                        type="number"
                        value={formData.minAge}
                        onChange={(e) =>
                          setFormData({ ...formData, minAge: e.target.value })
                        }
                        placeholder="Minimum age (e.g., 18)"
                        min="13"
                        max="120"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                    <div>
                      <input
                        type="number"
                        value={formData.maxAge}
                        onChange={(e) =>
                          setFormData({ ...formData, maxAge: e.target.value })
                        }
                        placeholder="Maximum age (e.g., 65)"
                        min="13"
                        max="120"
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                    </div>
                  </div>
                  {formData.minAge &&
                    formData.maxAge &&
                    Number.parseInt(formData.minAge, 10) >
                      Number.parseInt(formData.maxAge, 10) && (
                      <p className="text-sm text-red-600 mt-2">
                        Minimum age cannot be greater than maximum age
                      </p>
                    )}
                </div>

                {/* Team Balancing Options */}
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <TrendingUp className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-emerald-900 mb-1">
                        Smart Team Balancing
                      </h4>
                      <p className="text-sm text-emerald-700 mb-3">
                        Automatically balance teams based on player skills and
                        positions
                      </p>
                      <select className="w-full px-3 py-2 border border-emerald-300 rounded-lg focus:ring-2 focus:ring-emerald-500 bg-white">
                        <option>Random Assignment</option>
                        <option>Captain&apos;s Pick</option>
                        <option>Smart Balancing (Recommended)</option>
                      </select>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-6">
                <h2 className="text-xl text-gray-900 mb-6">Game Settings</h2>

                <div>
                  <label className="block text-gray-700 mb-2">
                    Game Visibility
                  </label>
                  <select
                    value={formData.visibility}
                    onChange={(e) =>
                      setFormData({ ...formData, visibility: e.target.value })
                    }
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                  >
                    <option value="public">
                      Public - Anyone can see and join
                    </option>
                    <option value="friends">
                      Friends Only - Visible to friends
                    </option>
                    <option value="invite">
                      Invite Only - Only invited players
                    </option>
                  </select>
                </div>

                <div className="space-y-4">
                  <label htmlFor="Waitlist" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id = "Waitlist"
                      type="checkbox"
                      checked={formData.allowWaitlist}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          allowWaitlist: e.target.checked,
                        })
                      }
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-gray-900">Enable Waitlist</div>
                      <div className="text-sm text-gray-600">
                        Allow players to join a waitlist when the game is full
                      </div>
                    </div>
                  </label>

                  <label htmlFor="Check-In" className="flex items-start gap-3 cursor-pointer">
                    <input
                      id = "Check-In"
                      type="checkbox"
                      checked={formData.requireCheckin}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          requireCheckin: e.target.checked,
                        })
                      }
                      className="mt-1 w-5 h-5 text-emerald-600 border-gray-300 rounded focus:ring-emerald-500"
                    />
                    <div>
                      <div className="text-gray-900">Require Check-In</div>
                      <div className="text-sm text-gray-600">
                        Players must check in before the game starts
                      </div>
                    </div>
                  </label>
                </div>

                {/* Minimum Reliability Score */}
                <div>
                  <label
                    htmlFor="min-reliability-create"
                    className="block text-gray-700 mb-2"
                  >
                    Minimum Reliability Score (Optional)
                  </label>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <input
                        id="min-reliability-create"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.minReliabilityRequired}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            minReliabilityRequired: e.target.value,
                          })
                        }
                        placeholder="e.g., 85"
                        className="w-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                      />
                      <span className="text-gray-600">%</span>
                      {formData.minReliabilityRequired && (
                        <button
                          type="button"
                          onClick={() =>
                            setFormData({
                              ...formData,
                              minReliabilityRequired: '',
                            })
                          }
                          className="text-sm text-red-600 hover:text-red-700"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      Set a minimum reliability score to ensure only reliable
                      players can join. Players with a score below this
                      threshold will not be able to join the game.
                    </p>
                    {user && (
                      <p className="text-sm text-emerald-700">
                        Your reliability score:{' '}
                        <span className="font-semibold">
                          {user.reliabilityScore}%
                        </span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Summary Preview */}
                <div className="mt-8 p-6 bg-gray-50 rounded-lg border border-gray-200">
                  <h3 className="text-lg text-gray-900 mb-4">Game Summary</h3>
                  <div className="space-y-3">
                    <SummaryRow
                      label="Title"
                      value={formData.title || 'Not set'}
                    />
                    <SummaryRow
                      label="Sport"
                      value={formData.sport || 'Not set'}
                    />
                    <SummaryRow
                      label="Location"
                      value={formData.location || 'Not set'}
                    />
                    <SummaryRow
                      label="Date & Time"
                      value={
                        formData.date && formData.startTime
                          ? `${formData.date} at ${formData.startTime}`
                          : 'Not set'
                      }
                    />
                    <SummaryRow
                      label="Players"
                      value={
                        formData.minPlayers && formData.maxPlayers
                          ? `${formData.minPlayers}-${formData.maxPlayers}`
                          : 'Not set'
                      }
                    />
                    <SummaryRow
                      label="Skill Level"
                      value={formData.skillLevel || 'Not set'}
                    />
                    <SummaryRow
                      label="Intensity"
                      value={formData.intensity || 'Not set'}
                    />
                    <SummaryRow
                      label="Visibility"
                      value={getVisibilityLabel(formData.visibility)}
                    />
                    <SummaryRow
                      label="Skill Level"
                      value={formData.skillLevel || 'Not set'}
                    />
                    <SummaryRow
                      label="Intensity"
                      value={formData.intensity || 'Not set'}
                    />
                    <SummaryRow
                      label="Visibility"
                      value={getVisibilityLabel(formData.visibility)}
                    />
                    <SummaryRow
                      label="Min Reliability Required"
                      value={
                        formData.minReliabilityRequired
                          ? `${formData.minReliabilityRequired}%`
                          : 'None (Open to all)'
                      }
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between">
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep(step - 1)}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
            ) : (
              <div></div>
            )}

            <div className="flex gap-3">
              {step < 3 && (
                <button
                  type="button"
                  className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex items-center gap-2"
                >
                  <Save className="w-5 h-5" />
                  <span>Save Draft</span>
                </button>
              )}

              {step < 3 ? (
                <button
                  type="button"
                  onClick={handleContinue}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors"
                >
                  Continue
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={isCreating || hasCreateSucceeded}
                  className="px-6 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed transition-colors"
                >
                  {hasCreateSucceeded
                    ? 'Redirecting...'
                    : isCreating
                    ? 'Creating...'
                    : 'Create Game'}
                </button>
              )}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}

function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
          completed
            ? 'bg-emerald-600 text-white'
            : active
              ? 'bg-emerald-100 text-emerald-600 border-2 border-emerald-600'
              : 'bg-gray-200 text-gray-600'
        }`}
      >
        {completed ? '✓' : number}
      </div>
      <span
        className={`hidden sm:block ${
          active || completed ? 'text-gray-900' : 'text-gray-500'
        }`}
      >
        {label}
      </span>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-gray-600">{label}</span>
      <span className="text-gray-900">{value}</span>
    </div>
  );
}

// Time Select Component
function TimeSelect({
  value,
  onChange,
  minTime,
}: {
  value: string;
  onChange: (val: string) => void;
  minTime?: string;
}) {
  const times = [];
  for (let i = 0; i < 24; i++) {
    for (let j = 0; j < 60; j += 15) {
      const hour = i.toString().padStart(2, '0');
      const minute = j.toString().padStart(2, '0');
      times.push(`${hour}:${minute}`);
    }
  }

  const availableTimes = minTime ? times.filter((t) => t > minTime) : times;

  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 appearance-none bg-white"
      required
    >
      <option value="">Select time</option>
      {availableTimes.map((time) => (
        <option key={time} value={time}>
          {time}
        </option>
      ))}
    </select>
  );
}
