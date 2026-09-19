/**
 * CELLY — Producer & Professional Mastering
 * Core TypeScript Definitions
 */

export type UserRole = 'admin' | 'customer';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

export type BeatStatus = 'draft' | 'published' | 'scheduled' | 'exclusive_sold';

export type LicenseTierKey = 'mp3' | 'wav' | 'premium' | 'unlimited' | 'exclusive';

export interface LicenseTierInfo {
  tier: LicenseTierKey;
  name: string;
  price: number;
  filesDescription: string;
  tagless: boolean;
  includedFiles: string[];
  distributionLimit: string;
  streamingLimit: string;
  videoLimit: string;
  radioLimit: string;
  livePerformance: string;
  youtubeChannels: string;
  socialMedia: string;
  publishing: string;
  exclusive: boolean;
  creditRequirement: string;
}

export interface Beat {
  id: string;
  slug: string;
  title: string;
  producer: string;
  bpm: number;
  key: string;
  genre: string;
  mood: string;
  description: string;
  tags: string[];
  artworkUrl: string;
  previewUrl: string;
  duration: number; // in seconds
  plays: number;
  views: number;
  status: BeatStatus;
  isFeatured: boolean;
  isNewRelease: boolean;
  basePrice: number; // starting from 29.99
  hasMp3: boolean;
  hasWav: boolean;
  hasStems: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BeatFile {
  id: string;
  beatId: string;
  fileType: 'preview' | 'mp3_full' | 'wav_full' | 'stems_zip' | 'artwork';
  filename: string;
  originalName: string;
  sizeBytes: number;
  createdAt: string;
}

export interface LicenseTemplate {
  id: string;
  tier: LicenseTierKey;
  name: string;
  price: number;
  version: string;
  title: string;
  templateText: string;
  isActive: boolean;
  updatedAt: string;
}

export interface LicenseTemplateVersion {
  id: string;
  templateId: string;
  tier: LicenseTierKey;
  version: string;
  templateText: string;
  createdAt: string;
  createdBy: string;
}

export type OrderStatus = 'pending' | 'completed' | 'failed' | 'cancelled' | 'refunded';

export interface OrderItem {
  id: string;
  orderId: string;
  itemType: 'beat_license' | 'mastering';
  beatId?: string;
  licenseTier?: LicenseTierKey;
  price: number;
  beatTitle?: string;
  licenseName?: string;
  createdAt: string;
}

export interface Order {
  id: string; // e.g. CELLY-2026-000101
  customerId: string;
  customerName: string;
  customerEmail: string;
  totalAmount: number;
  subtotal: number;
  discountAmount: number;
  discountCode?: string;
  taxAmount: number;
  status: OrderStatus;
  paymentMethod: string;
  paymentProviderId?: string;
  termsAcceptedAt: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

export interface CustomerLicense {
  id: string; // e.g. LIC-2026-000201
  orderId: string;
  orderItemId: string;
  customerId: string;
  beatId: string;
  beatTitle: string;
  licenseTier: LicenseTierKey;
  licenseName: string;
  pricePaid: number;
  version: string;
  agreementSnapshot: string;
  pdfPath?: string;
  status: 'active' | 'revoked' | 'refunded';
  acceptedAt: string;
  createdAt: string;
}

export type MasteringStatus =
  | 'awaiting_files'
  | 'files_received'
  | 'mastering'
  | 'completed'
  | 'delivered';

export interface MasteringOrder {
  id: string; // e.g. MST-2026-000050
  orderId: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  songTitle: string;
  notes: string;
  status: MasteringStatus;
  mixFilePath?: string;
  mixFileName?: string;
  mixFileSize?: number;
  mixUploadedAt?: string;
  finalWavPath?: string;
  finalMp3Path?: string;
  finalDeliveryNotes?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Favorite {
  id: string;
  customerId: string;
  beatId: string;
  createdAt: string;
}

export interface Discount {
  id: string;
  code: string;
  discountType: 'percent' | 'fixed';
  value: number;
  minSpend?: number;
  usageLimit?: number;
  usedCount: number;
  active: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface NewsletterSubscriber {
  id: string;
  email: string;
  subscribedAt: string;
  active: boolean;
}

export interface AuditLog {
  id: string;
  eventType: string;
  userId?: string;
  userEmail?: string;
  ipAddress?: string;
  details: Record<string, unknown>;
  createdAt: string;
}

export interface SiteAnalytics {
  totalRevenue: number;
  totalOrders: number;
  totalBeats: number;
  totalCustomers: number;
  totalMasteringOrders: number;
  beatPlaysTotal: number;
  beatViewsTotal: number;
  exclusiveSalesCount: number;
  popularBeats: { id: string; title: string; plays: number; salesCount: number }[];
  tierDistribution: Record<LicenseTierKey, number>;
}

export interface CartItem {
  beatId: string;
  beatTitle: string;
  beatSlug: string;
  artworkUrl: string;
  licenseTier: LicenseTierKey;
  licenseName: string;
  price: number;
}
