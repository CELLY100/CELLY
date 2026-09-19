import React, { useState, useEffect } from 'react';
import { X, FileText, CheckCircle, Download, Shield } from 'lucide-react';
import { LicenseTierKey } from '../types';
import { LICENSE_TIERS } from '../lib/licenseConstants';

interface AgreementViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  tier: LicenseTierKey;
  beatTitle?: string;
  customerName?: string;
  customerEmail?: string;
  isCompletedAgreement?: boolean;
  rawText?: string;
}

export const AgreementViewerModal: React.FC<AgreementViewerModalProps> = ({
  isOpen,
  onClose,
  tier,
  beatTitle,
  customerName,
  customerEmail,
  isCompletedAgreement,
  rawText,
}) => {
  const [agreementText, setAgreementText] = useState<string>('');
  const [version, setVersion] = useState<string>('1.0');
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    if (!isOpen) return;

    if (rawText) {
      setAgreementText(rawText);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    fetch('/api/licenses/preview', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tier,
        beatTitle: beatTitle || 'MIDNIGHT DRIFT',
        customerName: customerName || 'Valued Customer',
        customerEmail: customerEmail || 'customer@example.com',
      }),
    })
      .then((r) => r.json())
      .then((data) => {
        setAgreementText(data.renderedText || '');
        setVersion(data.version || '1.0');
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, [isOpen, tier, beatTitle, customerName, customerEmail, rawText]);

  if (!isOpen) return null;

  const tierInfo = LICENSE_TIERS[tier] || LICENSE_TIERS.mp3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-xl border border-zinc-800 bg-[#0c0e15] shadow-2xl overflow-hidden my-6 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-6 py-4 bg-zinc-900/50 shrink-0">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-amber-400" />
            <div>
              <h3 className="font-['Syne'] text-base font-bold text-white">
                {tierInfo.name} Agreement (v{version})
              </h3>
              <p className="text-xs text-zinc-400">
                Official legal contract snapshot for "{beatTitle || 'Instrumental'}"
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Contract Text Body */}
        <div className="p-6 overflow-y-auto flex-1 font-mono text-xs text-zinc-300 leading-relaxed space-y-4 bg-zinc-950/70 select-text">
          {isLoading ? (
            <div className="py-16 text-center text-zinc-500">Loading agreement text...</div>
          ) : (
            <pre className="whitespace-pre-wrap font-sans text-xs text-zinc-200 leading-relaxed font-mono">
              {agreementText}
            </pre>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-zinc-800 px-6 py-3.5 bg-zinc-900/50 shrink-0 text-xs">
          <div className="flex items-center gap-2 text-zinc-400">
            <Shield className="h-4 w-4 text-amber-400" />
            <span>Immutable legal contract issued by CELLY (wspcelly@gmail.com)</span>
          </div>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-md bg-amber-500 text-black font-semibold hover:bg-amber-400 transition-colors"
          >
            Close Viewer
          </button>
        </div>
      </div>
    </div>
  );
};
