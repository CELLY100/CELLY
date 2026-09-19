import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { AudioPlayerProvider } from './context/AudioPlayerContext';
import { CartProvider } from './context/CartContext';
import { Navbar } from './components/Navbar';
import { Footer } from './components/Footer';
import { AudioPlayerBar } from './components/AudioPlayerBar';
import { LicenseModal } from './components/LicenseModal';
import { AgreementViewerModal } from './components/AgreementViewerModal';
import { HomePage } from './pages/HomePage';
import { BeatStorePage } from './pages/BeatStorePage';
import { BeatDetailPage } from './pages/BeatDetailPage';
import { LicensingPage } from './pages/LicensingPage';
import { MasteringPage } from './pages/MasteringPage';
import { CheckoutPage } from './pages/CheckoutPage';
import { CustomerDashboard } from './pages/CustomerDashboard';
import { AdminDashboard } from './pages/AdminDashboard';
import { AboutPage } from './pages/AboutPage';
import { ContactPage } from './pages/ContactPage';
import { TermsPage } from './pages/TermsPage';
import { PrivacyPage } from './pages/PrivacyPage';
import { RefundPage } from './pages/RefundPage';
import { MasteringTermsPage } from './pages/MasteringTermsPage';
import { Beat, LicenseTierKey } from './types';

function AppContent() {
  const [currentTab, setCurrentTab] = useState<string>('home');
  const [selectedBeatSlug, setSelectedBeatSlug] = useState<string | null>(null);

  // License Modal State
  const [licenseModalBeat, setLicenseModalBeat] = useState<Beat | null>(null);
  const [isLicenseModalOpen, setIsLicenseModalOpen] = useState<boolean>(false);

  // Agreement Viewer Modal State
  const [agreementModalState, setAgreementModalState] = useState<{
    isOpen: boolean;
    tier: LicenseTierKey;
    beatTitle?: string;
    customerName?: string;
    customerEmail?: string;
    rawText?: string;
  }>({
    isOpen: false,
    tier: 'mp3',
    beatTitle: 'MIDNIGHT DRIFT',
  });

  const handleOpenLicenseModal = (beat: Beat) => {
    setLicenseModalBeat(beat);
    setIsLicenseModalOpen(true);
  };

  const handleCloseLicenseModal = () => {
    setIsLicenseModalOpen(false);
    setLicenseModalBeat(null);
  };

  const handleOpenAgreementModal = (
    tier: LicenseTierKey,
    beatTitle: string,
    customerName?: string,
    customerEmail?: string,
    rawText?: string
  ) => {
    setAgreementModalState({
      isOpen: true,
      tier,
      beatTitle,
      customerName,
      customerEmail,
      rawText,
    });
  };

  const handleCloseAgreementModal = () => {
    setAgreementModalState((prev) => ({ ...prev, isOpen: false }));
  };

  const handleSelectBeatDetail = (slug: string) => {
    setSelectedBeatSlug(slug);
    setCurrentTab('beat-detail');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateTab = (tab: string) => {
    setCurrentTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-[#090a0f] text-zinc-100 flex flex-col font-sans selection:bg-amber-500 selection:text-black">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={handleNavigateTab}
      />

      {/* Main View Router */}
      <main className="flex-1">
        {currentTab === 'home' && (
          <HomePage
            setCurrentTab={handleNavigateTab}
            onOpenLicenseModal={handleOpenLicenseModal}
            onSelectBeatDetail={handleSelectBeatDetail}
          />
        )}

        {currentTab === 'store' && (
          <BeatStorePage
            onOpenLicenseModal={handleOpenLicenseModal}
            onSelectBeatDetail={handleSelectBeatDetail}
          />
        )}

        {currentTab === 'beat-detail' && selectedBeatSlug && (
          <BeatDetailPage
            slug={selectedBeatSlug}
            onBackToStore={() => handleNavigateTab('store')}
            onViewAgreement={handleOpenAgreementModal}
            onGoToCheckout={() => handleNavigateTab('checkout')}
            onSelectBeatDetail={handleSelectBeatDetail}
          />
        )}

        {currentTab === 'licensing' && (
          <LicensingPage
            onViewAgreement={handleOpenAgreementModal}
            setCurrentTab={handleNavigateTab}
          />
        )}

        {currentTab === 'mastering' && (
          <MasteringPage
            onGoToCheckout={() => handleNavigateTab('checkout')}
            setCurrentTab={handleNavigateTab}
          />
        )}

        {currentTab === 'checkout' && (
          <CheckoutPage
            setCurrentTab={handleNavigateTab}
            onViewAgreement={handleOpenAgreementModal}
          />
        )}

        {currentTab === 'dashboard' && (
          <CustomerDashboard
            onViewAgreement={handleOpenAgreementModal}
            setCurrentTab={handleNavigateTab}
          />
        )}

        {currentTab === 'admin' && (
          <AdminDashboard
            onViewAgreement={handleOpenAgreementModal}
            setCurrentTab={handleNavigateTab}
          />
        )}

        {currentTab === 'about' && (
          <AboutPage setCurrentTab={handleNavigateTab} />
        )}

        {currentTab === 'contact' && (
          <ContactPage />
        )}

        {currentTab === 'terms' && (
          <TermsPage />
        )}

        {currentTab === 'privacy' && (
          <PrivacyPage />
        )}

        {currentTab === 'refunds' && (
          <RefundPage />
        )}

        {currentTab === 'mastering-terms' && (
          <MasteringTermsPage />
        )}
      </main>

      {/* Footer */}
      <Footer setCurrentTab={handleNavigateTab} />

      {/* Sticky Bottom Audio Player Bar */}
      <AudioPlayerBar onOpenLicenseModal={handleOpenLicenseModal} />

      {/* License Selection Modal */}
      <LicenseModal
        beat={licenseModalBeat}
        isOpen={isLicenseModalOpen}
        onClose={handleCloseLicenseModal}
        onViewAgreement={handleOpenAgreementModal}
        onGoToCheckout={() => handleNavigateTab('checkout')}
      />

      {/* Official Agreement Contract Viewer Modal */}
      <AgreementViewerModal
        isOpen={agreementModalState.isOpen}
        onClose={handleCloseAgreementModal}
        tier={agreementModalState.tier}
        beatTitle={agreementModalState.beatTitle}
        customerName={agreementModalState.customerName}
        customerEmail={agreementModalState.customerEmail}
        rawText={agreementModalState.rawText}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AudioPlayerProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AudioPlayerProvider>
    </AuthProvider>
  );
}
