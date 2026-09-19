import { LicenseTierInfo, LicenseTierKey } from '../types';

export const SUPPORT_EMAIL = 'wspcelly@gmail.com';
export const PRODUCER_CREDIT = 'Prod. by Celly';
export const MASTERING_SERVICE_NAME = 'Professional Mastering';
export const MASTERING_PRICE = 20.00;

export const LICENSE_TIERS: Record<LicenseTierKey, LicenseTierInfo> = {
  mp3: {
    tier: 'mp3',
    name: 'MP3 License',
    price: 29.99,
    filesDescription: 'Tagless MP3 (320 kbps)',
    tagless: true,
    includedFiles: ['Tagless MP3 (320 kbps)'],
    distributionLimit: '5,000 total distribution copies',
    streamingLimit: '100,000 total audio streams',
    videoLimit: '1 music video',
    radioLimit: 'No radio/broadcast',
    livePerformance: 'Unlimited live performances',
    youtubeChannels: '1 YouTube channel',
    socialMedia: 'Unlimited social media',
    publishing: '50% Producer / 50% Licensee publishing',
    exclusive: false,
    creditRequirement: 'Must credit "Prod. by Celly" in all metadata and descriptions',
  },
  wav: {
    tier: 'wav',
    name: 'WAV License',
    price: 59.99,
    filesDescription: 'Tagless MP3 (320 kbps) + Master Quality WAV',
    tagless: true,
    includedFiles: ['Tagless MP3 (320 kbps)', 'Master Quality WAV (24-bit / 44.1kHz)'],
    distributionLimit: '10,000 total distribution copies',
    streamingLimit: '250,000 total audio streams',
    videoLimit: '1 music video',
    radioLimit: '2 radio stations',
    livePerformance: 'Unlimited live performances',
    youtubeChannels: '2 YouTube channels',
    socialMedia: 'Unlimited social media',
    publishing: '50% Producer / 50% Licensee publishing',
    exclusive: false,
    creditRequirement: 'Must credit "Prod. by Celly" in all metadata and descriptions',
  },
  premium: {
    tier: 'premium',
    name: 'Premium / Trackout License',
    price: 99.99,
    filesDescription: 'Tagless MP3 + WAV + Individual Stem / Trackout Files (ZIP)',
    tagless: true,
    includedFiles: ['Tagless MP3 (320 kbps)', 'Master Quality WAV', 'Trackout Stems (ZIP)'],
    distributionLimit: '25,000 total distribution copies',
    streamingLimit: '500,000 total audio streams',
    videoLimit: '2 music videos',
    radioLimit: '5 radio stations',
    livePerformance: 'Unlimited live performances',
    youtubeChannels: 'Unlimited YouTube channels',
    socialMedia: 'Unlimited social media',
    publishing: '50% Producer / 50% Licensee publishing',
    exclusive: false,
    creditRequirement: 'Must credit "Prod. by Celly" in all metadata and descriptions',
  },
  unlimited: {
    tier: 'unlimited',
    name: 'Unlimited License',
    price: 149.99,
    filesDescription: 'Tagless MP3 + WAV + Individual Stem / Trackout Files (ZIP) with Unlimited Commercial Distribution',
    tagless: true,
    includedFiles: ['Tagless MP3 (320 kbps)', 'Master Quality WAV', 'Trackout Stems (ZIP)'],
    distributionLimit: 'Unlimited distribution',
    streamingLimit: 'Unlimited audio streams',
    videoLimit: 'Unlimited music videos',
    radioLimit: 'Unlimited radio/broadcast',
    livePerformance: 'Unlimited live performances',
    youtubeChannels: 'Unlimited YouTube channels',
    socialMedia: 'Unlimited social media',
    publishing: '50% Producer / 50% Licensee publishing',
    exclusive: false,
    creditRequirement: 'Must credit "Prod. by Celly" in all metadata and descriptions',
  },
  exclusive: {
    tier: 'exclusive',
    name: 'Exclusive License',
    price: 299.99,
    filesDescription: 'Sole Ownership Rights, Tagless MP3 + WAV + Trackout Stems. Beat permanently removed from store.',
    tagless: true,
    includedFiles: ['Tagless MP3 (320 kbps)', 'Master Quality WAV', 'Trackout Stems (ZIP)'],
    distributionLimit: 'Unlimited distribution',
    streamingLimit: 'Unlimited audio streams',
    videoLimit: 'Unlimited music videos',
    radioLimit: 'Unlimited radio/broadcast',
    livePerformance: 'Unlimited live performances',
    youtubeChannels: 'Unlimited YouTube channels',
    socialMedia: 'Unlimited social media',
    publishing: 'Governed by Exclusive Agreement (50% Producer / 50% Licensee publishing)',
    exclusive: true,
    creditRequirement: 'Must credit "Prod. by Celly" in all metadata and descriptions',
  },
};

