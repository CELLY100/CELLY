import { jsPDF } from 'jspdf';
import fs from 'fs';
import path from 'path';

export interface GeneratePdfOptions {
  orderId: string;
  licenseId: string;
  customerName: string;
  customerEmail: string;
  beatTitle: string;
  licenseType: string;
  version: string;
  pricePaid: number;
  acceptedAt: string;
  agreementText: string;
}

export async function generateLicenseAgreementPdf(
  options: GeneratePdfOptions,
  outputDir: string
): Promise<string> {
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'pt',
    format: 'letter',
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 40;
  const maxLineWidth = pageWidth - margin * 2;

  // Header Banner
  doc.setFillColor(15, 17, 23); // #0f1117
  doc.rect(0, 0, pageWidth, 85, 'F');

  // Accent Line
  doc.setFillColor(217, 119, 6); // Amber-600
  doc.rect(0, 85, pageWidth, 3, 'F');

  // Brand Name
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(24);
  doc.text('CELLY', margin, 42);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 200, 210);
  doc.text('PRODUCER & MASTERING ENGINEER | OFFICIAL LICENSE CERTIFICATE', margin, 58);
  doc.text('Contact: wspcelly@gmail.com | Credit: "Prod. by Celly"', margin, 72);

  // Metadata Card
  let currentY = 110;
  doc.setFillColor(245, 246, 250);
  doc.roundedRect(margin, currentY, maxLineWidth, 65, 4, 4, 'F');
  doc.setDrawColor(220, 225, 235);
  doc.roundedRect(margin, currentY, maxLineWidth, 65, 4, 4, 'S');

  doc.setFontSize(9);
  doc.setTextColor(50, 50, 60);

  doc.setFont('helvetica', 'bold');
  doc.text('ORDER ID:', margin + 15, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(options.orderId, margin + 75, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('LICENSE ID:', margin + 240, currentY + 18);
  doc.setFont('helvetica', 'normal');
  doc.text(options.licenseId, margin + 310, currentY + 18);

  doc.setFont('helvetica', 'bold');
  doc.text('LICENSEE:', margin + 15, currentY + 36);
  doc.setFont('helvetica', 'normal');
  doc.text(`${options.customerName} (${options.customerEmail})`, margin + 75, currentY + 36);

  doc.setFont('helvetica', 'bold');
  doc.text('WORK TITLE:', margin + 15, currentY + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`"${options.beatTitle}" — ${options.licenseType} (v${options.version})`, margin + 95, currentY + 54);

  doc.setFont('helvetica', 'bold');
  doc.text('FEE PAID:', margin + 380, currentY + 54);
  doc.setFont('helvetica', 'normal');
  doc.text(`$${options.pricePaid.toFixed(2)} USD`, margin + 440, currentY + 54);

  currentY += 85;

  // Body Agreement Text
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(30, 30, 40);

  const lines = doc.splitTextToSize(options.agreementText, maxLineWidth);
  const lineHeight = 12;

  for (let i = 0; i < lines.length; i++) {
    if (currentY + lineHeight > pageHeight - 50) {
      // Add page
      doc.setFontSize(8);
      doc.setTextColor(140, 140, 150);
      doc.text(`CELLY Official License — ${options.licenseId}`, margin, pageHeight - 25);
      doc.text(`Page ${doc.getNumberOfPages()}`, pageWidth - margin - 35, pageHeight - 25);

      doc.addPage();
      currentY = 40;
      doc.setFontSize(8.5);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 40);
    }

    const line = lines[i];
    // Check if line looks like section heading
    if (/^\d+\.\s+[A-Z\s/&]+$/.test(line.trim())) {
      doc.setFont('helvetica', 'bold');
      doc.setTextColor(15, 23, 42);
      currentY += 4;
      doc.text(line, margin, currentY);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(30, 30, 40);
    } else {
      doc.text(line, margin, currentY);
    }
    currentY += lineHeight;
  }

  // Footer Acceptance Stamp
  if (currentY + 50 > pageHeight - 40) {
    doc.addPage();
    currentY = 40;
  }

  currentY += 15;
  doc.setFillColor(240, 245, 240);
  doc.roundedRect(margin, currentY, maxLineWidth, 45, 4, 4, 'F');
  doc.setDrawColor(180, 220, 180);
  doc.roundedRect(margin, currentY, maxLineWidth, 45, 4, 4, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(20, 100, 40);
  doc.text('✓ ELECTRONICALLY VERIFIED AND LEGALLY EXECUTED', margin + 15, currentY + 18);

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(60, 80, 60);
  doc.text(
    `Accepted by ${options.customerName} on ${options.acceptedAt}. Cryptographically referenced in CELLY Audit Ledger.`,
    margin + 15,
    currentY + 32
  );

  const totalPages = doc.getNumberOfPages();
  for (let p = 1; p <= totalPages; p++) {
    doc.setPage(p);
    doc.setFontSize(8);
    doc.setTextColor(140, 140, 150);
    doc.text(`CELLY Official License — ${options.licenseId}`, margin, pageHeight - 20);
    doc.text(`Page ${p} of ${totalPages}`, pageWidth - margin - 50, pageHeight - 20);
  }

  const filename = `License_${options.licenseId}.pdf`;
  const filePath = path.join(outputDir, filename);
  const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
  fs.writeFileSync(filePath, pdfBuffer);

  return filename;
}
