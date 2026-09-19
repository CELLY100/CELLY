import React from 'react';
import { SUPPORT_EMAIL } from '../lib/licenseConstants';

export const PrivacyPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-zinc-300 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Privacy Policy
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white">
          Data Protection &amp; Privacy
        </h1>
        <p className="text-xs text-zinc-400">Last updated: September 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">1. Information We Collect</h2>
        <p>
          When you purchase a beat license or order audio mastering services through CELLY, we collect information necessary to issue your legally valid licensing contracts and deliver your audio deliverables:
        </p>
        <ul className="list-disc pl-5 space-y-1 text-zinc-400">
          <li>Full Legal Name or Stage Name (used to execute binding legal PDF contracts).</li>
          <li>Email address (for digital delivery of audio files and license certificates).</li>
          <li>Uploaded stereo audio mixes and reference notes for mastering orders.</li>
          <li>IP addresses and transaction metadata for fraud prevention and legal audit trails.</li>
        </ul>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">2. Audio Files &amp; Intellectual Property Security</h2>
        <p>
          Audio files you upload for mastering are stored securely and accessed strictly by CELLY for audio processing. We will never share, distribute, resell, or publicly display your unreleased mix files.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">3. Third-Party Payment Processors</h2>
        <p>
          Payment transactions are processed securely through certified PCI-compliant gateways. CELLY does not store or process raw credit card numbers or sensitive banking details on its servers.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">4. Inquiries &amp; Data Deletion</h2>
        <p>
          If you wish to access, rectify, or request deletion of your account or customer data, please contact:
          <br />
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 underline font-mono">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  );
};
