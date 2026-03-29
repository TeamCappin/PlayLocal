'use client';

import { useMemo, useState } from 'react';

export function OrganizerAgreement() {
  const [accepted, setAccepted] = useState(false);
  const [confirmedIdentity, setConfirmedIdentity] = useState(false);

  const canAccept = useMemo(() => accepted && confirmedIdentity, [accepted, confirmedIdentity]);

  return (
    <div className="min-h-screen bg-gray-50 py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto rounded-xl border border-gray-200 bg-white p-6 sm:p-8 lg:p-10">
        <header className="mb-8 border-b border-gray-100 pb-6">
          <h1 className="text-3xl text-gray-900">PlayLocal Organizer Agreement Addendum</h1>
          <p className="mt-2 text-sm text-gray-600">Last updated: 2026-03-27</p>
        </header>

        <div className="space-y-6 text-gray-800">
          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">0. INCORPORATION OF LEXICON AND PRIMARY TERMS</h3>
            <p>0.1. <strong>Lexicon Application:</strong> All terms defined in Section 0 of the PlayLocal Service Terms (including, but not limited to, &ldquo;We&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;, &ldquo;PlayLocal&rdquo;, &ldquo;Service&rdquo;, &ldquo;You&rdquo;, &ldquo;your&rdquo;, and &ldquo;Mandatory Law&rdquo;) possess the identical meaning and weight within this Addendum.</p>
            <p>0.2. <strong>Primary Terms Supersede:</strong> This Addendum supplements the PlayLocal Service Terms. In the event of any conflict, the primary PlayLocal Service Terms and Mandatory Law shall govern.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">1. GOVERNING LAW AND ENFORCEABILITY</h3>
            <p>1.1. <strong>Mandatory Law:</strong> This Addendum is governed by and shall be construed strictly in accordance with the Mandatory Law of the Province of Ontario and the federal laws of Canada applicable therein.</p>
            <p>1.2. <strong>Compliance:</strong> We will comply with all Mandatory Law. Any provision herein found unenforceable under Mandatory Law shall be severed without affecting the validity of the remaining provisions.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">2. IDENTITY VERIFICATION MANDATE</h3>
            <p>2.1. <strong>Real Identity:</strong> To utilize the Service as an Organizer, You must operate under your legal, real name and display an accurate, unedited photograph of your face as your profile picture.</p>
            <p>2.2. <strong>Prohibition of Anonymity:</strong> The use of pseudonyms, avatars, obscured images, or deceptive profile data by an Organizer is strictly prohibited.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">3. ORGANIZER DUTIES AND SPORTSMANSHIP</h3>
            <p>3.1. <strong>Event and Venue Responsibility:</strong> You are solely responsible for the accuracy of your event details and for ensuring your events comply with all local laws and the rules of the physical facility utilized.</p>
            <p>3.2. <strong>Enforcement of Sportsmanship:</strong> You hold the affirmative duty to enforce safety, fair play, and sportsmanship during events You organize. You must actively de-escalate and prevent dangerous, hazardous, or toxic environments.</p>
            <p>3.3. <strong>Duty to Report:</strong> You are required to immediately report individuals who act dangerously, abusively, or disruptively to Us.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">4. ZERO LIABILITY AND ASSUMPTION OF REAL-WORLD RISK</h3>
            <p>4.1. <strong>Independent Operation:</strong> You act independently. We do not oversee, conduct background checks on, or guarantee the safety of any users You interact with through the Service.</p>
            <p>4.2. <strong>Absolute Exculpation:</strong> You utilize the Service to organize events entirely at your own risk. We hold zero liability for injuries, property damage, cancellations, financial losses, or disputes arising from events You organize.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">5. ENFORCEMENT AND TERMINATION</h3>
            <p>5.1. <strong>Discretionary Enforcement:</strong> We monitor complaints regarding your conduct and the safety of your events. We reserve the absolute right to terminate your Organizer privileges and Service access at any time, for any reason, without notice nor appeal.</p>
          </section>

          <section className="space-y-3">
            <h3 className="text-lg text-gray-900">6. MODIFICATION AND SURVIVABILITY</h3>
            <p>6.1. <strong>Unilateral Modification:</strong> We reserve the right to modify, replace, or update this Addendum at any time, at our sole discretion, without prior notification to You. Your continued use of the Service as an Organizer following any modifications constitutes your unconditional legal acceptance of the revised Addendum.</p>
            <p>6.2. <strong>Survivability:</strong> The obligations, exculpations, and waivers contained within this Addendum, specifically Sections 1, 4, 5, and 6, shall perpetually survive the termination, suspension, or deletion of your account or your cessation of use of the Service.</p>
          </section>

        </div>
      </div>
    </div>
  );
}
