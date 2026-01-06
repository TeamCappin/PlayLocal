import { useRouter } from 'next/navigation';
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { INTENSITY_OPTIONS, AVAILABILITY_OPTIONS } from '@/lib/constants';



export const RegisterPage: React.FC = () => {
    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [displayName, setDisplayName] = useState('');
    const [ageConfirmed, setAgeConfirmed] = useState(false);
    const [eulaAccepted, setEulaAccepted] = useState(false);
    const [intensity, setIntensity] = useState('');
    const [availability, setAvailability] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const { register, user, isLoading: authLoading } = useAuth();
    const navigate = useRouter();

    // Redirect authenticated users to discover page
    useEffect(() => {
        if (!authLoading && user) {
            navigate.push('/discover');
        }
    }, [user, authLoading, navigate]);

    const toggleAvailability = (id: string) => {
        setAvailability(prev =>
            prev.includes(id) ? prev.filter(a => a !== id) : [...prev, id]
        );
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!ageConfirmed) {
            setError('You must confirm you are at least 13 years old');
            return;
        }

        if (!eulaAccepted) {
            setError('You must accept the Terms of Service and Privacy Policy');
            return;
        }

        setStep(2);
    };

    const handleStep2Submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!intensity) {
            setError('Please select your play intensity');
            return;
        }

        if (availability.length === 0) {
            setError('Please select at least one availability option');
            return;
        }

        setIsLoading(true);

        try {
            await register(email, password, displayName, ageConfirmed, eulaAccepted);
            // TODO: Save intensity and availability to profile via API
            navigate.push('/discover');
        } catch (err: any) {
            setError(err.message || 'Registration failed');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
            <div className="max-w-md w-full">
                {/* Progress indicator */}
                <div className="flex items-center justify-center mb-8 gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 1 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>1</div>
                    <div className={`w-16 h-1 ${step >= 2 ? 'bg-emerald-600' : 'bg-gray-200'}`}></div>
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${step >= 2 ? 'bg-emerald-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</div>
                </div>

                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {step === 1 ? (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Create Account</h1>
                                <p className="mt-2 text-gray-600">Join the PlayLocal community</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleStep1Submit} className="space-y-6">
                                <div>
                                    <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Display Name
                                    </label>
                                    <input
                                        id="displayName"
                                        type="text"
                                        required
                                        value={displayName}
                                        onChange={(e) => setDisplayName(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Your name"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                                        Email
                                    </label>
                                    <input
                                        id="email"
                                        type="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="you@example.com"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                                        Password
                                    </label>
                                    <input
                                        id="password"
                                        type="password"
                                        required
                                        minLength={8}
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500"
                                        placeholder="Min. 8 characters"
                                    />
                                </div>

                                <div className="space-y-4 pt-4">
                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={ageConfirmed}
                                            onChange={(e) => setAgeConfirmed(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            I confirm that I am at least <strong>13 years old</strong>
                                        </span>
                                    </label>

                                    <label className="flex items-start gap-3 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={eulaAccepted}
                                            onChange={(e) => setEulaAccepted(e.target.checked)}
                                            className="mt-1 w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            I agree to the{' '}
                                            <a href="/terms" className="text-emerald-600 hover:underline">Terms of Service</a>
                                            {' '}and{' '}
                                            <a href="/privacy" className="text-emerald-600 hover:underline">Privacy Policy</a>
                                        </span>
                                    </label>
                                </div>

                                <button
                                    type="submit"
                                    className="w-full py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold"
                                >
                                    Continue
                                </button>
                            </form>
                        </>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-gray-900">Tell Us About You</h1>
                                <p className="mt-2 text-gray-600">Help us match you with the right games</p>
                            </div>

                            {error && (
                                <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                                    {error}
                                </div>
                            )}

                            <form onSubmit={handleStep2Submit} className="space-y-6">
                                {/* Intensity Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Self-Rated Intensity <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {INTENSITY_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => setIntensity(option.id)}
                                                    className={`p-4 rounded-xl border-2 transition-all text-center ${intensity === option.id
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Icon className={`w-6 h-6 mx-auto mb-2 ${intensity === option.id ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                    <div className={`font-medium ${intensity === option.id ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </div>
                                                    <div className="text-xs text-gray-500 mt-1">{option.description}</div>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">This helps other players know what to expect when playing with you</p>
                                </div>

                                {/* Availability Selection */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Availability <span className="text-red-500">*</span>
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {AVAILABILITY_OPTIONS.map((option) => {
                                            const Icon = option.icon;
                                            return (
                                                <button
                                                    key={option.id}
                                                    type="button"
                                                    onClick={() => toggleAvailability(option.id)}
                                                    className={`p-3 rounded-xl border-2 transition-all flex items-center gap-3 ${availability.includes(option.id)
                                                        ? 'border-emerald-500 bg-emerald-50'
                                                        : 'border-gray-200 hover:border-gray-300'
                                                        }`}
                                                >
                                                    <Icon className={`w-5 h-5 ${availability.includes(option.id) ? 'text-emerald-600' : 'text-gray-400'}`} />
                                                    <span className={`font-medium ${availability.includes(option.id) ? 'text-emerald-700' : 'text-gray-700'}`}>
                                                        {option.label}
                                                    </span>
                                                </button>
                                            );
                                        })}
                                    </div>
                                    <p className="text-xs text-gray-500 mt-2">This helps other players know when you are available to play</p>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => setStep(1)}
                                        className="flex-1 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-semibold"
                                    >
                                        Back
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isLoading}
                                        className="flex-1 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors font-semibold disabled:opacity-50"
                                    >
                                        {isLoading ? 'Creating account...' : 'Create Account'}
                                    </button>
                                </div>
                            </form>
                        </>
                    )}

                    <div className="mt-6 text-center">
                        <p className="text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-emerald-600 hover:text-emerald-700 font-medium">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

