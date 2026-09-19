import React from 'react';
import { ShieldCheck } from 'lucide-react';
import { PRODUCER_CREDIT, SUPPORT_EMAIL } from '../lib/licenseConstants';

export const TermsPage: React.FC = () => {
  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-14 space-y-8 text-zinc-300 text-xs sm:text-sm leading-relaxed">
      <div className="border-b border-zinc-800 pb-6 space-y-2">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Legal Agreement
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white">
          General Terms of Service
        </h1>
        <p className="text-xs text-zinc-400">Last updated: September 2026</p>
      </div>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">1. Scope of Service</h2>
        <p>
          These Terms of Service govern your access to and use of the website and digital store operated by CELLY ("Producer", "Licensor", "we", "us"). By browsing our beat catalog, previewing audio, streaming previews, or completing a purchase of beat licenses or audio mastering services, you enter into a legally binding contract governed by these Terms.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">2. Beat Licensing &amp; Copyright Ownership</h2>
        <p>
          All musical compositions, instrumental arrangements, sound recordings, melodies, and drum programs contained on this platform remain the exclusive intellectual property and copyright of CELLY. Purchasing a beat license (MP3, WAV, Premium, Unlimited, or Exclusive) grants you a limited, non-transferable commercial license subject to the exact terms of the selected license agreement tier.
        </p>
        <p>
          Unless an <em>Exclusive License</em> is explicitly purchased and paid in full, all licenses are non-exclusive. CELLY retains the right to license the same underlying instrumental composition to other parties.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">3. Mandatory Production Credit</h2>
        <p>
          In all commercial releases, digital distributor metadata, streaming services (Spotify, Apple Music, Tidal, Amazon), liner notes, and visual video descriptions, the licensee MUST include the following credit:
        </p>
        <div className="p-3 rounded bg-zinc-900 border border-zinc-800 font-mono text-amber-300 font-bold">
          "{PRODUCER_CREDIT}"
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">4. Content ID &amp; Fingerprint Registration Prohibition</h2>
        <p>
          Licensee is strictly prohibited from registering the Master recording or the underlying Instrumental Beat with any automated acoustic fingerprinting service or digital fingerprint database, including but not limited to YouTube Content ID, Facebook Rights Manager, Shazam, SoundExchange, or TuneCore ContentID. Doing so generates false infringement claims against CELLY and other valid licensees and constitutes immediate grounds for license revocation.
        </p>
      </section>

      <section className="space-y-3">
        <h2 className="font-['Syne'] text-lg font-bold text-white">5. Contact &amp; Legal Notices</h2>
        <p>
          For legal inquiries, copyright claims, or synchronization requests, contact:
          <br />
          <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 underline font-mono">
            {SUPPORT_EMAIL}
          </a>
        </p>
      </section>
    </div>
  );
};
