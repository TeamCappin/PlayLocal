"use client";

import { useState } from "react";
import type { FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/hooks/useAuth";
import { signupUser } from "@/services/authService";


export default function Signup() {
  const { t } = useTranslation();
  const { login } = useAuth();
  const router = useRouter();

  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [rePassword, setRePassword] = useState("");

  const onSubmit = async (e: FormEvent) => {
  e.preventDefault();
  if (password !== rePassword) {
    alert(t("auth.signup.mismatch"));
    return;
  }

  try {
    await signupUser({ firstname, lastname, email, password });
    alert("Account created successfully. Please log in.");
    router.push("/login");
  } catch (err: any) {
    alert("Signup failed: " + (err.response?.data?.detail || ""));
    console.error(err);
  }
};

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-700 via-teal-600 to-teal-500 flex items-center justify-center p-6">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-800/90 rounded-full mb-4">
            <svg
              className="w-8 h-8 text-teal-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"
              />
            </svg>
          </div>
          <h2 className="text-3xl font-bold text-white">Create Your Account</h2>
          <p className="text-gray-200 mt-2">
            Join PermitParser and start tracking projects
          </p>
        </div>

        <div className="bg-gray-800/90 backdrop-blur-sm rounded-lg p-8 text-white shadow-lg">
          <h1 className="text-2xl font-bold mb-6">{t("auth.signup.title")}</h1>

          <form onSubmit={onSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("auth.signup.firstName")}
                </label>
                <input
                  type="text"
                  value={firstname}
                  onChange={(e) => setFirstname(e.target.value)}
                  required
                  placeholder="John"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("auth.signup.lastName")}
                </label>
                <input
                  type="text"
                  value={lastname}
                  onChange={(e) => setLastname(e.target.value)}
                  required
                  placeholder="Doe"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">
                {t("auth.signup.email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="you@example.com"
                className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("auth.signup.password")}
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  {t("auth.signup.repeatPassword")}
                </label>
                <input
                  type="password"
                  value={rePassword}
                  onChange={(e) => setRePassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full px-4 py-3 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                />
              </div>
            </div>

            <div className="flex items-start">
              <input
                type="checkbox"
                required
                className="w-4 h-4 mt-1 text-teal-500 bg-gray-700 border-gray-600 rounded focus:ring-teal-500"
              />
              <label className="ml-2 text-sm text-gray-300">
                I agree to the{" "}
                {/* TODO: implement missing paages */}
                <Link href="/" className="text-teal-400 hover:text-teal-300">
                  Terms of Service
                </Link>{" "}
                and{" "}
                <Link href="/" className="text-teal-400 hover:text-teal-300">
                  Privacy Policy
                </Link>
              </label>
            </div>

            <button
              type="submit"
              className="w-full px-6 py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {t("auth.signup.submit")}
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M14 5l7 7m0 0l-7 7m7-7H3"
                />
              </svg>
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-700 text-center">
            <p className="text-gray-400">
              {t("auth.signup.haveAccount")}{" "}
              <Link
                href="/login"
                className="text-teal-400 hover:text-teal-300 font-semibold transition-colors"
              >
                {t("auth.signup.login")}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
