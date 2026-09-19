import React, { useState } from 'react';
import { Disc3, Mail, CheckCircle2, ShieldCheck, ArrowRight, Lock } from 'lucide-react';
import { SUPPORT_EMAIL, PRODUCER_CREDIT } from '../lib/licenseConstants';

interface FooterProps {
  setCurrentTab: (tab: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ setCurrentTab }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes('@')) return;
    setSubscribing(true);
    try {
      await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setSubscribed(true);
      setEmail('');
    } catch {
      // ignore
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <footer className="w-full border-t border-zinc-800/80 bg-[#07080c] text-zinc-400 pb-28 pt-16">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 pb-12 border-b border-zinc-800/60">
          {/* Brand Info */}
          <div className="space-y-4 md:col-span-1">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
                <Disc3 className="h-5 w-5" />
              </div>
              <span className="font-['Syne'] text-xl font-extrabold tracking-wider text-white">
                CELLY
              </span>
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Producer &amp; Professional Mastering Engineer. Commercial beat licenses and high-fidelity stereo mastering for artists worldwide.
            </p>
            <div className="text-xs text-amber-400/90 font-medium">
              Mandatory credit: "{PRODUCER_CREDIT}"
            </div>
            <div className="text-xs text-zinc-400">
              Support: <a href={`mailto:${SUPPORT_EMAIL}`} className="text-zinc-200 hover:text-amber-400 underline">{SUPPORT_EMAIL}</a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="font-['Syne'] text-sm font-bold text-white uppercase tracking-wider">
              Music &amp; Services
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentTab('store')} className="hover:text-amber-400 transition-colors">
                  Beat Store
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('licensing')} className="hover:text-amber-400 transition-colors">
                  License Tiers &amp; Terms
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('mastering')} className="hover:text-amber-400 transition-colors">
                  Professional Stereo Mastering
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('about')} className="hover:text-amber-400 transition-colors">
                  About CELLY Studio
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('contact')} className="hover:text-amber-400 transition-colors">
                  Contact &amp; Custom Work
                </button>
              </li>
            </ul>
          </div>

          {/* Legal Pages */}
          <div className="space-y-3">
            <h4 className="font-['Syne'] text-sm font-bold text-white uppercase tracking-wider">
              Legal &amp; Policy
            </h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button onClick={() => setCurrentTab('terms')} className="hover:text-amber-400 transition-colors">
                  Terms of Service
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('privacy')} className="hover:text-amber-400 transition-colors">
                  Privacy Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('refunds')} className="hover:text-amber-400 transition-colors">
                  Refund &amp; Revocation Policy
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('mastering-terms')} className="hover:text-amber-400 transition-colors">
                  Mastering Service Terms
                </button>
              </li>
              <li>
                <button onClick={() => setCurrentTab('licensing')} className="hover:text-amber-400 transition-colors">
                  Agreement Placeholders
                </button>
              </li>
            </ul>
          </div>

          {/* Newsletter Signup */}
          <div className="space-y-3">
            <h4 className="font-['Syne'] text-sm font-bold text-white uppercase tracking-wider">
              VIP Producer Drops
            </h4>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Get notified when fresh beats drop, secret discounts go live, or studio slots open.
            </p>
            {subscribed ? (
              <div className="flex items-center gap-2 p-3 rounded bg-emerald-950/40 border border-emerald-800/80 text-emerald-300 text-xs">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>You are subscribed to CELLY updates!</span>
              </div>
            ) : (
              <form onSubmit={handleSubscribe} className="flex gap-2">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="artist@label.com"
                  required
                  className="w-full rounded-md bg-zinc-900 border border-zinc-800 px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
                <button
                  type="submit"
                  disabled={subscribing}
                  className="rounded-md bg-amber-500 px-3 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors shrink-0"
                >
                  <ArrowRight className="h-4 w-4" />
                </button>
              </form>
            )}
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-400">
          <p>© {new Date().getFullYear()} CELLY. All rights reserved. All beats produced by Celly.</p>
          <div className="flex items-center gap-4">
            <span className="text-zinc-400">Audio Engineer &amp; Producer</span>
            <span>•</span>
            <a href={`mailto:${SUPPORT_EMAIL}`} className="hover:text-amber-400">
              {SUPPORT_EMAIL}
            </a>
            <span>•</span>
            <button
              onClick={() => setCurrentTab('admin')}
              className="flex items-center gap-1 text-zinc-500 hover:text-amber-400 transition-colors"
              title="Producer Studio Access (Owner Only)"
            >
              <Lock className="h-3 w-3" />
              <span>Producer Portal</span>
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
