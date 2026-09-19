import React, { useState } from 'react';
import { Check, X, FileText, HelpCircle, ShieldCheck, AlertCircle } from 'lucide-react';
import { LICENSE_TIERS, PRODUCER_CREDIT, SUPPORT_EMAIL } from '../lib/licenseConstants';
import { LicenseTierKey } from '../types';

interface LicensingPageProps {
  onViewAgreement: (tier: LicenseTierKey, beatTitle: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const LicensingPage: React.FC<LicensingPageProps> = ({ onViewAgreement, setCurrentTab }) => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const tiers: LicenseTierKey[] = ['mp3', 'wav', 'premium', 'unlimited', 'exclusive'];

  const comparisonRows = [
    {
      feature: 'Delivered Files',
      mp3: 'Mastered 320kbps MP3',
      wav: '24-bit Lossless WAV + MP3',
      premium: 'Trackout Stems (WAV) + WAV + MP3',
      unlimited: 'Trackout Stems (WAV) + WAV + MP3',
      exclusive: 'Trackout Stems + Mastered WAV + MP3',
    },
    {
      feature: 'Untagged Audio',
      mp3: true,
      wav: true,
      premium: true,
      unlimited: true,
      exclusive: true,
    },
    {
      feature: 'Audio Streams (Spotify, Apple)',
      mp3: 'Up to 100,000 Streams',
      wav: 'Up to 500,000 Streams',
      premium: 'Up to 1,000,000 Streams',
      unlimited: 'UNLIMITED Streams',
      exclusive: 'UNLIMITED Streams',
    },
    {
      feature: 'Physical & Digital Copies',
      mp3: 'Up to 2,500 Units',
      wav: 'Up to 10,000 Units',
      premium: 'Up to 25,000 Units',
      unlimited: 'UNLIMITED Units',
      exclusive: 'UNLIMITED Units',
    },
    {
      feature: 'Music Videos',
      mp3: '1 Non-Monetized Video',
      wav: '1 Monetized Video',
      premium: '2 Monetized Videos',
      unlimited: 'UNLIMITED Monetized Videos',
      exclusive: 'UNLIMITED Monetized Videos',
    },
    {
      feature: 'Radio Broadcasting',
      mp3: '2 Terrestrial / Satellite',
      wav: '5 Terrestrial / Satellite',
      premium: '15 Terrestrial / Satellite',
      unlimited: 'UNLIMITED Radio Stations',
      exclusive: 'UNLIMITED Radio Stations',
    },
    {
      feature: 'Live Performances',
      mp3: 'Non-Profit / Local Only',
      wav: 'Up to $2,000 in Compensation',
      premium: 'Up to $10,000 in Compensation',
      unlimited: 'UNLIMITED For-Profit Shows',
      exclusive: 'UNLIMITED For-Profit Shows',
    },
    {
      feature: 'Monetized YouTube Channels',
      mp3: '1 Channel (No ContentID)',
      wav: '1 Channel (No ContentID)',
      premium: '2 Channels (No ContentID)',
      unlimited: 'UNLIMITED Channels (No ContentID)',
      exclusive: 'Full Exclusivity / Sync Allowed',
    },
    {
      feature: 'Publishing / Royalties Split',
      mp3: '50% Producer / 50% Artist',
      wav: '50% Producer / 50% Artist',
      premium: '50% Producer / 50% Artist',
      unlimited: '50% Producer / 50% Artist',
      exclusive: '50% Producer / 50% Artist',
    },
    {
      feature: 'Store Retirement',
      mp3: 'Beat remains on store',
      wav: 'Beat remains on store',
      premium: 'Beat remains on store',
      unlimited: 'Beat remains on store',
      exclusive: 'PERMANENTLY REMOVED from store',
    },
    {
      feature: 'Mandatory Production Credit',
      mp3: `"${PRODUCER_CREDIT}"`,
      wav: `"${PRODUCER_CREDIT}"`,
      premium: `"${PRODUCER_CREDIT}"`,
      unlimited: `"${PRODUCER_CREDIT}"`,
      exclusive: `"${PRODUCER_CREDIT}"`,
    },
  ];

  const faqs = [
    {
      q: 'What is the difference between Unlimited and Exclusive licenses?',
      a: 'An Unlimited license allows unlimited streaming and distribution, but the beat remains in the CELLY catalog for other artists to purchase licenses. An Exclusive license permanently removes the instrumental from the store; no one else can ever buy a license for it. Note: Prior valid non-exclusive licenses granted before the exclusive sale remain valid according to their individual contract terms.',
    },
    {
      q: 'Can I register my song with YouTube Content ID or Shazam?',
      a: 'No. Neither non-exclusive nor exclusive licensees are permitted to register the underlying instrumental composition with automatic fingerprinting services (such as YouTube Content ID, Identify, or TuneCore ContentID). Doing so generates false copyright strikes against other legitimate artists and CELLY.',
    },
    {
      q: 'How do I credit CELLY on my song title or metadata?',
      a: 'All licenses strictly require visible credit. On streaming platforms, digital stores, and physical releases, the song title or metadata must include "Prod. by Celly" (or "Produced by Celly").',
    },
    {
      q: 'What happens if I exceed my license stream or distribution cap?',
      a: 'You can seamlessly upgrade to a higher tier (such as Premium or Unlimited) by paying the difference, or contact wspcelly@gmail.com for custom label synchronization licenses.',
    },
    {
      q: 'Do I get a legal PDF contract upon purchase?',
      a: 'Yes. Immediately after checkout, the server generates an immutable, signed legal PDF contract stamped with your legal name, email, order ID, license ID, timestamp, and detailed terms.',
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-16">
      {/* Page Header */}
      <div className="text-center space-y-3 max-w-3xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Rights &amp; Usage Rights
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-5xl font-extrabold text-white">
          License Pricing &amp; Terms
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          Clear, straightforward commercial rights for independent artists, record labels, and content creators. Every purchase includes high-fidelity untagged audio and a legally binding signed PDF contract.
        </p>
      </div>

      {/* Tiers Cards Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {tiers.map((tierKey) => {
          const tier = LICENSE_TIERS[tierKey];
          return (
            <div
              key={tierKey}
              className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-5 flex flex-col justify-between space-y-4"
            >
              <div>
                <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
                  {tierKey}
                </span>
                <h3 className="font-['Syne'] text-lg font-bold text-white mt-0.5">
                  {tier.name.replace(' License', '')}
                </h3>
                <div className="font-mono text-2xl font-black text-white mt-1">
                  ${tier.price.toFixed(2)}
                </div>
                <p className="text-[11px] text-zinc-400 mt-2">
                  {tier.filesDescription}
                </p>
              </div>

              <div className="space-y-2 pt-3 border-t border-zinc-800/80">
                <button
                  onClick={() => onViewAgreement(tierKey, 'Sample Instrumental')}
                  className="w-full flex items-center justify-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-1.5 text-xs font-medium transition-colors"
                >
                  <FileText className="h-3.5 w-3.5 text-amber-400" />
                  <span>View Contract Template</span>
                </button>

                <button
                  onClick={() => setCurrentTab('store')}
                  className="w-full rounded bg-amber-500 hover:bg-amber-400 text-black py-1.5 text-xs font-bold transition-colors"
                >
                  Browse Beats
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Comprehensive Comparison Table */}
      <div className="rounded-xl border border-zinc-800 bg-[#0d0f17] overflow-hidden shadow-2xl">
        <div className="p-6 border-b border-zinc-800 bg-zinc-900/40">
          <h3 className="font-['Syne'] text-xl font-bold text-white">
            Full Side-by-Side Licensing Matrix
          </h3>
          <p className="text-xs text-zinc-400 mt-0.5">
            Review detailed terms, stream thresholds, files, and legal rights for all 5 tiers.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400">
                <th className="py-4 px-6 font-semibold w-1/4">Terms &amp; Allowances</th>
                <th className="py-4 px-4 font-bold text-white">MP3 ($29.99)</th>
                <th className="py-4 px-4 font-bold text-white">WAV ($59.99)</th>
                <th className="py-4 px-4 font-bold text-white">Premium ($99.99)</th>
                <th className="py-4 px-4 font-bold text-amber-400">Unlimited ($149.99)</th>
                <th className="py-4 px-4 font-bold text-amber-300">Exclusive ($299.99)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {comparisonRows.map((row, idx) => (
                <tr key={idx} className="hover:bg-zinc-900/30 transition-colors">
                  <td className="py-3.5 px-6 font-medium text-zinc-300">
                    {row.feature}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {typeof row.mp3 === 'boolean' ? (
                      row.mp3 ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-zinc-600" />
                    ) : (
                      row.mp3
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {typeof row.wav === 'boolean' ? (
                      row.wav ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-zinc-600" />
                    ) : (
                      row.wav
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-zinc-400 font-mono">
                    {typeof row.premium === 'boolean' ? (
                      row.premium ? <Check className="h-4 w-4 text-emerald-400" /> : <X className="h-4 w-4 text-zinc-600" />
                    ) : (
                      row.premium
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-amber-400/90 font-mono font-semibold">
                    {typeof row.unlimited === 'boolean' ? (
                      row.unlimited ? <Check className="h-4 w-4 text-amber-400" /> : <X className="h-4 w-4 text-zinc-600" />
                    ) : (
                      row.unlimited
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-amber-300 font-mono font-bold">
                    {typeof row.exclusive === 'boolean' ? (
                      row.exclusive ? <Check className="h-4 w-4 text-amber-300" /> : <X className="h-4 w-4 text-zinc-600" />
                    ) : (
                      row.exclusive
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Critical Legal Notices Banner */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <AlertCircle className="h-5 w-5" />
            <span>Important Notice: Unlimited vs Exclusive</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            Purchasing an <strong>Unlimited License</strong> gives you uncapped streaming, distribution, and performance rights, but the instrumental remains in the store and may be licensed to other creators.
            Only an <strong>Exclusive License</strong> permanently removes the beat from sale for all future buyers.
          </p>
        </div>

        <div className="rounded-xl border border-zinc-800 bg-zinc-900/30 p-6 space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
            <ShieldCheck className="h-5 w-5" />
            <span>Mandatory Production Credit</span>
          </div>
          <p className="text-xs text-zinc-300 leading-relaxed">
            In all commercial releases, digital metadata, streaming profiles, and liner notes, credit must be clearly stated as:
            <span className="block mt-1 font-bold text-white font-mono bg-zinc-950 p-2 rounded border border-zinc-800">
              "{PRODUCER_CREDIT}"
            </span>
          </p>
        </div>
      </div>

      {/* FAQs */}
      <div className="space-y-4 max-w-3xl mx-auto">
        <div className="text-center space-y-1 mb-6">
          <h3 className="font-['Syne'] text-2xl font-bold text-white">
            Frequently Asked Questions
          </h3>
          <p className="text-xs text-zinc-400">Everything you need to know about licensing beats from CELLY</p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-zinc-800 bg-zinc-900/40 overflow-hidden"
            >
              <button
                onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                className="w-full flex items-center justify-between p-4 text-left font-semibold text-xs text-white hover:text-amber-400 transition-colors"
              >
                <span>{faq.q}</span>
                <span className="text-zinc-500 text-base">{openFaq === idx ? '−' : '+'}</span>
              </button>
              {openFaq === idx && (
                <div className="p-4 pt-0 text-xs text-zinc-400 leading-relaxed border-t border-zinc-800/40">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
