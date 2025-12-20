"use client";

import { useTranslation } from "react-i18next";

export default function About() {
  const { t } = useTranslation();
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto px-6 py-12">
        {/* Header Section */}
        <div className="mb-12">
          <div className="inline-block mb-4">
            <span className="text-teal-600 font-semibold text-sm uppercase tracking-wide">
              About Us
            </span>
          </div>
          <h1 className="text-6xl font-bold text-slate-900 mb-6">
            {t("about.title")}
          </h1>
          <p className="text-2xl text-slate-600 max-w-3xl">{t("about.body")}</p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              OCR-Backed Documents
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Transform municipal sources into structured, verifiable project
              records with advanced OCR technology.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Market Intelligence
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Comprehensive market intelligence for Canadian real estate and
              infrastructure projects.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Quality Signals
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Advanced quality indicators and verification systems ensure data
              accuracy and reliability.
            </p>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 border border-slate-200 hover:shadow-lg transition-shadow">
            <div className="w-14 h-14 bg-teal-100 rounded-xl flex items-center justify-center mb-6">
              <svg
                className="w-7 h-7 text-teal-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-3">
              Secure Publishing
            </h3>
            <p className="text-slate-600 text-lg leading-relaxed">
              Customer-safe publishing with controlled access and data
              protection measures.
            </p>
          </div>
        </div>

        {/* Mission Statement */}
        <div className="bg-white rounded-2xl p-10 border border-slate-200">
          <h2 className="text-3xl font-bold text-slate-900 mb-6">
            Our Mission
          </h2>
          <div className="space-y-4 text-lg text-slate-600 leading-relaxed">
            <p>
              At Munera Intelligence, we&apos;re committed to revolutionizing
              how construction and infrastructure data is collected, processed,
              and delivered. Our PermitParser system provides unprecedented
              transparency and accessibility to municipal permit data across
              Canada.
            </p>
            <p>
              By leveraging cutting-edge OCR technology and AI-driven data
              extraction, we help businesses make informed decisions about real
              estate development, construction opportunities, and market trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
