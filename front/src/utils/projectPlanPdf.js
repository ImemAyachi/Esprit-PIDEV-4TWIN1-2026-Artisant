import { jsPDF } from 'jspdf';

const TEAL = [45, 90, 90];
const ORANGE = [166, 110, 78];
const SLATE = [26, 47, 47];
const BORDER = [217, 228, 228];
const CREAM = [253, 252, 251];
const MUTED = [130, 154, 154];

const PAGE_MARGIN = 11;
const CARD_PAD = 5.5;
const GAP = 4;
const INNER_GAP = 3.5;
const LIST_LH = 4.15;
const TIMELINE_RAIL = 4.2;
const TIMELINE_DOT_R = 2.15;
const TIMELINE_TEXT_OFFSET = 11.5;

export function generateProjectPlanPDF(plan, meta = {}) {
  const doc = new jsPDF({ unit: 'mm', format: 'a4', compress: true });
  const pageW = doc.internal.pageSize.getWidth();
  const pageH = doc.internal.pageSize.getHeight();
  const { brief = '', quantity } = meta;

  const cardX = PAGE_MARGIN;
  const cardY = PAGE_MARGIN;
  const cardW = pageW - 2 * PAGE_MARGIN;
  const cardH = pageH - 2 * PAGE_MARGIN;
  const innerX = cardX + CARD_PAD;
  const innerW = cardW - 2 * CARD_PAD;
  const colW = (innerW - INNER_GAP) / 2;
  const colThird = (innerW - 2 * INNER_GAP) / 3;
  const bottomLimit = cardY + cardH - CARD_PAD - 12;

  const drawPageBg = () => {
    doc.setFillColor(...CREAM);
    doc.rect(0, 0, pageW, pageH, 'F');
  };

  const drawCard = () => {
    doc.setFillColor(BORDER[0], BORDER[1], BORDER[2]);
    doc.rect(cardX + 1.4, cardY + 1.4, cardW, cardH, 'F');
    doc.setFillColor(255, 255, 255);
    doc.rect(cardX, cardY, cardW, cardH, 'F');
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(1.05);
    doc.rect(cardX, cardY, cardW, cardH, 'S');
  };

  const footAllPages = (n) => {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...MUTED);
    for (let i = 1; i <= n; i++) {
      doc.setPage(i);
      doc.text(
        `Page ${i} / ${n}  ·  Artisant  ·  Document indicatif, non contractuel`,
        pageW / 2,
        pageH - 6,
        { align: 'center' }
      );
    }
    doc.setTextColor(...SLATE);
  };

  let y = cardY + CARD_PAD + 2;

  const ensureSpace = (need) => {
    if (y + need > bottomLimit) {
      doc.addPage();
      drawPageBg();
      drawCard();
      y = cardY + CARD_PAD + 2;
    }
  };

  const labelCaps = (x, yy, text) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(7);
    doc.setTextColor(...TEAL);
    doc.text(text.toUpperCase(), x, yy, { charSpace: 0.35 });
    doc.setTextColor(...SLATE);
    return yy + 4;
  };

  const listHeight = (items, textW) => {
    const arr = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
    if (arr.length === 0) return LIST_LH + 2;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    let h = 0;
    for (const item of arr) {
      const lines = doc.splitTextToSize(item, textW);
      h += lines.length * LIST_LH;
    }
    return h + 2;
  };

  const drawTimeline = (x, yy, w, items) => {
    const arr = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
    const railX = x + TIMELINE_RAIL;
    const textX = x + TIMELINE_TEXT_OFFSET;
    const textW = Math.max(24, w - TIMELINE_TEXT_OFFSET - 4);
    const cardLeft = textX - 1;
    const cardW = x + w - cardLeft;
    let cy = yy;

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(...MUTED);
    doc.text('PARCOURS DE RÉALISATION', x, cy, { charSpace: 0.2 });
    doc.setTextColor(...SLATE);
    cy += 5;

    if (arr.length === 0) {
      doc.setFontSize(9);
      doc.setTextColor(...MUTED);
      doc.text('—', textX, cy + 2);
      doc.setTextColor(...SLATE);
      return cy + 7;
    }

    let prevDotY = null;
    let prevDotPage = null;

    for (let i = 0; i < arr.length; i++) {
      const item = arr[i];
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      const lines = doc.splitTextToSize(item, textW);
      const bodyH = Math.max(7, lines.length * LIST_LH + 3.5);
      const rowH = bodyH + 3.5;

      y = cy;
      const pageBefore = doc.getNumberOfPages();
      ensureSpace(rowH + 6);
      if (doc.getNumberOfPages() > pageBefore) {
        cy = y;
      }
      const pageNow = doc.getNumberOfPages();
      const dotY = cy + 3.2;

      doc.setDrawColor(...TEAL);
      doc.setLineWidth(0.45);
      if (prevDotY != null) {
        if (pageNow === prevDotPage) {
          doc.line(railX, prevDotY, railX, dotY);
        } else {
          doc.line(railX, cy + 0.8, railX, dotY);
        }
      }

      doc.setFillColor(255, 255, 255);
      doc.setDrawColor(...TEAL);
      doc.setLineWidth(0.35);
      doc.circle(railX, dotY, TIMELINE_DOT_R, 'FD');
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(7.5);
      doc.setTextColor(...TEAL);
      doc.text(String(i + 1), railX, dotY + 0.35, { align: 'center' });
      doc.setTextColor(...SLATE);

      const cardTop = cy;
      const cardH = rowH;
      doc.setFillColor(255, 255, 255);
      doc.rect(cardLeft, cardTop, cardW, cardH, 'F');
      doc.setFillColor(...ORANGE);
      doc.rect(cardLeft + 1.1, cardTop + 0.9, 0.85, Math.max(3.5, cardH - 1.8), 'F');
      doc.setDrawColor(...BORDER);
      doc.setLineWidth(0.35);
      doc.rect(cardLeft, cardTop, cardW, cardH, 'S');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...SLATE);
      doc.text(lines, cardLeft + 4.2, cardTop + 4.2);

      cy += rowH + 2.5;
      y = cy;
      prevDotY = dotY;
      prevDotPage = pageNow;
    }

    return cy;
  };

  const drawList = (x, yy, w, items) => {
    const arr = Array.isArray(items) ? items.filter(Boolean).map(String) : [];
    const textX = x + 4;
    const tw = w - 6;
    let cy = yy;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    if (arr.length === 0) {
      doc.setTextColor(...MUTED);
      doc.text('—', textX, cy + 3.2);
      doc.setTextColor(...SLATE);
      return cy + 6;
    }
    for (const item of arr) {
      const lines = doc.splitTextToSize(item, tw);
      const blockH = lines.length * LIST_LH;
      doc.setFillColor(...ORANGE);
      doc.rect(x + 1.1, cy + 0.5, 0.85, Math.max(3.2, blockH - 0.8), 'F');
      doc.setTextColor(...SLATE);
      doc.text(lines, textX, cy + 3.2);
      cy += blockH;
    }
    return cy + 1;
  };

  const strokeBox = (x, top, w, h) => {
    doc.setDrawColor(...BORDER);
    doc.setLineWidth(0.35);
    doc.rect(x, top, w, h, 'S');
  };

  const twoCols = (leftTitle, leftData, rightTitle, rightData, leftIsValue, rightIsValue) => {
    const pad = 3;
    const tw = colW - pad * 2 - 4;
    let hL = 7;
    let hR = 7;
    if (leftIsValue) {
      doc.setFontSize(12);
      hL += doc.splitTextToSize(String(leftData || '—'), tw).length * 5 + 2;
    } else {
      hL += listHeight(leftData, tw);
    }
    if (rightIsValue) {
      doc.setFontSize(12);
      hR += doc.splitTextToSize(String(rightData || '—'), tw).length * 5 + 2;
    } else {
      hR += listHeight(rightData, tw);
    }
    const rowH = Math.max(hL, hR) + pad * 2;
    ensureSpace(rowH + 4);
    const top = y;
    const xR = innerX + colW + INNER_GAP;

    strokeBox(innerX, top, colW, rowH);
    strokeBox(xR, top, colW, rowH);

    let ly = labelCaps(innerX + 2, top + 3.5, leftTitle) + 0.5;
    if (leftIsValue) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...TEAL);
      doc.text(doc.splitTextToSize(String(leftData || '—'), tw), innerX + 2, ly);
      doc.setTextColor(...SLATE);
    } else {
      ly = drawList(innerX + 1, ly - 1, colW - 2, leftData);
    }

    let ry = labelCaps(xR + 2, top + 3.5, rightTitle) + 0.5;
    if (rightIsValue) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(...ORANGE);
      doc.text(doc.splitTextToSize(String(rightData || '—'), tw), xR + 2, ry);
      doc.setTextColor(...SLATE);
    } else {
      ry = drawList(xR + 1, ry - 1, colW - 2, rightData);
    }

    y = top + rowH + GAP;
  };

  const fullWidth = (title, renderBody) => {
    ensureSpace(24);
    const top = y;
    let yy2 = labelCaps(innerX + 2, top + 5, title);
    yy2 = renderBody(innerX + 2, yy2, innerW - 4);
    const h = yy2 - top + 5;
    strokeBox(innerX, top, innerW, h);
    y = top + h + GAP;
  };

  const threeCols = (a, b, c) => {
    const tw = colThird - 6;
    const h1 = listHeight(a.items, tw) + 8;
    const h2 = listHeight(b.items, tw) + 8;
    const h3 = listHeight(c.items, tw) + 8;
    const rowH = Math.max(h1, h2, h3) + 2;
    ensureSpace(rowH + 4);
    const top = y;
    const titles = [a.title, b.title, c.title];
    const items = [a.items, b.items, c.items];
    for (let i = 0; i < 3; i++) {
      const bx = innerX + i * (colThird + INNER_GAP);
      strokeBox(bx, top, colThird, rowH);
      let ty = labelCaps(bx + 2, top + 3.5, titles[i]);
      drawList(bx + 1, ty, colThird - 2, items[i]);
    }
    y = top + rowH + GAP;
  };

  drawPageBg();
  drawCard();

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.setTextColor(...TEAL);
  doc.text('PLAN DE PRODUCTION', innerX, y);
  y += 7;

  doc.setFontSize(6.8);
  doc.setTextColor(...MUTED);
  const subLines = doc.splitTextToSize(
    'MATÉRIAUX · ÉQUIPE · DÉLAIS · COÛT (DT) · PARCOURS · ANALYSE · PISTES · RISQUES · OPTIMISATIONS',
    innerW
  );
  doc.text(subLines, innerX, y);
  y += subLines.length * 3 + 3;

  doc.setDrawColor(...TEAL);
  doc.setLineWidth(0.25);
  doc.line(innerX, y, innerX + innerW, y);
  y += 5;

  if (brief && brief.trim()) {
    const blines = doc.splitTextToSize(brief.trim(), innerW - 4);
    const bh = Math.max(16, blines.length * 4 + 8);
    ensureSpace(bh + 10);
    y = labelCaps(innerX, y, 'Description du projet');
    y += 1;
    const t0 = y;
    doc.setDrawColor(...TEAL);
    doc.setLineWidth(0.55);
    doc.rect(innerX, t0, innerW, bh, 'S');
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(...SLATE);
    doc.text(blines, innerX + 2, t0 + 5);
    y = t0 + bh + GAP;
  }

  ensureSpace(12);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7);
  doc.setTextColor(...MUTED);
  doc.text('SYNTHÈSE', innerX, y);
  y += 4;
  doc.setFontSize(8);
  const cat = String(plan.category || '—');
  doc.setFont('helvetica', 'bold');
  let chipW = Math.min(doc.getTextWidth(cat) + 4, innerW * 0.7);
  const catLines = doc.splitTextToSize(cat, Math.max(18, chipW - 3));
  const linePadW = catLines.map((line) => doc.getTextWidth(line) + 4);
  chipW = Math.min(
    innerW * 0.88,
    Math.max(chipW, linePadW.length ? Math.max(...linePadW) : chipW)
  );
  const chipLineH = 3.55;
  const chipH = Math.max(5.6, catLines.length * chipLineH + 2.4);
  doc.setFillColor(...TEAL);
  doc.rect(innerX, y - 3.5, chipW, chipH, 'F');
  doc.setTextColor(255, 255, 255);
  doc.text(catLines, innerX + 2, y, { lineHeightFactor: 1.18 });
  doc.setTextColor(...ORANGE);
  doc.setFont('helvetica', 'bold');
  const qx = innerX + chipW + 3;
  if (quantity != null && quantity > 1) {
    doc.text(`QTÉ ×${quantity}`, qx, y);
  }
  doc.setTextColor(...SLATE);
  y += Math.max(9, chipH + 3.5);

  twoCols('Matériaux', plan.materials, 'Experts / équipe', plan.experts, false, false);
  twoCols('Délai estimé', plan.estimatedTime, 'Coût estimé (DT)', plan.estimatedCost, true, true);

  fullWidth('Étapes', (x, yy, w) => drawTimeline(x - 1, yy, w + 2, plan.steps));

  if (plan.reasoning && String(plan.reasoning).trim() && String(plan.reasoning).trim() !== '—') {
    const lines = doc.splitTextToSize(String(plan.reasoning), innerW - 6);
    ensureSpace(lines.length * 4 + 14);
    fullWidth('Analyse & justification', (x, yy) => {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.setTextColor(...SLATE);
      doc.text(lines, x, yy + 3);
      return yy + lines.length * 4 + 2;
    });
  }

  threeCols(
    { title: 'Pistes / constats', items: plan.insights || [] },
    { title: 'Risques', items: plan.risks || [] },
    { title: 'Optimisations', items: plan.optimizations || [] }
  );

  footAllPages(doc.getNumberOfPages());

  doc.save(`plan-production-${Date.now()}.pdf`);
}
