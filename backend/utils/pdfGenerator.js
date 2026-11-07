let PDFDocument;
try {
  PDFDocument = require('pdfkit');
} catch (e) {
  PDFDocument = require('pdfkit/js/pdfkit.js');
}

/**
 * Format currency in Indian Rupees style (without non-ASCII symbol in standard PDF fonts)
 * e.g. "INR 12,450.00"
 */
const formatINR = (val) => {
  const num = Number(val) || 0;
  return 'INR ' + num.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

/**
 * Format date nicely e.g. "15 Oct 2026"
 */
const formatDate = (dateStr) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
};

/**
 * Generate a professional A4 Tax Invoice PDF using PDFKit
 *
 * @param {Object} invoice - The Mongoose Invoice document / object
 * @param {Object} business - The issuing Business Owner user document / object
 * @param {Stream} dataCallback - Function or Writable stream
 * @returns {Promise<Buffer>} - Resolves with PDF Buffer
 */
const generateInvoicePDF = (invoice, business = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4', // 595.28 x 841.89 points
        margin: 40,
        info: {
          Title: `Tax Invoice - ${invoice.invoiceNumber || 'INV'}`,
          Author: business.companyName || business.name || 'BillFlow Platform',
          Subject: 'Tax Invoice',
          Keywords: 'invoice, billing, tax, gst',
          CreationDate: new Date(),
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      // Color Palette (Design System)
      const primaryBlue = '#2563EB';
      const darkNavy = '#172554';
      const textMain = '#1F2937';
      const textMuted = '#64748B';
      const borderColor = '#E2E8F0';
      const bgLight = '#F8FAFC';
      const statusGreen = '#16A34A';
      const statusAmber = '#D97706';
      const statusRed = '#DC2626';

      const pageWidth = doc.page.width; // 595.28
      const margin = 40;
      const contentWidth = pageWidth - margin * 2; // 515.28

      // =========================================================================
      // 1. TOP HEADER: BRANDING & INVOICE TITLE
      // =========================================================================
      let y = 40;

      // Stylized Company Logo / Emblem Box
      doc.rect(margin, y, 42, 42).fill(primaryBlue);
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('BF', margin, y + 10, { width: 42, align: 'center' });

      // Company Info (Left Header)
      const bizName = business.companyName || business.businessName || business.name || 'Apex Enterprises Pvt Ltd';
      const bizTaxId = business.taxId || '29ABCDE1234F1Z5';
      const bizEmail = business.email || 'billing@apexenterprises.com';
      const bizPhone = business.phone || '+91 98765 43210';
      const bizAddress = business.businessAddress
        ? [
            business.businessAddress.street,
            business.businessAddress.city,
            business.businessAddress.state,
            business.businessAddress.zipCode,
          ].filter(Boolean).join(', ')
        : 'Tech Park, Whitefield, Bengaluru, Karnataka - 560066';

      doc
        .fillColor(darkNavy)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(bizName, margin + 52, y);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textMuted)
        .text(`GSTIN / Tax ID: ${bizTaxId}`, margin + 52, y + 17)
        .text(`Email: ${bizEmail}  |  Phone: ${bizPhone}`, margin + 52, y + 28)
        .text(bizAddress, margin + 52, y + 39, { width: 240 });

      // Invoice Title & Meta (Right Header)
      doc
        .fillColor(primaryBlue)
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('TAX INVOICE', margin, y, { width: contentWidth, align: 'right' });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(darkNavy)
        .text(invoice.invoiceNumber || 'INV-2026-001', margin, y + 22, {
          width: contentWidth,
          align: 'right',
        });

      // Status Badge (Right aligned)
      const invStatus = (invoice.status || 'SENT').toUpperCase();
      let statusColor = primaryBlue;
      if (invStatus === 'PAID') statusColor = statusGreen;
      if (invStatus === 'PARTIALLY PAID' || invStatus === 'DRAFT') statusColor = statusAmber;
      if (invStatus === 'OVERDUE' || invStatus === 'CANCELLED') statusColor = statusRed;

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(statusColor)
        .text(`STATUS: ${invStatus}`, margin, y + 38, {
          width: contentWidth,
          align: 'right',
        });

      // Top Divider
      y = 100;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke();

      // =========================================================================
      // 2. CLIENT "BILLED TO" & INVOICE DETAILS GRID
      // =========================================================================
      y += 12;

      // Left Box: Billed To Customer
      doc
        .fillColor(textMuted)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('BILLED TO (CLIENT):', margin, y);

      const custName = invoice.customerName || (invoice.customer && invoice.customer.name) || 'Customer Client';
      const custGstin = invoice.customerGstin || (invoice.customer && invoice.customer.gstin) || '—';
      const custEmail = invoice.customerEmail || (invoice.customer && invoice.customer.email) || '';
      let custAddr = '—';
      if (typeof invoice.billingAddress === 'string' && invoice.billingAddress) {
        custAddr = invoice.billingAddress;
      } else if (invoice.billingAddress && typeof invoice.billingAddress === 'object') {
        custAddr = [
          invoice.billingAddress.street,
          invoice.billingAddress.city,
          invoice.billingAddress.state,
          invoice.billingAddress.zipCode,
        ].filter(Boolean).join(', ') || '—';
      }

      doc
        .fillColor(darkNavy)
        .font('Helvetica-Bold')
        .fontSize(10.5)
        .text(custName, margin, y + 12);

      let custY = y + 26;
      if (custGstin && custGstin !== '—') {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(textMain)
          .text(`GSTIN: ${custGstin}`, margin, custY);
        custY += 11;
      }

      if (custEmail) {
        doc
          .font('Helvetica')
          .fontSize(8.5)
          .fillColor(textMuted)
          .text(`Email: ${custEmail}`, margin, custY);
        custY += 11;
      }

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textMuted)
        .text(custAddr, margin, custY, { width: 230 });

      // Right Box: Invoice Dates & Metadata
      const rightX = margin + 270;
      const metaWidth = contentWidth - 270;

      const printMetaRow = (label, val, rowY, isBold = false) => {
        doc
          .fillColor(textMuted)
          .font('Helvetica')
          .fontSize(8.5)
          .text(label, rightX, rowY);
        doc
          .fillColor(darkNavy)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .text(val, rightX, rowY, { width: metaWidth, align: 'right' });
      };

      printMetaRow('Invoice Date:', formatDate(invoice.invoiceDate), y + 5);
      printMetaRow('Due Date:', formatDate(invoice.dueDate), y + 18);
      printMetaRow('Payment Terms:', invoice.paymentTerms || 'Net 15 Days', y + 31);
      printMetaRow('Transaction Type:', invoice.transactionType || 'Intra-State (CGST + SGST)', y + 44, true);

      // Divider before items table
      y = 180;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke();

      // =========================================================================
      // 3. PRODUCTS & SERVICES ITEMS TABLE
      // =========================================================================
      y += 8;

      // Table Header Row Background
      doc.rect(margin, y, contentWidth, 22).fill(bgLight);

      // Column Layout Positions
      const col = {
        idx: margin + 8,
        desc: margin + 30,
        code: margin + 225,
        qty: margin + 280,
        rate: margin + 325,
        disc: margin + 380,
        tax: margin + 430,
        total: margin + 465,
      };

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(darkNavy)
        .text('#', col.idx, y + 6)
        .text('ITEM DESCRIPTION', col.desc, y + 6)
        .text('HSN/SAC', col.code, y + 6)
        .text('QTY', col.qty, y + 6, { width: 35, align: 'center' })
        .text('UNIT (INR)', col.rate, y + 6, { width: 50, align: 'right' })
        .text('DISC', col.disc, y + 6, { width: 45, align: 'right' })
        .text('GST %', col.tax, y + 6, { width: 30, align: 'center' })
        .text('TOTAL', col.total, y + 6, { width: 45, align: 'right' });

      y += 24;

      // Table Rows
      const items = invoice.items || [];
      items.forEach((item, index) => {
        // Alternating row background for clean readability
        if (index % 2 === 1) {
          doc.rect(margin, y - 2, contentWidth, 20).fill('#FAFCFE');
        }

        const qty = item.quantity || 1;
        const rate = item.unitPrice || 0;
        const disc = item.discount || 0;
        const taxRate = item.taxRate !== undefined ? item.taxRate : 18;
        const rowTotal = item.amount || (qty * rate - disc);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(String(index + 1), col.idx, y);

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(darkNavy)
          .text(item.description || 'Deliverable Item', col.desc, y, {
            width: 190,
            ellipsis: true,
          });

        doc
          .font('Helvetica')
          .fontSize(7.5)
          .fillColor(textMuted)
          .text(item.productCode || '998313', col.code, y);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMain)
          .text(String(qty), col.qty, y, { width: 35, align: 'center' });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMain)
          .text(rate.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col.rate, y, {
            width: 50,
            align: 'right',
          });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(disc > 0 ? disc.toFixed(0) : '—', col.disc, y, {
            width: 45,
            align: 'right',
          });

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMain)
          .text(`${taxRate}%`, col.tax, y, { width: 30, align: 'center' });

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(darkNavy)
          .text(rowTotal.toLocaleString('en-IN', { minimumFractionDigits: 2 }), col.total, y, {
            width: 45,
            align: 'right',
          });

        y += 20;

        // Subtle row separator
        doc
          .strokeColor(borderColor)
          .lineWidth(0.5)
          .moveTo(margin, y - 2)
          .lineTo(pageWidth - margin, y - 2)
          .stroke();
      });

      // =========================================================================
      // 4. SUMMARY TOTALS & TAX BREAKDOWN (BOTTOM SECTION)
      // =========================================================================
      y += 10;

      // Left Box: Notes & Terms
      const notesWidth = 260;
      doc
        .rect(margin, y, notesWidth, 110)
        .fillAndStroke(bgLight, borderColor);

      doc
        .font('Helvetica-Bold')
        .fontSize(8)
        .fillColor(darkNavy)
        .text('NOTES & PAYMENT INSTRUCTIONS:', margin + 10, y + 8);

      const notesText = invoice.notes || 'Thank you for your business. Please remit payment on or before the due date.';
      const termsText = invoice.terms || 'Interest @ 18% per annum will be charged if payment is delayed beyond due date.';

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(notesText, margin + 10, y + 22, { width: notesWidth - 20 })
        .font('Helvetica-Bold')
        .text('TERMS & CONDITIONS:', margin + 10, y + 54)
        .font('Helvetica')
        .text(termsText, margin + 10, y + 66, { width: notesWidth - 20 })
        .text('Authorized Signatory: Computer Generated Document', margin + 10, y + 94);

      // Right Box: Calculations Breakdown
      const sumX = margin + 280;
      const sumWidth = contentWidth - 280;

      const printSummaryRow = (label, val, rowY, isBold = false, valColor = textMain) => {
        doc
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .fillColor(textMuted)
          .text(label, sumX, rowY);

        doc
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .fillColor(valColor)
          .text(val, sumX, rowY, { width: sumWidth, align: 'right' });
      };

      let sumY = y;
      printSummaryRow('Subtotal:', formatINR(invoice.subtotal), sumY);
      sumY += 14;

      if (invoice.discount > 0) {
        printSummaryRow('Total Discount:', `- ${formatINR(invoice.discount)}`, sumY, false, textMuted);
        sumY += 14;
      }

      printSummaryRow('Taxable Amount:', formatINR(invoice.taxableAmount || (invoice.subtotal - invoice.discount)), sumY, true);
      sumY += 14;

      // Tax split: CGST + SGST or IGST
      if (invoice.transactionType === 'Inter-State' || invoice.igst > 0) {
        printSummaryRow('IGST (Integrated Tax):', formatINR(invoice.igst || invoice.taxTotal), sumY, false, primaryBlue);
        sumY += 14;
      } else {
        const cgst = invoice.cgst !== undefined ? invoice.cgst : (invoice.taxTotal / 2);
        const sgst = invoice.sgst !== undefined ? invoice.sgst : (invoice.taxTotal / 2);
        printSummaryRow('CGST (Central Tax):', formatINR(cgst), sumY, false, primaryBlue);
        sumY += 14;
        printSummaryRow('SGST (State Tax):', formatINR(sgst), sumY, false, primaryBlue);
        sumY += 14;
      }

      printSummaryRow('Total Tax (GST):', formatINR(invoice.taxTotal), sumY, true);
      sumY += 18;

      // Grand Total Highlight Banner
      doc
        .rect(sumX - 5, sumY - 4, sumWidth + 10, 26)
        .fill('#EFF6FF');
      doc
        .strokeColor('#BFDBFE')
        .lineWidth(1)
        .rect(sumX - 5, sumY - 4, sumWidth + 10, 26)
        .stroke();

      doc
        .font('Helvetica-Bold')
        .fontSize(10)
        .fillColor(darkNavy)
        .text('GRAND TOTAL:', sumX, sumY + 3);

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(primaryBlue)
        .text(formatINR(invoice.totalAmount), sumX, sumY + 2, {
          width: sumWidth,
          align: 'right',
        });

      sumY += 30;

      // Paid Amount
      printSummaryRow('Amount Paid:', formatINR(invoice.paidAmount), sumY, true, statusGreen);
      sumY += 15;

      // Balance Due
      const balance = invoice.balanceDue !== undefined ? invoice.balanceDue : (invoice.totalAmount - invoice.paidAmount);
      printSummaryRow('Balance Due:', formatINR(balance), sumY, true, balance > 0 ? statusRed : statusGreen);

      // =========================================================================
      // 5. FOOTER
      // =========================================================================
      const footerY = doc.page.height - 45;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(
          'This is a verified computer generated Tax Invoice issued under Indian GST Rules. No physical signature required.',
          margin,
          footerY + 8,
          { width: contentWidth, align: 'center' }
        )
        .text(
          `Page 1 of 1 • BillFlow Invoicing Platform • Document ID: ${invoice._id}`,
          margin,
          footerY + 18,
          { width: contentWidth, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

/**
 * Generate a professional A4 Credit Note PDF using PDFKit
 *
 * @param {Object} creditNote - The Mongoose CreditNote document
 * @param {Object} business - The issuing Business Owner user
 * @returns {Promise<Buffer>} - Resolves with PDF Buffer
 */
const generateCreditNotePDF = (creditNote, business = {}) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 40,
        info: {
          Title: `Credit Note - ${creditNote.creditNoteNumber || 'CN'}`,
          Author: business.companyName || business.name || 'BillFlow Platform',
          Subject: 'Credit Note',
          CreationDate: new Date(),
        },
      });

      const buffers = [];
      doc.on('data', (chunk) => buffers.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(buffers)));
      doc.on('error', (err) => reject(err));

      const primaryAmber = '#D97706';
      const darkNavy = '#172554';
      const textMain = '#1F2937';
      const textMuted = '#64748B';
      const borderColor = '#E2E8F0';
      const bgLight = '#F8FAFC';

      const pageWidth = doc.page.width;
      const margin = 40;
      const contentWidth = pageWidth - margin * 2;

      let y = 40;

      // Stylized Emblem Box
      doc.rect(margin, y, 42, 42).fill(primaryAmber);
      doc
        .fillColor('#FFFFFF')
        .font('Helvetica-Bold')
        .fontSize(20)
        .text('CN', margin, y + 10, { width: 42, align: 'center' });

      // Company Info (Left)
      const bizName = business.companyName || business.businessName || business.name || 'Apex Enterprises Pvt Ltd';
      const bizTaxId = business.taxId || '29ABCDE1234F1Z5';
      const bizEmail = business.email || 'billing@apexenterprises.com';
      const bizPhone = business.phone || '+91 98765 43210';
      const bizAddress = business.businessAddress
        ? [
            business.businessAddress.street,
            business.businessAddress.city,
            business.businessAddress.state,
            business.businessAddress.zipCode,
          ].filter(Boolean).join(', ')
        : 'Tech Park, Whitefield, Bengaluru, Karnataka - 560066';

      doc
        .fillColor(darkNavy)
        .font('Helvetica-Bold')
        .fontSize(14)
        .text(bizName, margin + 52, y);

      doc
        .font('Helvetica')
        .fontSize(8.5)
        .fillColor(textMuted)
        .text(`GSTIN / Tax ID: ${bizTaxId}`, margin + 52, y + 17)
        .text(`Email: ${bizEmail}  |  Phone: ${bizPhone}`, margin + 52, y + 28)
        .text(bizAddress, margin + 52, y + 39, { width: 240 });

      // Title & Credit Note Number (Right)
      doc
        .fillColor(primaryAmber)
        .font('Helvetica-Bold')
        .fontSize(18)
        .text('CREDIT NOTE', margin, y, { width: contentWidth, align: 'right' });

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(darkNavy)
        .text(creditNote.creditNoteNumber || 'CN-2026-0001', margin, y + 22, {
          width: contentWidth,
          align: 'right',
        });

      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(primaryAmber)
        .text(`STATUS: ${(creditNote.status || 'ISSUED').toUpperCase()}`, margin, y + 38, {
          width: contentWidth,
          align: 'right',
        });

      // Divider
      y = 100;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke();

      y += 15;

      // Recipient Client & Meta Grid
      doc
        .fillColor(textMuted)
        .font('Helvetica-Bold')
        .fontSize(8)
        .text('ISSUED TO (CLIENT):', margin, y);

      doc
        .fillColor(darkNavy)
        .font('Helvetica-Bold')
        .fontSize(11)
        .text(creditNote.customerName || 'Customer Client', margin, y + 12);

      const rightX = margin + 270;
      const metaWidth = contentWidth - 270;

      const printMetaRow = (label, val, rowY, isBold = false) => {
        doc
          .fillColor(textMuted)
          .font('Helvetica')
          .fontSize(8.5)
          .text(label, rightX, rowY);
        doc
          .fillColor(darkNavy)
          .font(isBold ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(8.5)
          .text(val, rightX, rowY, { width: metaWidth, align: 'right' });
      };

      printMetaRow('Credit Note Date:', formatDate(creditNote.creditNoteDate), y + 5);
      printMetaRow('Original Invoice #:', creditNote.invoiceNumber, y + 18, true);
      printMetaRow('Reason for Credit:', creditNote.reason || 'Price Adjustment', y + 31);
      printMetaRow('Logged By:', creditNote.recordedByName || 'Authorized Staff', y + 44);

      y = 175;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, y)
        .lineTo(pageWidth - margin, y)
        .stroke();

      y += 15;

      // Credit Adjustment Summary Table
      doc.rect(margin, y, contentWidth, 24).fill(bgLight);
      doc
        .font('Helvetica-Bold')
        .fontSize(8.5)
        .fillColor(darkNavy)
        .text('FINANCIAL ADJUSTMENT PARTICULARS', margin + 10, y + 7)
        .text('AMOUNT (INR)', margin + 10, y + 7, { width: contentWidth - 20, align: 'right' });

      y += 30;

      const printDetailRow = (label, val, rowY, isHighlight = false) => {
        doc
          .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .fillColor(isHighlight ? darkNavy : textMuted)
          .text(label, margin + 10, rowY);

        doc
          .font(isHighlight ? 'Helvetica-Bold' : 'Helvetica')
          .fontSize(9)
          .fillColor(isHighlight ? primaryAmber : textMain)
          .text(val, margin + 10, rowY, { width: contentWidth - 20, align: 'right' });
      };

      if (creditNote.invoiceBalanceBeforeCredit > 0) {
        printDetailRow('Invoice Outstanding Before Credit Note:', formatINR(creditNote.invoiceBalanceBeforeCredit), y);
        y += 20;
      }

      printDetailRow(`Credit Note Adjustment (${creditNote.reason}):`, `- ${formatINR(creditNote.amount)}`, y, true);
      y += 20;

      if (creditNote.invoiceBalanceAfterCredit !== undefined) {
        printDetailRow('Remaining Invoice Outstanding Balance:', formatINR(creditNote.invoiceBalanceAfterCredit), y);
        y += 20;
      }

      // Highlight Box for Total Credit Allowed
      y += 10;
      doc
        .rect(margin, y, contentWidth, 34)
        .fillAndStroke('#FEF3C7', '#FDE68A');

      doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(darkNavy)
        .text('TOTAL CREDIT ADJUSTED:', margin + 12, y + 10);

      doc
        .font('Helvetica-Bold')
        .fontSize(14)
        .fillColor(primaryAmber)
        .text(formatINR(creditNote.amount), margin + 12, y + 9, {
          width: contentWidth - 24,
          align: 'right',
        });

      y += 55;

      // Remarks Box
      if (creditNote.description || creditNote.notes) {
        doc
          .rect(margin, y, contentWidth, 55)
          .fillAndStroke(bgLight, borderColor);

        doc
          .font('Helvetica-Bold')
          .fontSize(8)
          .fillColor(darkNavy)
          .text('DESCRIPTION & BUSINESS REASON:', margin + 10, y + 8);

        doc
          .font('Helvetica')
          .fontSize(8)
          .fillColor(textMuted)
          .text(creditNote.description || creditNote.notes, margin + 10, y + 22, {
            width: contentWidth - 20,
          });

        y += 70;
      }

      // Legal text & Signatory
      const footerY = doc.page.height - 50;
      doc
        .strokeColor(borderColor)
        .lineWidth(1)
        .moveTo(margin, footerY)
        .lineTo(pageWidth - margin, footerY)
        .stroke();

      doc
        .font('Helvetica')
        .fontSize(7.5)
        .fillColor(textMuted)
        .text(
          'This Credit Note is issued in compliance with Indian GST provisions for downward adjustment of taxable value.',
          margin,
          footerY + 8,
          { width: contentWidth, align: 'center' }
        )
        .text(
          `Page 1 of 1 • BillFlow Billing Platform • Document ID: ${creditNote._id}`,
          margin,
          footerY + 18,
          { width: contentWidth, align: 'center' }
        );

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

module.exports = {
  generateInvoicePDF,
  generateCreditNotePDF,
  formatINR,
  formatDate,
};
