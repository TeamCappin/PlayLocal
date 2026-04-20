
'use client';

import { useEffect, useState } from 'react';
import { ShieldCheck, RefreshCw } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import {
	privacyPolicyApi,
	type PrivacyPolicyStatusResponse,
	} from '@/lib/api';
import { toast, getActionableErrorMessage } from '@/lib/toast';

const PRIVACY_POLICY_UPDATED_EVENT = 'playlocal-privacy-policy-updated';
const POLICY_UPDATE_ADMIN_EMAIL = 'playlocal.mgdfd@simplelogin.com';

export function PrivacyPolicy() {
	const { user, isAuthenticated } = useAuth();
	const [status, setStatus] = useState<PrivacyPolicyStatusResponse | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	useEffect(() => {
		let active = true;

		const loadStatus = async () => {
			try {
				const nextStatus = await privacyPolicyApi.getStatus();
				if (active) {
					setStatus(nextStatus);
				}
			} catch {
				if (active) {
					setStatus(null);
				}
			} finally {
				// no-op
			}
		};

		loadStatus();

		return () => {
			active = false;
		};
	}, []);

	const handleTriggerFakeUpdate = async () => {
		if (!user) {
			return;
		}

		setIsSubmitting(true);
		try {
			const updated = await privacyPolicyApi.triggerUpdate({
				triggeredByEmail: user.email,
			});
			setStatus(updated);
			window.dispatchEvent(new Event(PRIVACY_POLICY_UPDATED_EVENT));
		} catch (error) {
			toast.error(getActionableErrorMessage(error, 'update privacy policy'));
		} finally {
			setIsSubmitting(false);
		}
	};

	const canTriggerPolicyUpdate =
		isAuthenticated &&
		!!user?.email &&
		user.email.toLowerCase() === POLICY_UPDATE_ADMIN_EMAIL;

	const displayDate = status?.lastUpdated || '2026-04-15';
	const effectiveDate = status?.effectiveDate || displayDate;

	return (
		<div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
			<div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white p-6 sm:p-8 lg:p-10">
				<header className="mb-8 border-b border-gray-100 pb-6">
					<div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
						<div>
							<h1 className="text-3xl font-bold text-gray-900 uppercase">PlayLocal Service Privacy Policy</h1>
							<p className="mt-2 text-sm text-gray-600">Date effective: {displayDate}</p>
						</div>
						{canTriggerPolicyUpdate && user ? (
							<button
								type="button"
								onClick={handleTriggerFakeUpdate}
								disabled={isSubmitting}
								className="inline-flex items-center justify-center gap-2 rounded-lg border border-emerald-600 bg-emerald-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
							>
								{isSubmitting ? (
									<RefreshCw className="h-4 w-4 animate-spin" />
								) : (
									<ShieldCheck className="h-4 w-4" />
								)}
								<span>
									{isSubmitting ? 'Updating policy...' : 'Trigger privacy policy update'}
								</span>
							</button>
						) : null}
					</div>
				</header>

				<div className="space-y-6 text-gray-800">
					{/* ACADEMIC DISCLAIMER / SUPREMACY CLAUSE */}
					<section className="rounded-lg border-2 border-amber-200 bg-amber-50 p-4 text-sm shadow-sm">
						<h2 className="mb-2 font-bold text-amber-900 uppercase">
							Academic Disclaimer and Waiver of Liability (Supremacy Clause)
						</h2>
						<div className="space-y-3 text-amber-950">
							<p>
								PlayLocal is an experimental student prototype, not a commercial entity. This Privacy Policy is an academic artifact designed to simulate compliance with the <em>Personal Information Protection and Electronic Documents Act</em> (PIPEDA) for a hypothetical commercial rollout.
							</p>
							<p>
								The Privacy Policy Actually in effect can be found{" "}
								<a href="https://github.com/TeamCappin/PlayLocal/wiki/Privacy-Policy" className="underline font-medium">
									here
								</a>
							</p>
							<div className="pt-2 font-semibold">
								By using this Service, you acknowledge and unconditionally agree that:
							</div>
							<ol className="list-decimal pl-5 space-y-1">
								<li>No commercial activity actually occurs; therefore, PIPEDA does not apply (§4(1)(a)).</li>
								<li>You have absolutely zero reasonable expectation of privacy or data security.</li>
								<li>The data handling, subscription, and targeted advertising practices described below are simulated academic exercises. We make no guarantees that these systems function securely or as described.</li>
								<li>We waive all liability for data breaches, leaks, or unauthorized disclosures to the maximum extent permitted by Mandatory Law.</li>
								<li>In the event of a conflict between this Supremacy Clause and any provision in Sections 0 through 7 below, this Supremacy Clause strictly prevails.</li>
							</ol>
						</div>
					</section>

					<hr className="border-gray-100" />

					{/* §0. LEXICON */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">§0. LEXICON</h3>
						<ul className="list-none space-y-1">
							<li>§0.1. <strong>&ldquo;We&rdquo;</strong>, <strong>&ldquo;us&rdquo;</strong>, and <strong>&ldquo;our&rdquo;</strong> mean the PlayLocal operators.</li>
							<li>§0.2. <strong>&ldquo;PlayLocal&rdquo;</strong> or <strong>&ldquo;Service&rdquo;</strong> means the hosted PlayLocal website, application, APIs, premium subscriptions, and related platform features.</li>
							<li>§0.3. <strong>&ldquo;You&rdquo;</strong> and <strong>&ldquo;your&rdquo;</strong> mean the individual user of the Service.</li>
							<li>§0.4. <strong>&ldquo;PIPEDA&rdquo;</strong> means the <em>Personal Information Protection and Electronic Documents Act</em> (Canada).</li>
							<li>§0.5. <strong>&ldquo;Targeted Advertising&rdquo;</strong> means the use of telemetry and user data to deliver hyper-local, personalized advertisements via third-party networks.</li>
							<li>§0.6. <strong>&ldquo;Subscription&rdquo;</strong> means the paid premium account tiers offered within the Service.</li>
							<li>§0.7. <strong>&ldquo;Mandatory Law&rdquo;</strong> means the laws and legal rules of the Province of Ontario and the federal laws of Canada applicable therein that cannot be waived or excluded by contract.</li>
						</ul>
					</section>

					{/* 1. DATA COLLECTION */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">1. DATA COLLECTION</h3>
						<p>We collect the following categories of personal information to operate the Service and facilitate our commercial activities:</p>
						<p>1.1. <strong>Account & Billing Data:</strong> Information provided during registration and checkout, including email addresses, usernames, passwords, and payment processing details required for Subscriptions.</p>
						<p>1.2. <strong>User Content:</strong> Text, images, local event data, and geospatial location data you upload, transmit, or share.</p>
						<p>1.3. <strong>Telemetry & Ad Data:</strong> Automatically collected metadata, including IP addresses, browser types, interaction logs, device identifiers, and location history utilized specifically for Targeted Advertising.</p>
					</section>

					{/* 2. DATA USE */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">2. DATA USE</h3>
						<p>We use the collected data strictly for the following purposes:</p>
						<p>2.1. To operate, maintain, and secure the Service.</p>
						<p>2.2. To process Subscription payments, verify premium account status, and prevent billing fraud.</p>
						<p>2.3. To deliver hyper-local Targeted Advertising based on your geospatial location and telemetry profile.</p>
						<p>2.4. To analyze system performance and conduct internal technical audits.</p>
					</section>

					{/* 3. CONSENT AND OPT-OUT */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">3. CONSENT AND OPT-OUT</h3>
						<p>3.1. <strong>Explicit Consent:</strong> By registering an account and using the Service, you consent to the collection, use, and disclosure of your personal information as outlined in this policy, including for Targeted Advertising.</p>
						<p>3.2. <strong>Default Enrollment & Opt-Out:</strong> To support the Service, Targeted Advertising based on non-sensitive telemetry and IP-derived general location is enabled by default. You may withdraw your consent for this personalization at any time by toggling the 'Targeted Advertising' switch to OFF in your Account Settings.</p>
						<p>3.3. <strong>Withdrawal Limitations:</strong> You cannot opt out of data collection necessary for the basic operation of the Service or the processing of active Subscriptions without terminating your account.</p>
					</section>

					{/* 4. DATA DISCLOSURE AND SHARING */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">4. DATA DISCLOSURE AND SHARING</h3>
						<p>We do not commercially sell your raw personal data. We disclose data only under the following conditions:</p>
						<p>4.1. <strong>Service Providers:</strong> We share necessary billing data with authorized third-party payment processors strictly to execute Subscription transactions.</p>
						<p>4.2. <strong>Ad Networks:</strong> We share anonymized device identifiers and telemetry profiles with third-party ad networks to facilitate Targeted Advertising. We do not share plaintext email addresses or direct identifiers with these networks.</p>
						<p>4.3. <strong>Law Enforcement & Exceptions:</strong> Pursuant to PIPEDA §7, we will disclose your data without your knowledge or consent if legally compelled by a court of competent jurisdiction (e.g., subpoena, warrant), or if we have reasonable grounds to believe the disclosure is necessary to investigate a breach of law or prevent an emergency threatening life, health, or security.</p>
					</section>

					{/* 5. DATA BREACH PROTOCOL */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">5. DATA BREACH PROTOCOL</h3>
						<p>5.1. <strong>Notification:</strong> In accordance with PIPEDA Division 1.1, if we determine that a breach of our security safeguards has occurred involving your personal information, and it is reasonable to believe the breach creates a real risk of significant harm (e.g., identity theft, financial fraud), we will notify you as soon as feasible.</p>
						<p>5.2. <strong>Reporting:</strong> Qualifying breaches will be formally reported to the Privacy Commissioner of Canada, and we will maintain a centralized record of all security incidents as required by law.</p>
					</section>

					{/* 6. INDIVIDUAL ACCESS AND DELETION */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">6. INDIVIDUAL ACCESS AND DELETION</h3>
						<p>6.1. <strong>Right to Access:</strong> You have the right to request an account of the personal information we hold about you, how it is used, and to whom it has been disclosed.</p>
						<p>6.2. <strong>Right to Amend/Delete:</strong> You may challenge the accuracy of your data or request its deletion.</p>
						<p>6.3. <strong>Execution:</strong> Access, export, and deletion requests must be executed using the automated tools provided in your Account Settings. If the tools fail, requests must be submitted in writing. We will respond within thirty (30) days.</p>
						<p>6.4. <strong>Retention limitations:</strong> Data subject to an active law enforcement preservation request or necessary to settle a billing dispute will be retained despite a deletion request.</p>
					</section>

					{/* 7. MODIFICATIONS */}
					<section className="space-y-2">
						<h3 className="font-bold text-gray-900">7. MODIFICATIONS</h3>
						<p>7.1. <strong>Acceptance through Conduct:</strong> Continued use of the Service after {effectiveDate} constitutes acknowledgement and acceptance of these changes.</p>
						<p>7.2. <strong>Acceptance:</strong> Continued use of the Service after {effectiveDate} constitutes acknowledgement and acceptance of these changes.</p>
					</section>
				</div>
			</div>
		</div>
	);
}