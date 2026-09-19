import React, { useState } from 'react';
import { ShoppingBag, Heart, User as UserIcon, Shield, Sliders, Menu, X, Disc3, Lock, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenAuthModal?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ currentTab, setCurrentTab, onOpenAuthModal }) => {
  const { user, isAdmin, logout, lockAdmin } = useAuth();
  const { itemCount } = useCart();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { id: 'home', label: 'Home' },
    { id: 'store', label: 'Beat Store' },
    { id: 'licensing', label: 'Licensing' },
    { id: 'mastering', label: 'Mastering' },
    { id: 'about', label: 'About' },
    { id: 'contact', label: 'Contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-800/80 bg-[#090a0f]/90 backdrop-blur-md">
      <div className="mx-auto flex h-18 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <button
          onClick={() => {
            setCurrentTab('home');
            setMobileMenuOpen(false);
          }}
          className="group flex items-center gap-3 text-left focus:outline-none"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-500/30 text-amber-400 group-hover:border-amber-400 transition-colors">
            <Disc3 className="h-5 w-5 animate-[spin_8s_linear_infinite]" />
          </div>
          <div>
            <span className="font-['Syne'] text-xl font-extrabold tracking-wider text-white group-hover:text-amber-300 transition-colors">
              CELLY
            </span>
            <span className="block text-[10px] font-medium tracking-widest text-zinc-400 uppercase">
              Beats &amp; Mastering
            </span>
          </div>
        </button>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const isActive = currentTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => setCurrentTab(link.id)}
                className={`px-3.5 py-2 text-sm font-medium rounded-md transition-all ${
                  isActive
                    ? 'text-amber-400 bg-amber-500/10'
                    : 'text-zinc-300 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                {link.label}
              </button>
            );
          })}
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-3">
          {/* Admin Studio Button */}
          {isAdmin ? (
            <div className="flex items-center gap-1.5">
              <button
                id="btn-admin-studio"
                onClick={() => setCurrentTab('admin')}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                  currentTab === 'admin'
                    ? 'bg-amber-500 text-black border-amber-400'
                    : 'bg-amber-500/15 text-amber-400 border-amber-500/40 hover:bg-amber-500/25'
                }`}
                title="Producer Studio (Ryan Sam)"
              >
                <Shield className="h-3.5 w-3.5" />
                <span>Admin Studio</span>
              </button>
              <button
                id="btn-lock-admin"
                onClick={lockAdmin}
                className="flex items-center justify-center p-1.5 rounded text-zinc-400 hover:text-red-400 hover:bg-zinc-900 border border-transparent hover:border-zinc-800 transition-colors"
                title="Lock Admin Studio"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          ) : (
            <button
              id="btn-admin-studio-locked"
              onClick={() => setCurrentTab('admin')}
              className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                currentTab === 'admin'
                  ? 'bg-zinc-800 text-amber-400 border-amber-500/50'
                  : 'bg-zinc-900/80 text-zinc-400 border-zinc-800 hover:text-amber-400 hover:border-zinc-700'
              }`}
              title="Producer Studio Login"
            >
              <Lock className="h-3.5 w-3.5" />
              <span>Admin Studio</span>
            </button>
          )}

          {/* Customer Dashboard Button if logged in as customer */}
          {user && !isAdmin && (
            <button
              onClick={() => setCurrentTab('dashboard')}
              className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md border transition-colors ${
                currentTab === 'dashboard'
                  ? 'bg-zinc-200 text-black border-white'
                  : 'bg-zinc-800/60 text-zinc-200 border-zinc-700 hover:bg-zinc-800'
              }`}
            >
              <UserIcon className="h-3.5 w-3.5" />
              <span>My Account</span>
            </button>
          )}

          {/* Cart Trigger */}
          <button
            onClick={() => setCurrentTab('checkout')}
            className="relative flex items-center justify-center h-9 w-9 rounded-md bg-zinc-800/80 border border-zinc-700/80 text-zinc-200 hover:text-amber-400 hover:border-amber-500/40 transition-colors"
            title="View Cart & Checkout"
          >
            <ShoppingBag className="h-4 w-4" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[11px] font-bold text-black shadow-md">
                {itemCount}
              </span>
            )}
          </button>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-zinc-400 hover:text-white"
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-b border-zinc-800 bg-[#0c0e15] px-4 pt-2 pb-6 space-y-2">
          {navLinks.map((link) => (
            <button
              key={link.id}
              onClick={() => {
                setCurrentTab(link.id);
                setMobileMenuOpen(false);
              }}
              className={`block w-full text-left px-3 py-2 text-base font-medium rounded-md ${
                currentTab === link.id ? 'text-amber-400 bg-amber-500/10' : 'text-zinc-300 hover:bg-zinc-800'
              }`}
            >
              {link.label}
            </button>
          ))}

          <div className="pt-4 border-t border-zinc-800 flex flex-col gap-2">
            {isAdmin ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setCurrentTab('admin');
                    setMobileMenuOpen(false);
                  }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-semibold rounded-md bg-amber-500 text-black"
                >
                  <Shield className="h-4 w-4" /> Admin Studio
                </button>
                <button
                  onClick={() => {
                    lockAdmin();
                    setMobileMenuOpen(false);
                  }}
                  className="p-2.5 rounded-md bg-zinc-800 text-zinc-300 hover:text-red-400"
                  title="Lock Studio"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setCurrentTab('admin');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-md bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-amber-400"
              >
                <Lock className="h-4 w-4" /> Producer Studio Login
              </button>
            )}

            {user && !isAdmin && (
              <button
                onClick={() => {
                  setCurrentTab('dashboard');
                  setMobileMenuOpen(false);
                }}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-md bg-zinc-800 text-white"
              >
                <UserIcon className="h-4 w-4" /> Customer Dashboard ({user.name.split(' ')[0]})
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
