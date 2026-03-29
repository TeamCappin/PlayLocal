import { useGoogleReCaptcha as originalUse } from 'react-google-recaptcha-v3';

const useFallback = () => ({ executeRecaptcha: undefined });
// Use the fallback if the environment variable is not defined, otherwise use the real hook.
// Since the environment variable never changes at runtime, this does not violate Rules of Hooks.
export const useGoogleReCaptcha = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ? originalUse : useFallback;
