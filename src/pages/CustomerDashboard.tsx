import React, { useState, useEffect } from 'react';
import { ShoppingBag, FileText, Download, Sliders, UploadCloud, CheckCircle, Clock, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { LicenseTierKey } from '../types';

interface CustomerDashboardProps {
  onViewAgreement: (tier: LicenseTierKey, beatTitle: string, customerName?: string, customerEmail?: string, rawText?: string) => void;
  setCurrentTab: (tab: string) => void;
}

export const CustomerDashboard: React.FC<CustomerDashboardProps> = ({ onViewAgreement, setCurrentTab }) => {
  const { user } = useAuth();
  const [activeSubTab, setActiveSubTab] = useState<'licenses' | 'orders' | 'mastering'>('licenses');
  const [licenses, setLicenses] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [masteringOrders, setMasteringOrders] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // File upload state for mastering
  const [uploadingOrderId, setUploadingOrderId] = useState<string | null>(null);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/customer/licenses')
      .then((r) => r.json())
      .then((data) => setLicenses(data.licenses || []))
      .catch(console.error);

    fetch('/api/customer/orders')
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .catch(console.error);

    fetch('/api/customer/mastering')
      .then((r) => r.json())
      .then((data) => {
        setMasteringOrders(data.mastering || []);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });
  }, []);

  const handleMixUpload = async (orderId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('mixFile', file);

    setUploadingOrderId(orderId);
    try {
      const res = await fetch(`/api/customer/mastering/${orderId}/upload`, {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (res.ok) {
        setUploadSuccess(`Mix "${file.name}" uploaded successfully for mastering!`);
        // Refresh mastering orders
        const refreshed = await fetch('/api/customer/mastering').then((r) => r.json());
        setMasteringOrders(refreshed.mastering || []);
      } else {
        alert(data.error || 'Upload failed');
      }
    } catch (err: any) {
      alert(err.message || 'Upload error');
    } finally {
      setUploadingOrderId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 space-y-8">
      {/* Account Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <span className="text-xs font-bold uppercase tracking-widest text-amber-400">
            Artist Portal
          </span>
          <h1 className="font-['Syne'] text-3xl font-extrabold text-white mt-1">
            Customer Dashboard
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Signed in as <strong className="text-zinc-200">{user?.name || 'Valued Artist'}</strong> ({user?.email || 'artist@gmail.com'})
          </p>
        </div>

        <button
          onClick={() => setCurrentTab('store')}
          className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400 transition-colors"
        >
          Browse Beat Catalog
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="flex border-b border-zinc-800 text-xs font-semibold gap-6">
        <button
          onClick={() => setActiveSubTab('licenses')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'licenses'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <FileText className="h-4 w-4" />
          <span>My Licenses ({licenses.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('mastering')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'mastering'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <Sliders className="h-4 w-4" />
          <span>Mastering Projects ({masteringOrders.length})</span>
        </button>

        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 border-b-2 transition-colors flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'border-amber-500 text-amber-400'
              : 'border-transparent text-zinc-400 hover:text-white'
          }`}
        >
          <ShoppingBag className="h-4 w-4" />
          <span>Purchase Orders ({orders.length})</span>
        </button>
      </div>

      {uploadSuccess && (
        <div className="rounded-lg border border-emerald-800 bg-emerald-950/40 p-3.5 flex items-center gap-2 text-emerald-300 text-xs">
          <CheckCircle className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{uploadSuccess}</span>
        </div>
      )}

      {/* Tab Contents */}
      {activeSubTab === 'licenses' && (
        <div className="space-y-4">
          {licenses.length === 0 ? (
            <div className="py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
              <FileText className="h-10 w-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">You do not have any active licenses yet.</p>
              <button
                onClick={() => setCurrentTab('store')}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
              >
                Browse Beat Store
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {licenses.map((lic) => (
                <div
                  key={lic.id}
                  className="rounded-xl border border-zinc-800 bg-[#0d0f17] p-5 space-y-4 flex flex-col justify-between"
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="rounded bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 text-[10px] font-bold text-amber-400 font-mono uppercase">
                        {lic.license_tier} LICENSE
                      </span>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        {new Date(lic.created_at).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="font-['Syne'] text-lg font-bold text-white">
                      {lic.beat_title}
                    </h3>
                    <div className="text-xs text-zinc-400 font-mono">
                      License ID: <span className="text-zinc-200">{lic.license_id}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-zinc-800/80 flex flex-wrap items-center gap-2">
                    <button
                      onClick={() =>
                        onViewAgreement(
                          lic.license_tier,
                          lic.beat_title,
                          lic.customer_name,
                          lic.customer_email,
                          lic.agreement_text
                        )
                      }
                      className="flex-1 flex items-center justify-center gap-1.5 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 py-2 text-xs font-semibold transition-colors"
                    >
                      <FileText className="h-3.5 w-3.5 text-amber-400" />
                      <span>View Agreement</span>
                    </button>

                    <a
                      href={`/api/licenses/${lic.token}/pdf`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 rounded bg-amber-500 hover:bg-amber-400 text-black py-2 text-xs font-bold transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>Download PDF</span>
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Mastering Orders Tab */}
      {activeSubTab === 'mastering' && (
        <div className="space-y-4">
          {masteringOrders.length === 0 ? (
            <div className="py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900/30 space-y-3">
              <Sliders className="h-10 w-10 text-zinc-600 mx-auto" />
              <p className="text-xs text-zinc-400">You have not submitted any stereo mastering projects.</p>
              <button
                onClick={() => setCurrentTab('mastering')}
                className="rounded-lg bg-amber-500 px-4 py-2 text-xs font-bold text-black hover:bg-amber-400"
              >
                Order Stereo Mastering
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {masteringOrders.map((mo) => (
                <div
                  key={mo.id}
                  className="rounded-xl border border-zinc-800 bg-[#0d0f17] p-5 space-y-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-zinc-800/80 pb-3">
                    <div>
                      <h3 className="font-['Syne'] text-base font-bold text-white">
                        {mo.song_title}
                      </h3>
                      <p className="text-xs text-zinc-400">Order Ref: {mo.order_id}</p>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-xs text-zinc-400">Status:</span>
                      <span className="rounded bg-zinc-800 border border-zinc-700 px-2.5 py-1 text-xs font-bold uppercase text-amber-400">
                        {mo.status.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {mo.notes && (
                    <p className="text-xs text-zinc-300 bg-zinc-950 p-3 rounded border border-zinc-800/80">
                      <strong>Client Notes:</strong> {mo.notes}
                    </p>
                  )}

                  {/* Upload Mix Form if awaiting_files */}
                  {mo.status === 'awaiting_files' && (
                    <div className="rounded-lg border border-dashed border-amber-500/40 bg-amber-500/5 p-4 text-center space-y-2">
                      <UploadCloud className="h-6 w-6 text-amber-400 mx-auto" />
                      <p className="text-xs font-semibold text-white">
                        Upload Your Unmastered Stereo Mix (24-bit WAV, -6dB Peak)
                      </p>
                      <input
                        type="file"
                        accept=".wav,.aif,.aiff"
                        onChange={(e) => handleMixUpload(mo.id, e)}
                        className="text-xs text-zinc-400 file:mr-2 file:py-1 file:px-3 file:rounded file:border-0 file:text-xs file:font-semibold file:bg-amber-500 file:text-black hover:file:bg-amber-400 cursor-pointer"
                      />
                      {uploadingOrderId === mo.id && (
                        <p className="text-xs text-amber-400 font-mono animate-pulse">Uploading mix...</p>
                      )}
                    </div>
                  )}

                  {/* Delivered Master Links */}
                  {mo.status === 'delivered' && mo.deliverable_wav_url && (
                    <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/20 p-4 flex items-center justify-between gap-4">
                      <div>
                        <span className="text-xs font-bold text-emerald-400 block">Mastering Complete!</span>
                        <p className="text-[11px] text-zinc-400">{mo.delivery_notes || 'Enjoy your stream-ready master.'}</p>
                      </div>
                      <a
                        href={mo.deliverable_wav_url}
                        download
                        className="rounded bg-emerald-500 hover:bg-emerald-400 text-black px-4 py-2 text-xs font-bold transition-colors"
                      >
                        Download Master WAV
                      </a>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Orders Tab */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="py-20 text-center rounded-xl border border-zinc-800 bg-zinc-900/30">
              <p className="text-xs text-zinc-400">No past orders found.</p>
            </div>
          ) : (
            <div className="divide-y divide-zinc-800 rounded-xl border border-zinc-800 bg-[#0d0f17] overflow-hidden">
              {orders.map((ord) => (
                <div key={ord.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="font-mono font-bold text-white text-sm">{ord.order_id}</span>
                    <p className="text-zinc-400 text-[11px] mt-0.5">
                      {new Date(ord.created_at).toLocaleDateString()} • {ord.customer_email}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <span className="font-mono text-amber-400 font-extrabold text-sm">
                      ${Number(ord.total_amount).toFixed(2)}
                    </span>
                    <span className="rounded bg-emerald-950/80 border border-emerald-800 px-2 py-0.5 text-[10px] font-bold text-emerald-300 uppercase">
                      {ord.payment_status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