export const LICENSE_PLACEHOLDERS = [
  { token: '{{CUSTOMER_NAME}}', label: 'Buyer Name', description: 'Legal name or artist name of purchaser' },
  { token: '{{CUSTOMER_EMAIL}}', label: 'Buyer Email', description: 'Delivery email of purchaser' },
  { token: '{{BEAT_TITLE}}', label: 'Beat Title', description: 'Title of the purchased instrumental' },
  { token: '{{LICENSE_TYPE}}', label: 'License Tier', description: 'Name of the license tier (e.g. WAV License)' },
  { token: '{{PRICE}}', label: 'License Fee', description: 'Fee paid in USD (e.g. $59.99 USD)' },
  { token: '{{TOTAL_PAID}}', label: 'Total Paid', description: 'Final order total paid' },
  { token: '{{ORDER_ID}}', label: 'Order ID', description: 'Official transaction reference code' },
  { token: '{{LICENSE_ID}}', label: 'License ID', description: 'Cryptographic license ID' },
  { token: '{{PURCHASE_DATE}}', label: 'Purchase Date', description: 'Formatted date of transaction' },
  { token: '{{DISTRIBUTION_LIMIT}}', label: 'Distribution Cap', description: 'Allowed physical/digital unit limit' },
  { token: '{{STREAMING_LIMIT}}', label: 'Streaming Cap', description: 'Allowed audio stream play limit' },
  { token: '{{INCLUDED_FILES}}', label: 'Included Deliverables', description: 'List of audio file formats included' },
  { token: '{{PRODUCER_NAME}}', label: 'Producer Name', description: 'CELLY (Ryan Sam)' },
  { token: '{{PRODUCER_CREDIT}}', label: 'Producer Credit', description: 'Prod. by Celly' },
  { token: '{{SUPPORT_EMAIL}}', label: 'Producer Email', description: 'wspcelly@gmail.com' },
  { token: '{{ACCEPTED_AT}}', label: 'Execution Timestamp', description: 'Exact ISO timestamp of purchase' },
] as const;

export interface AgreementFillContext {
  customerName?: string;
  customerEmail?: string;
  beatTitle?: string;
  tier?: LicenseTierKey;
  price?: number;
  orderId?: string;
  licenseId?: string;
  purchaseDate?: string;
  acceptedAt?: string;
}

