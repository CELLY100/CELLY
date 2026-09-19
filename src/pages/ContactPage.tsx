import React, { useState } from 'react';
import { Mail, MessageSquare, CheckCircle, Send, MapPin, Disc3 } from 'lucide-react';
import { SUPPORT_EMAIL, PRODUCER_CREDIT } from '../lib/licenseConstants';

export const ContactPage: React.FC = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [subject, setSubject] = useState('Custom Beat Production / Inquiry');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) return;
    setSending(true);

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, subject, message }),
      });
      if (res.ok) {
        setSent(true);
      }
    } catch {
      // ignore
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-12 space-y-12">
      <div className="text-center space-y-3">
        <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
          Studio Inquiries
        </span>
        <h1 className="font-['Syne'] text-3xl sm:text-4xl font-extrabold text-white">
          Contact CELLY
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 max-w-lg mx-auto">
          Need a custom beat, exclusive buyout negotiation, sync licensing for film/TV, or have mastering questions? Reach out directly.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
        {/* Contact Info Card */}
        <div className="md:col-span-5 rounded-2xl border border-zinc-800 bg-[#0d0f17] p-6 space-y-6">
          <div className="space-y-2">
            <h3 className="font-['Syne'] text-lg font-bold text-white">
              Direct Communication
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              We respond to all producer inquiries and mastering questions within 24 hours.
            </p>
          </div>

          <div className="space-y-4 text-xs">
            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Mail className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Official Email</span>
                <a href={`mailto:${SUPPORT_EMAIL}`} className="text-amber-400 hover:underline">
                  {SUPPORT_EMAIL}
                </a>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
                <Disc3 className="h-4 w-4" />
              </div>
              <div>
                <span className="font-bold text-white block">Producer Credit</span>
                <span className="text-zinc-300">"{PRODUCER_CREDIT}"</span>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-4 text-[11px] text-zinc-400 space-y-1">
            <span className="font-bold text-zinc-200 block">Custom Beat Packages:</span>
            <p>Exclusive production sessions start at custom rates. Please describe your reference artist, BPM range, and deadline.</p>
          </div>
        </div>

        {/* Message Form */}
        <div className="md:col-span-7 rounded-2xl border border-zinc-800 bg-[#0d0f17] p-6 sm:p-8">
          {sent ? (
            <div className="py-16 text-center space-y-3">
              <CheckCircle className="h-12 w-12 text-emerald-400 mx-auto" />
              <h3 className="font-['Syne'] text-xl font-bold text-white">
                Message Sent Successfully!
              </h3>
              <p className="text-xs text-zinc-400">
                Thank you, {name}. CELLY will review your message and reply to <strong>{email}</strong> shortly.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Your Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Artist / Management Name"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Your Email</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="contact@artist.com"
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Subject</label>
                <select
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="Custom Beat Production / Inquiry">Custom Beat Production / Inquiry</option>
                  <option value="Mastering Service Question">Mastering Service Question</option>
                  <option value="Exclusive Buyout Negotiation">Exclusive Buyout Negotiation</option>
                  <option value="Sync / TV / Film Licensing">Sync / TV / Film Licensing</option>
                  <option value="General Question">General Question</option>
                </select>
              </div>

              <div>
                <label className="block text-zinc-300 font-semibold mb-1">Message</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Provide project details, track titles, or any specific questions..."
                  className="w-full rounded-lg bg-zinc-950 border border-zinc-800 p-2.5 text-white placeholder-zinc-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <button
                type="submit"
                disabled={sending}
                className="w-full flex items-center justify-center gap-2 rounded-lg bg-amber-500 py-3 text-xs font-bold text-black hover:bg-amber-400 transition-colors shadow-md disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
                <span>{sending ? 'Sending Message...' : 'Send Message to CELLY'}</span>
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
