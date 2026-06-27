// invoice.js — Abbott Water Filters PDF & WhatsApp utilities
// Requires jsPDF loaded: https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js

function generateInvoicePDF(inv) {
  var jsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!jsPDF) { alert('PDF library not loaded yet. Please wait and try again.'); return null; }
  var doc = new jsPDF({ unit: 'mm', format: 'a4' });
  var pw = doc.internal.pageSize.getWidth();
  var ph = doc.internal.pageSize.getHeight();

  // ── Header ──────────────────────────────────────────
  doc.setFillColor(13, 34, 51);
  doc.rect(0, 0, pw, 44, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ABBOTT WATER FILTERS', 14, 15);

  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Kamran Plaza, Near Bhai Sweets, College Road Mandian, Abbottabad', 14, 22);
  doc.text('0348-8115410  |  0335-6590095', 14, 28);

  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(26, 155, 191);
  doc.text('INVOICE', pw - 14, 20, { align: 'right' });

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 220, 235);
  doc.text('No: ' + (inv.invoice_number || '—'), pw - 14, 28, { align: 'right' });
  doc.text('Date: ' + ((inv.invoice_date || inv.created_at || '').slice(0, 10)), pw - 14, 34, { align: 'right' });
  if (inv.due_date) doc.text('Due: ' + inv.due_date, pw - 14, 40, { align: 'right' });

  var y = 52;

  // ── Bill To box ──────────────────────────────────────
  doc.setFillColor(240, 244, 248);
  doc.roundedRect(14, y, pw - 28, 30, 2, 2, 'F');
  doc.setTextColor(90, 112, 128);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text('BILL TO', 18, y + 7);
  doc.setTextColor(13, 34, 51);
  doc.setFontSize(12);
  doc.text(inv.customer_name || '—', 18, y + 15);
  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 112, 128);
  if (inv.customer_phone) doc.text('Tel: ' + inv.customer_phone, 18, y + 22);
  if (inv.customer_address) {
    var addrLines = doc.splitTextToSize(inv.customer_address, 90);
    doc.text(addrLines, 18, y + 28);
  }

  // Payment status badge
  var statusColors = { Paid: [22, 163, 74], Pending: [220, 38, 38], Partial: [234, 88, 12] };
  var sBg = statusColors[inv.payment_status] || [90, 112, 128];
  doc.setFillColor(sBg[0], sBg[1], sBg[2]);
  doc.roundedRect(pw - 52, y + 8, 36, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text((inv.payment_status || 'Pending').toUpperCase(), pw - 34, y + 17, { align: 'center' });

  y += 38;

  // ── Items table ──────────────────────────────────────
  doc.setFillColor(13, 34, 51);
  doc.rect(14, y, pw - 28, 9, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DESCRIPTION', 18, y + 6);
  doc.text('QTY', 124, y + 6, { align: 'center' });
  doc.text('UNIT PRICE', 158, y + 6, { align: 'right' });
  doc.text('TOTAL', pw - 14, y + 6, { align: 'right' });
  y += 9;

  var items = inv.items || [];
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch(e2) { items = []; } }

  var subtotal = 0;
  items.forEach(function(item, idx) {
    if (y > ph - 50) { doc.addPage(); y = 20; }
    doc.setFillColor(idx % 2 === 0 ? 255 : 248, idx % 2 === 0 ? 255 : 250, idx % 2 === 0 ? 255 : 252);
    doc.rect(14, y, pw - 28, 9, 'F');
    doc.setTextColor(13, 34, 51);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    var qty = parseFloat(item.qty) || 1;
    var up = parseFloat(item.unit_price) || 0;
    var rowTotal = qty * up;
    subtotal += rowTotal;
    var desc = item.description || item.name || '';
    doc.text(doc.splitTextToSize(desc, 90)[0], 18, y + 6);
    doc.text(String(qty), 124, y + 6, { align: 'center' });
    doc.text('Rs ' + up.toLocaleString(), 158, y + 6, { align: 'right' });
    doc.text('Rs ' + rowTotal.toLocaleString(), pw - 14, y + 6, { align: 'right' });
    y += 9;
  });

  doc.setDrawColor(226, 232, 239);
  doc.line(14, y, pw - 14, y);
  y += 8;

  // ── Totals ────────────────────────────────────────────
  // Accept pre-calculated amounts (new schema) or fall back to pct fields (legacy)
  var discAmt  = parseFloat(inv.discount) || (subtotal * (parseFloat(inv.discount_pct)||0) / 100);
  var taxAmt   = parseFloat(inv.tax)      || ((subtotal - discAmt) * (parseFloat(inv.tax_pct)||0) / 100);
  var grand    = parseFloat(inv.total || inv.grand_total) || (subtotal - discAmt + taxAmt);
  var tx = pw - 85;

  function trow(label, val, isBold, rgb) {
    doc.setFont('helvetica', isBold ? 'bold' : 'normal');
    doc.setFontSize(isBold ? 11 : 9);
    doc.setTextColor.apply(doc, rgb || [90, 112, 128]);
    doc.text(label, tx, y);
    doc.text(val, pw - 14, y, { align: 'right' });
    y += isBold ? 10 : 7;
  }

  trow('Subtotal:', 'Rs ' + subtotal.toLocaleString());
  if (discAmt > 0) trow('Discount:', '- Rs ' + discAmt.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','));
  if (taxAmt  > 0) trow('Tax:', '+ Rs ' + taxAmt.toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ','));

  doc.setFillColor(26, 155, 191);
  doc.roundedRect(tx - 4, y - 3, pw - 14 - tx + 18, 12, 2, 2, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text('GRAND TOTAL:', tx, y + 6);
  doc.text('Rs ' + grand.toLocaleString(), pw - 14, y + 6, { align: 'right' });
  y += 18;

  // ── Payment info ─────────────────────────────────────
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(90, 112, 128);
  if (inv.payment_method) { doc.text('Payment Method: ' + inv.payment_method, 14, y); y += 7; }
  if (inv.amount_paid && parseFloat(inv.amount_paid) > 0) {
    doc.text('Amount Paid: Rs ' + parseFloat(inv.amount_paid).toLocaleString(), 14, y);
    var bal = grand - parseFloat(inv.amount_paid);
    if (bal > 0) {
      doc.setTextColor(220, 38, 38);
      doc.text('Balance Due: Rs ' + bal.toLocaleString(), 85, y);
    }
    y += 7;
  }

  // ── Filter dates ─────────────────────────────────────
  var installDate = inv.filter_install_date || inv.install_date;
  var expiryDate  = inv.filter_expiry_date  || inv.expiry_date;
  if (installDate || expiryDate) {
    y += 3;
    doc.setFillColor(240, 244, 248);
    doc.roundedRect(14, y, pw - 28, 14, 2, 2, 'F');
    doc.setTextColor(13, 34, 51);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('FILTER DETAILS', 18, y + 6);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(90, 112, 128);
    var fline = '';
    if (installDate) fline += 'Install Date: ' + installDate;
    if (expiryDate)  fline += (fline ? '    |    ' : '') + 'Next Change Due: ' + expiryDate;
    doc.text(fline, 18, y + 11);
    y += 18;
  }

  // ── Notes ────────────────────────────────────────────
  if (inv.notes) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(90, 112, 128);
    var noteLines = doc.splitTextToSize('Notes: ' + inv.notes, pw - 28);
    doc.text(noteLines, 14, y);
    y += noteLines.length * 5 + 4;
  }

  // ── Footer ───────────────────────────────────────────
  doc.setFillColor(13, 34, 51);
  doc.rect(0, ph - 22, pw, 22, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('Thank you for choosing Abbott Water Filters!', pw / 2, ph - 13, { align: 'center' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(26, 155, 191);
  doc.text('Powered by Shinkor  |  +92 317 488 6655', pw / 2, ph - 6, { align: 'center' });

  return doc;
}

function downloadInvoicePDF(inv) {
  var doc = generateInvoicePDF(inv);
  if (doc) doc.save('Invoice-' + (inv.invoice_number || 'AWF') + '.pdf');
}

function whatsappInvoice(inv) {
  var phone = (inv.customer_phone || '').replace(/\D/g, '');
  if (phone.startsWith('0') && phone.length === 11) phone = '92' + phone.slice(1);
  var items = inv.items || [];
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch(e2) { items = []; } }
  var itemsList = items.map(function(i) {
    var t = (parseFloat(i.qty || 1) * parseFloat(i.unit_price || 0)).toLocaleString();
    return '  - ' + (i.description || i.name) + ' x' + (i.qty || 1) + ' = Rs ' + t;
  }).join('\n');
  var grand = parseFloat(inv.total || inv.grand_total || 0);
  var invDate = (inv.invoice_date || inv.created_at || '').slice(0, 10);
  var expiryWa = inv.filter_expiry_date || inv.expiry_date;
  var msg =
    'Assalam u Alaikum *' + (inv.customer_name || 'Customer') + '*\n\n' +
    '*Abbott Water Filters — Invoice ' + (inv.invoice_number || '') + '*\n' +
    'Date: ' + invDate + '\n\n' +
    '*Items:*\n' + (itemsList || '—') + '\n\n' +
    '*Grand Total: Rs ' + grand.toLocaleString() + '*\n' +
    'Status: ' + (inv.payment_status || 'Pending') + '\n' +
    (expiryWa ? '\nNext Filter Change: ' + expiryWa + '\nWe will remind you before expiry.\n' : '') +
    '\n📞 0348-8115410 / 0335-6590095\n' +
    'Kamran Plaza, College Road Mandian, Abbottabad\n' +
    '\n— *Abbott Water Filters*';
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
}

function buildWaThankYou(data) {
  var items = data.items || [];
  if (typeof items === 'string') { try { items = JSON.parse(items); } catch(e2) { items = []; } }
  var itemsList = Array.isArray(items) && items.length
    ? items.map(function(i) { return (i.description || i.name || i) + ' x' + (i.qty || 1); }).join(', ')
    : (data.item || data.item_name || 'Service');
  return (
    'Assalam u Alaikum ' + (data.customer_name || data.name || 'Customer') + '\n' +
    'Thank you for choosing Abbott Water Filters! 💧\n\n' +
    'Order: ' + itemsList + '\n' +
    'Total: Rs ' + parseFloat(data.total || data.grand_total || 0).toLocaleString() + '\n' +
    'Date: ' + (data.date || new Date().toLocaleDateString('en-GB')) + '\n' +
    (data.expiry_date ? 'Next filter change: ' + data.expiry_date + '\nWe will remind you before expiry.\n' : '') +
    '\n📞 0348-8115410 / 0335-6590095\n' +
    'Address: Kamran Plaza, College Road Mandian, Abbottabad'
  );
}

function openWaThankYou(data) {
  var phone = (data.customer_phone || data.phone || '').replace(/\D/g, '');
  if (phone.startsWith('0') && phone.length === 11) phone = '92' + phone.slice(1);
  if (!phone) { alert('No phone number available for WhatsApp.'); return; }
  var msg = buildWaThankYou(data);
  window.open('https://wa.me/' + phone + '?text=' + encodeURIComponent(msg), '_blank');
  logNotification('thank_you', data.customer_name || data.name || '—', phone, msg);
}

function logNotification(type, recipientName, phone, message) {
  db.from('notification_log').insert({
    type: type,
    recipient_name: recipientName,
    phone: phone,
    message: message,
    status: 'Sent'
  }).catch(function(e2) { console.error('Notification log error:', e2); });
}

function nextInvoiceNumber(invoices) {
  var nums = (invoices || []).map(function(x) {
    var m = (x.invoice_number || '').match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  var next = nums.length ? Math.max.apply(null, nums) + 1 : 1;
  return 'INV-' + String(next).padStart(4, '0');
}

function nextPONumber(pos) {
  var nums = (pos || []).map(function(x) {
    var m = (x.po_number || '').match(/(\d+)$/);
    return m ? parseInt(m[1]) : 0;
  });
  var next = nums.length ? Math.max.apply(null, nums) + 1 : 1;
  return 'PO-' + String(next).padStart(4, '0');
}