export function autoFillAgreement(templateText: string, context: AgreementFillContext): string {
  if (!templateText) return '';

  const tier = context.tier || 'mp3';
  const tierInfo = LICENSE_TIERS[tier] || LICENSE_TIERS.mp3;
  const priceVal = context.price !== undefined ? context.price : tierInfo.price;
  const formattedPrice = `$${priceVal.toFixed(2)} USD`;
  const name = context.customerName?.trim() || 'Valued Artist';
  const email = context.customerEmail?.trim() || 'artist@example.com';
  const beat = context.beatTitle?.trim() || 'Instrumental Work';
  const orderId = context.orderId || 'CELLY-' + Math.floor(100000 + Math.random() * 900000);
  const licenseId = context.licenseId || 'LIC-' + Math.floor(100000 + Math.random() * 900000);
  const purchaseDate =
    context.purchaseDate ||
    new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const acceptedAt = context.acceptedAt || new Date().toISOString();

  let filled = templateText;

  // 1. Direct placeholder mappings
  const directMap: Record<string, string> = {
    '{{CUSTOMER_NAME}}': name,
    '{{CUSTOMER_EMAIL}}': email,
    '{{BEAT_TITLE}}': beat,
    '{{LICENSE_TYPE}}': tierInfo.name,
    '{{PRICE}}': formattedPrice,
    '{{TOTAL_PAID}}': formattedPrice,
    '{{ORDER_ID}}': orderId,
    '{{LICENSE_ID}}': licenseId,
    '{{PURCHASE_DATE}}': purchaseDate,
    '{{LICENSE_VERSION}}': 'v1.0',
    '{{DISTRIBUTION_LIMIT}}': tierInfo.distributionLimit,
    '{{STREAMING_LIMIT}}': tierInfo.streamingLimit,
    '{{VIDEO_LIMIT}}': tierInfo.videoLimit,
    '{{RADIO_LIMIT}}': tierInfo.radioLimit,
    '{{LIVE_PERFORMANCE_TERMS}}': tierInfo.livePerformance,
    '{{YOUTUBE_TERMS}}': `${tierInfo.youtubeChannels} permitted for monetization`,
    '{{SOCIAL_MEDIA_TERMS}}': tierInfo.socialMedia,
    '{{COMMERCIAL_USE}}': 'Permitted strictly within the defined distribution and stream limits.',
    '{{PUBLISHING_TERMS}}': tierInfo.publishing,
    '{{EXCLUSIVE_STATUS}}': tierInfo.exclusive ? 'EXCLUSIVE LICENSE' : 'NON-EXCLUSIVE LICENSE',
    '{{INCLUDED_FILES}}': tierInfo.filesDescription,
    '{{PRODUCER_NAME}}': 'CELLY (Ryan Sam)',
    '{{PRODUCER_CREDIT}}': PRODUCER_CREDIT,
    '{{SUPPORT_EMAIL}}': SUPPORT_EMAIL,
    '{{ACCEPTED_AT}}': acceptedAt,
  };

  for (const [key, val] of Object.entries(directMap)) {
    filled = filled.replaceAll(key, val);
  }

  // 2. Normalize and replace flexible bracket / word patterns:
  // e.g. [Customer Name], [Artist Name], [Buyer Name], [Licensee Name], [Licensee]
  filled = filled.replace(/\[\s*(customer\s*name|artist\s*name|buyer\s*name|licensee\s*name|licensee|buyer|artist|purchaser)\s*\]/gi, name);
  filled = filled.replace(/<\s*(customer\s*name|artist\s*name|buyer\s*name|licensee\s*name|licensee|buyer|artist)\s*>/gi, name);

  // Email variants
  filled = filled.replace(/\[\s*(customer\s*email|buyer\s*email|artist\s*email|licensee\s*email|email)\s*\]/gi, email);

  // Beat Title variants
  filled = filled.replace(/\[\s*(beat\s*title|beat\s*name|song\s*title|track\s*title|instrumental\s*title|instrumental\s*name|work\s*title|composition)\s*\]/gi, `"${beat}"`);
  filled = filled.replace(/<\s*(beat\s*title|beat\s*name|track\s*title|instrumental)\s*>/gi, `"${beat}"`);

  // Date variants
  filled = filled.replace(/\[\s*(purchase\s*date|agreement\s*date|effective\s*date|date)\s*\]/gi, purchaseDate);

  // Price variants
  filled = filled.replace(/\[\s*(price|license\s*fee|fee|amount|total\s*paid|cost)\s*\]/gi, formattedPrice);

  // Order ID / License ID variants
  filled = filled.replace(/\[\s*(order\s*id|order\s*#|order\s*number|transaction\s*id)\s*\]/gi, orderId);
  filled = filled.replace(/\[\s*(license\s*id|license\s*#|license\s*number|certificate\s*id)\s*\]/gi, licenseId);

  // Producer / Licensor variants
  filled = filled.replace(/\[\s*(producer\s*name|licensor\s*name|producer|licensor)\s*\]/gi, 'CELLY (Ryan Sam)');
  filled = filled.replace(/\[\s*(producer\s*email|licensor\s*email)\s*\]/gi, SUPPORT_EMAIL);

  // 3. Safety Fallback: If the uploaded contract did NOT contain customer / beat placeholders at all,
  // automatically attach an official, legally binding Schedule A to ensure the customer and purchase details
  // are ALWAYS clearly presented and executed in the contract!
  const hasCustomerName = filled.includes(name);
  const hasBeatTitle = filled.includes(beat);

  if (!hasCustomerName || !hasBeatTitle) {
    filled = `================================================================================
CELLY BEAT LICENSE — SCHEDULE A: PURCHASE & TRANSACTION DETAILS
================================================================================
• Licensee / Artist Name: ${name}
• Licensee Email:        ${email}
• Licensed Instrumental:  "${beat}"
• License Tier Granted:   ${tierInfo.name} (${tierInfo.exclusive ? 'EXCLUSIVE' : 'NON-EXCLUSIVE'})
• Total Fee Paid:         ${formattedPrice}
• Order Reference ID:     ${orderId}
• Unique License ID:      ${licenseId}
• Purchase / Issue Date:  ${purchaseDate}
• Permitted Distribution: ${tierInfo.distributionLimit}
• Permitted Streams:      ${tierInfo.streamingLimit}
• Included Files:         ${tierInfo.filesDescription}
• Mandatory Credit:       "${PRODUCER_CREDIT}"
• Licensor / Producer:    CELLY (Ryan Sam) <${SUPPORT_EMAIL}>
• Digital Signature Seal: VERIFIED & EXECUTED AT ${acceptedAt}
================================================================================

` + filled;
  }

  return filled;
}

export function injectPurchaseScheduleTemplate(existingText: string): string {
  const scheduleBlock = `================================================================================
CELLY BEAT LICENSE — SCHEDULE A: PURCHASE & TRANSACTION DETAILS
================================================================================
• Licensee / Artist Name: {{CUSTOMER_NAME}}
• Licensee Email:        {{CUSTOMER_EMAIL}}
• Licensed Instrumental:  "{{BEAT_TITLE}}"
• License Tier Granted:   {{LICENSE_TYPE}} ({{EXCLUSIVE_STATUS}})
• Total Fee Paid:         {{PRICE}}
• Order Reference ID:     {{ORDER_ID}}
• Unique License ID:      {{LICENSE_ID}}
• Purchase / Issue Date:  {{PURCHASE_DATE}}
• Permitted Distribution: {{DISTRIBUTION_LIMIT}}
• Permitted Streams:      {{STREAMING_LIMIT}}
• Included Deliverables:  {{INCLUDED_FILES}}
• Mandatory Credit:       "{{PRODUCER_CREDIT}}"
• Licensor / Producer:    {{PRODUCER_NAME}} <{{SUPPORT_EMAIL}}>
• Digital Signature Seal: VERIFIED & EXECUTED AT {{ACCEPTED_AT}}
================================================================================

`;

  if (existingText.includes('{{CUSTOMER_NAME}}') && existingText.includes('{{BEAT_TITLE}}')) {
    return existingText;
  }
  return scheduleBlock + existingText;
}

