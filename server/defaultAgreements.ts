/**
 * Official CELLY License Agreement Templates
 * Admin controlled source of truth with strict dynamic placeholders
 */

export const DEFAULT_AGREEMENT_TEMPLATES: Record<string, { title: string; version: string; templateText: string }> = {
  mp3: {
    title: 'MP3 License Agreement',
    version: '1.0',
    templateText: `CELLY BEAT LICENSE AGREEMENT — MP3 LICENSE

1. PURCHASE INFORMATION
Order ID: {{ORDER_ID}}
License ID: {{LICENSE_ID}}
Date of Purchase: {{PURCHASE_DATE}}
Licensee Name: {{CUSTOMER_NAME}}
Licensee Email: {{CUSTOMER_EMAIL}}
Licensor: CELLY ("Producer")
Work Title: "{{BEAT_TITLE}}"
License Type: {{LICENSE_TYPE}}
Agreement Version: {{LICENSE_VERSION}}
Total Fee Paid: {{TOTAL_PAID}}

2. LICENSE GRANT
Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a non-exclusive, non-transferable, revocable license to use the musical composition and sound recording entitled "{{BEAT_TITLE}}" ("Beat") for the creation of one (1) new derivative vocal or instrumental master recording ("New Song").

3. INCLUDED FILES
The Licensee is entitled to receive:
{{INCLUDED_FILES}}
Explicitly excluded from this license: WAV audio files, individual stem/trackout files, DAW project files (FL Studio, Ableton, Logic, Pro Tools), MIDI data, synth presets, plugins, and raw sample libraries.

4. COMMERCIAL USE
{{COMMERCIAL_USE}}

5. DISTRIBUTION LIMIT
Licensee may distribute up to: {{DISTRIBUTION_LIMIT}}.
Any physical or digital reproduction, manufacture, or sale exceeding this threshold requires a license upgrade.

6. AUDIO STREAMING LIMIT
Total permitted audio streams across all digital service providers (Spotify, Apple Music, Tidal, Amazon Music, etc.): {{STREAMING_LIMIT}}.

7. MUSIC VIDEO LIMIT
Permitted music videos: {{VIDEO_LIMIT}}.

8. RADIO / BROADCAST
Broadcasting rights: {{RADIO_LIMIT}}.

9. LIVE PERFORMANCE
Live performance terms: {{LIVE_PERFORMANCE_TERMS}}.

10. YOUTUBE / VIDEO PLATFORMS
Video platform monetization: {{YOUTUBE_TERMS}}.
Content ID registration: Strictly prohibited. Licensee may NOT submit the New Song to YouTube Content ID, Facebook Rights Manager, or any automated digital fingerprinting service.

11. SOCIAL MEDIA
Social media usage: {{SOCIAL_MEDIA_TERMS}}.

12. PRODUCER CREDIT
Licensee agrees to give mandatory production credit to the Producer on all commercial releases, liner notes, digital metadata, video descriptions, and promotional materials in the exact form:
"Prod. by Celly"

13. PUBLISHING & ROYALTIES
Publishing split: {{PUBLISHING_TERMS}}.
Licensor retains 50% of the Writer's Share and Publisher's Share for the musical composition. Licensee receives 50% for their original lyrical and vocal contributions.

14. EXCLUSIVE / NON-EXCLUSIVE STATUS
Status: {{EXCLUSIVE_STATUS}}.
Licensor retains full right and discretion to continue marketing, selling, and issuing non-exclusive licenses for the Beat to third parties, or subsequently sell the Beat under an Exclusive License. Prior valid non-exclusive licenses remain valid upon any subsequent exclusive purchase.

15. STRICT RESTRICTIONS
Licensee is strictly prohibited from:
- Reselling, sublicensing, or redistributing the Beat as a standalone instrumental.
- Uploading the Beat to any beat store, marketplace, or sound library.
- Claiming sole authorship or copyright ownership of the underlying Beat.
- Selling producer stems, project files, MIDI, presets, or samples.
- Registering the Beat or derivative work with YouTube Content ID or automated fingerprinting databases.

16. SUPPORT & CONTACT
For license verification, support, or upgrades, contact:
CELLY
Email: wspcelly@gmail.com

17. AGREEMENT ACCEPTANCE
This Agreement was affirmatively reviewed and electronically accepted by Licensee at checkout.
Accepted At: {{ACCEPTED_AT}}`,
  },

  wav: {
    title: 'WAV License Agreement',
    version: '1.0',
    templateText: `CELLY BEAT LICENSE AGREEMENT — WAV LICENSE

1. PURCHASE INFORMATION
Order ID: {{ORDER_ID}}
License ID: {{LICENSE_ID}}
Date of Purchase: {{PURCHASE_DATE}}
Licensee Name: {{CUSTOMER_NAME}}
Licensee Email: {{CUSTOMER_EMAIL}}
Licensor: CELLY ("Producer")
Work Title: "{{BEAT_TITLE}}"
License Type: {{LICENSE_TYPE}}
Agreement Version: {{LICENSE_VERSION}}
Total Fee Paid: {{TOTAL_PAID}}

2. LICENSE GRANT
Subject to the terms and conditions of this Agreement, Licensor grants to Licensee a non-exclusive, non-transferable license to use the musical composition and sound recording entitled "{{BEAT_TITLE}}" ("Beat") for the creation of one (1) new derivative recording ("New Song").

3. INCLUDED FILES
The Licensee is entitled to receive:
{{INCLUDED_FILES}}
Explicitly excluded: Individual stem/trackout files, DAW project files, MIDI data, presets, plugins, and raw sample libraries.

4. COMMERCIAL USE
{{COMMERCIAL_USE}}

5. DISTRIBUTION LIMIT
Licensee may distribute up to: {{DISTRIBUTION_LIMIT}}.

6. AUDIO STREAMING LIMIT
Total permitted audio streams across all digital service providers: {{STREAMING_LIMIT}}.

7. MUSIC VIDEO LIMIT
Permitted music videos: {{VIDEO_LIMIT}}.

8. RADIO / BROADCAST
Broadcasting rights: {{RADIO_LIMIT}}.

9. LIVE PERFORMANCE
Live performance terms: {{LIVE_PERFORMANCE_TERMS}}.

10. YOUTUBE / VIDEO PLATFORMS
Video platform monetization: {{YOUTUBE_TERMS}}.
Content ID registration: Strictly prohibited.

11. SOCIAL MEDIA
Social media usage: {{SOCIAL_MEDIA_TERMS}}.

12. PRODUCER CREDIT
Licensee agrees to give mandatory production credit to the Producer on all commercial releases in the exact form:
"Prod. by Celly"

13. PUBLISHING & ROYALTIES
Publishing split: {{PUBLISHING_TERMS}}.
Licensor retains 50% Writer's/Publisher's share; Licensee retains 50%.

14. EXCLUSIVE / NON-EXCLUSIVE STATUS
Status: {{EXCLUSIVE_STATUS}}.
Licensor retains full right to continue non-exclusive licensing or execute an exclusive sale.

15. STRICT RESTRICTIONS
Licensee is strictly prohibited from reselling, sublicensing, or distributing the Beat as a standalone instrumental, or registering with YouTube Content ID.

16. SUPPORT & CONTACT
CELLY
Email: wspcelly@gmail.com

17. AGREEMENT ACCEPTANCE
Accepted At: {{ACCEPTED_AT}}`,
  },

  premium: {
    title: 'Premium / Trackout License Agreement',
    version: '1.0',
    templateText: `CELLY BEAT LICENSE AGREEMENT — PREMIUM / TRACKOUT LICENSE

1. PURCHASE INFORMATION
Order ID: {{ORDER_ID}}
License ID: {{LICENSE_ID}}
Date of Purchase: {{PURCHASE_DATE}}
Licensee Name: {{CUSTOMER_NAME}}
Licensee Email: {{CUSTOMER_EMAIL}}
Licensor: CELLY ("Producer")
Work Title: "{{BEAT_TITLE}}"
License Type: {{LICENSE_TYPE}}
Agreement Version: {{LICENSE_VERSION}}
Total Fee Paid: {{TOTAL_PAID}}

2. LICENSE GRANT
Licensor hereby grants to Licensee a non-exclusive license to use the Beat "{{BEAT_TITLE}}" including individual stem/trackout files for creating one (1) new derivative recording.

3. INCLUDED FILES
{{INCLUDED_FILES}}
Excluded: DAW project files (FL Studio, Ableton, etc.), private MIDI data, plugins, presets, and private production assets.

4. COMMERCIAL USE
{{COMMERCIAL_USE}}

5. DISTRIBUTION LIMIT
Distribution limit: {{DISTRIBUTION_LIMIT}}.

6. AUDIO STREAMING LIMIT
Streaming limit: {{STREAMING_LIMIT}}.

7. MUSIC VIDEO LIMIT
Music video limit: {{VIDEO_LIMIT}}.

8. RADIO / BROADCAST
Broadcast rights: {{RADIO_LIMIT}}.

9. LIVE PERFORMANCE
Live performance: {{LIVE_PERFORMANCE_TERMS}}.

10. YOUTUBE / VIDEO PLATFORMS
YouTube terms: {{YOUTUBE_TERMS}}.

11. SOCIAL MEDIA
Social media: {{SOCIAL_MEDIA_TERMS}}.

12. PRODUCER CREDIT
Mandatory credit everywhere:
"Prod. by Celly"

13. PUBLISHING & ROYALTIES
{{PUBLISHING_TERMS}} (50% Producer / 50% Licensee).

14. EXCLUSIVE / NON-EXCLUSIVE STATUS
{{EXCLUSIVE_STATUS}}.

15. RESTRICTIONS
Stem files may only be used to arrange and mix the New Song. Standalone release, resale, or sampling of isolated stems is strictly prohibited.

16. SUPPORT & CONTACT
CELLY
Email: wspcelly@gmail.com

17. AGREEMENT ACCEPTANCE
Accepted At: {{ACCEPTED_AT}}`,
  },

  unlimited: {
    title: 'Unlimited License Agreement',
    version: '1.0',
    templateText: `CELLY BEAT LICENSE AGREEMENT — UNLIMITED LICENSE

1. PURCHASE INFORMATION
Order ID: {{ORDER_ID}}
License ID: {{LICENSE_ID}}
Date of Purchase: {{PURCHASE_DATE}}
Licensee Name: {{CUSTOMER_NAME}}
Licensee Email: {{CUSTOMER_EMAIL}}
Licensor: CELLY ("Producer")
Work Title: "{{BEAT_TITLE}}"
License Type: {{LICENSE_TYPE}}
Agreement Version: {{LICENSE_VERSION}}
Total Fee Paid: {{TOTAL_PAID}}

2. LICENSE GRANT
Licensor grants Licensee a non-exclusive license with unlimited commercial exploitation rights for "{{BEAT_TITLE}}".

3. INCLUDED FILES
{{INCLUDED_FILES}}

4. COMMERCIAL USE
{{COMMERCIAL_USE}}

5. DISTRIBUTION LIMIT
{{DISTRIBUTION_LIMIT}} (Unlimited physical and digital units worldwide).

6. AUDIO STREAMING LIMIT
{{STREAMING_LIMIT}} (Unlimited monetized streams worldwide).

7. MUSIC VIDEO LIMIT
{{VIDEO_LIMIT}} (Unlimited music videos).

8. RADIO / BROADCAST
{{RADIO_LIMIT}} (Unlimited commercial terrestrial, satellite, and digital radio broadcast).

9. LIVE PERFORMANCE
{{LIVE_PERFORMANCE_TERMS}} (Unlimited profitable live shows).

10. YOUTUBE
{{YOUTUBE_TERMS}} (Unlimited monetized channels). Content ID registration is prohibited.

11. SOCIAL MEDIA
{{SOCIAL_MEDIA_TERMS}} (Unlimited videos and posts).

12. PRODUCER CREDIT
Mandatory credit:
"Prod. by Celly"

13. PUBLISHING & ROYALTIES
{{PUBLISHING_TERMS}} (50% Producer / 50% Licensee).

14. EXCLUSIVE / NON-EXCLUSIVE STATUS
{{EXCLUSIVE_STATUS}}.
IMPORTANT: Unlimited does NOT mean exclusive. Unlimited does NOT transfer copyright ownership. The beat can continue to be licensed to other customers, and may later be sold under an Exclusive License without invalidating this agreement.

15. RESTRICTIONS
Resale or redistribution of the standalone beat, stems, or project assets is strictly forbidden.

16. SUPPORT & CONTACT
CELLY
Email: wspcelly@gmail.com

17. AGREEMENT ACCEPTANCE
Accepted At: {{ACCEPTED_AT}}`,
  },

  exclusive: {
    title: 'Exclusive License Agreement',
    version: '1.0',
    templateText: `CELLY BEAT LICENSE AGREEMENT — EXCLUSIVE LICENSE

1. PURCHASE INFORMATION
Order ID: {{ORDER_ID}}
License ID: {{LICENSE_ID}}
Date of Purchase: {{PURCHASE_DATE}}
Licensee Name: {{CUSTOMER_NAME}}
Licensee Email: {{CUSTOMER_EMAIL}}
Licensor: CELLY ("Producer")
Work Title: "{{BEAT_TITLE}}"
License Type: {{LICENSE_TYPE}}
Agreement Version: {{LICENSE_VERSION}}
Total Fee Paid: {{TOTAL_PAID}}

2. LICENSE GRANT & EXCLUSIVE RIGHTS
Licensor grants to Licensee EXCLUSIVE, worldwide rights to the sound recording and musical composition entitled "{{BEAT_TITLE}}" ("Beat"). Upon confirmed verification of payment, the Beat is immediately removed from the public store and marked EXCLUSIVE_SOLD. No further licenses will ever be granted for this Beat.

3. PRIOR NON-EXCLUSIVE LICENSES PRESERVED
Licensee acknowledges and accepts that any non-exclusive licenses granted prior to the execution of this Exclusive Agreement remain in full legal force and effect according to their individual terms until expiration.

4. INCLUDED FILES
{{INCLUDED_FILES}}
Excluded: Internal FL Studio / DAW session project files, internal plugins, custom presets, and raw sample libraries unless separately contracted in writing.

5. COMMERCIAL USE
{{COMMERCIAL_USE}} (Unlimited commercial use worldwide in perpetuity).

6. DISTRIBUTION LIMIT
{{DISTRIBUTION_LIMIT}} (Unlimited).

7. AUDIO STREAMING LIMIT
{{STREAMING_LIMIT}} (Unlimited).

8. MUSIC VIDEO LIMIT
{{VIDEO_LIMIT}} (Unlimited).

9. RADIO / BROADCAST
{{RADIO_LIMIT}} (Unlimited).

10. LIVE PERFORMANCE
{{LIVE_PERFORMANCE_TERMS}} (Unlimited).

11. YOUTUBE & DIGITAL FINGERPRINTING
{{YOUTUBE_TERMS}}. Licensee may register the derivative New Song with Content ID provided previous non-exclusive licensees are protected from wrongful copyright strikes.

12. PRODUCER CREDIT
Mandatory production credit in all releases, video titles, and liner notes:
"Prod. by Celly"

13. PUBLISHING & ROYALTIES
{{PUBLISHING_TERMS}}.
Unless a separate buyout agreement is executed, Producer retains 50% Writer's share and 50% Publisher's share of the composition. Licensee retains 50% Writer's share and 50% Publisher's share.

14. EXCLUSIVE / NON-EXCLUSIVE STATUS
{{EXCLUSIVE_STATUS}}.
Sole and exclusive commercial licensing rights belong exclusively to Licensee.

15. RESTRICTIONS
Licensee may not sell or sublicense the instrumental beat as an unvocalized standalone instrumental to third-party beat buyers.

16. COPYRIGHT OWNERSHIP
Exclusive purchase transfers exclusive commercial exploitation rights; underlying compositional copyright remains governed by the 50/50 publishing split unless explicitly assigned via a separate signed assignment instrument.

17. SUPPORT & CONTACT
CELLY
Email: wspcelly@gmail.com

18. AGREEMENT ACCEPTANCE
This Agreement was affirmatively reviewed and electronically accepted by Licensee at checkout.
Accepted At: {{ACCEPTED_AT}}`,
  },
};
