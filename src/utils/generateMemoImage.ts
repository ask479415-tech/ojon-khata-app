import { TallyRecord, NumeralStyle, UserProfile, BuyerInfo } from '../types';
import { formatWeight, formatCurrency, toBengaliNumerals } from './numberFormat';

export interface MemoExportOptions {
  record: TallyRecord;
  userProfile?: UserProfile | null;
  buyerInfo?: BuyerInfo;
  numeralStyle?: NumeralStyle;
}

/**
 * Generates an ultra-crisp, high-DPI canvas image of the weight tally voucher
 */
export async function generateMemoCanvas(
  options: MemoExportOptions
): Promise<HTMLCanvasElement> {
  const { record, userProfile, buyerInfo, numeralStyle = 'bangla' } = options;

  const width = 800;
  const weights = record.weights || [];
  const itemCount = weights.length;

  // Determine dynamic height based on item count
  const cols = itemCount > 12 ? 3 : itemCount > 6 ? 2 : 1;
  const rows = Math.ceil(itemCount / cols);
  const tableHeight = Math.max(120, rows * 36 + 40);
  const height = 480 + tableHeight + 220;

  const canvas = document.createElement('canvas');
  // Scale for high DPI retina rendering
  const scale = 2;
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  ctx.scale(scale, scale);

  // Background - Clean crisp invoice white with subtle vintage border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, width, height);

  // Outer border
  ctx.strokeStyle = '#047857';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, width - 32, height - 32);

  // Inner subtle border
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 1;
  ctx.strokeRect(22, 22, width - 44, height - 44);

  // Header background bar
  ctx.fillStyle = '#065f46';
  ctx.fillRect(24, 24, width - 48, 110);

  // Shop / Business Name
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 30px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  const businessTitle = userProfile?.businessName || record.businessName || 'মেসার্স ওজন খাতা ট্রেডার্স';
  ctx.fillText(businessTitle, width / 2, 65);

  // Subtitle / Contact
  ctx.font = '500 15px "Hind Siliguri", sans-serif';
  ctx.fillStyle = '#a7f3d0';
  const contactText = [
    userProfile?.address || 'পাইকারি ও খুচরা মাল ওজন চালান',
    userProfile?.phone ? `মোবাইল: ${userProfile.phone}` : 'ডিজিটাল ওজন খাতা',
  ].join(' • ');
  ctx.fillText(contactText, width / 2, 92);

  // Memo Title Pill
  ctx.fillStyle = '#ecfdf5';
  ctx.fillRect(width / 2 - 140, 105, 280, 26);
  ctx.fillStyle = '#047857';
  ctx.font = 'bold 14px "Hind Siliguri", sans-serif';
  ctx.fillText('ওজন চালান ও ক্যাশ মেমো (WEIGHT MEMO)', width / 2, 123);

  // Metadata Grid (Date, Memo #, Buyer Name, Commodity)
  const metaY = 160;
  ctx.textAlign = 'left';
  ctx.fillStyle = '#334155';
  ctx.font = '600 14px "Hind Siliguri", sans-serif';

  const memoNum = buyerInfo?.memoNo || `MEMO-${record.id.slice(-6).toUpperCase()}`;
  const dateStr = new Date(record.timestamp).toLocaleString('bn-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  // Left meta
  ctx.fillText(`চালান নং: ${memoNum}`, 40, metaY);
  ctx.fillText(`তারিখ: ${dateStr}`, 40, metaY + 24);

  // Right meta
  const buyerName = buyerInfo?.buyerName || 'সাধারণ খদ্দের / ক্যাশ';
  const itemType = buyerInfo?.itemType || 'আলু / পণ্য মাল';
  ctx.fillText(`ক্রেতা/বেপারী: ${buyerName}`, width - 360, metaY);
  ctx.fillText(`পণ্যের বিবরণ: ${itemType}`, width - 360, metaY + 24);

  // Divider
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(40, metaY + 40);
  ctx.lineTo(width - 40, metaY + 40);
  ctx.stroke();

  // Weights Table Header
  const tableY = metaY + 55;
  ctx.fillStyle = '#f8fafc';
  ctx.fillRect(40, tableY, width - 80, 32);
  ctx.strokeStyle = '#e2e8f0';
  ctx.strokeRect(40, tableY, width - 80, 32);

  ctx.fillStyle = '#0f172a';
  ctx.font = 'bold 13px "Hind Siliguri", sans-serif';

  const colWidth = (width - 80) / cols;
  for (let c = 0; c < cols; c++) {
    const startX = 40 + c * colWidth;
    ctx.fillText('নং', startX + 12, tableY + 21);
    ctx.fillText('ওজন (কেজি)', startX + 60, tableY + 21);
    ctx.fillText('মূল এন্ট্রি', startX + colWidth - 75, tableY + 21);

    if (c < cols - 1) {
      ctx.strokeStyle = '#e2e8f0';
      ctx.beginPath();
      ctx.moveTo(startX + colWidth, tableY);
      ctx.lineTo(startX + colWidth, tableY + 32 + rows * 36);
      ctx.stroke();
    }
  }

  // Render Weight Items in columns
  ctx.font = '500 14px "Hind Siliguri", sans-serif';
  weights.forEach((item, idx) => {
    const colIdx = Math.floor(idx / rows);
    const rowIdx = idx % rows;
    const itemX = 40 + colIdx * colWidth;
    const itemY = tableY + 32 + rowIdx * 36;

    // Alternating row background
    if (rowIdx % 2 === 0) {
      ctx.fillStyle = '#fbfcfe';
      ctx.fillRect(itemX, itemY, colWidth, 36);
    }

    // Border line bottom
    ctx.strokeStyle = '#f1f5f9';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(itemX, itemY + 36);
    ctx.lineTo(itemX + colWidth, itemY + 36);
    ctx.stroke();

    // Index
    ctx.fillStyle = '#64748b';
    ctx.font = '600 13px "Hind Siliguri", sans-serif';
    ctx.fillText(
      numeralStyle === 'bangla' ? toBengaliNumerals(idx + 1) : `${idx + 1}`,
      itemX + 12,
      itemY + 23
    );

    // Weight in Bold
    ctx.fillStyle = '#0f172a';
    ctx.font = 'bold 15px "JetBrains Mono", monospace';
    ctx.fillText(
      `${formatWeight(item.value, numeralStyle, 2)} kg`,
      itemX + 60,
      itemY + 23
    );

    // Original Text
    ctx.fillStyle = '#94a3b8';
    ctx.font = '12px "Hind Siliguri", sans-serif';
    ctx.fillText(item.originalText, itemX + colWidth - 75, itemY + 23);
  });

  // Bottom Summary Box
  const summaryBoxY = tableY + 32 + rows * 36 + 18;
  const boxHeight = 135;

  ctx.fillStyle = '#f0fdf4';
  ctx.fillRect(40, summaryBoxY, width - 80, boxHeight);
  ctx.strokeStyle = '#86efac';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(40, summaryBoxY, width - 80, boxHeight);

  // Inside Summary Box
  ctx.fillStyle = '#14532d';
  ctx.font = '600 14px "Hind Siliguri", sans-serif';

  const grossKg = record.totalKg;
  const tarePerItem = record.tarePerItemKg || 0;
  const totalTare = tarePerItem * itemCount;
  const netKg = record.netKg || grossKg;
  const pricePerKg = record.pricePerKg || 0;
  const totalAmount = record.totalAmount || (pricePerKg > 0 ? netKg * pricePerKg : 0);

  // Left column in summary
  ctx.fillText(
    `মোট বস্তা/এন্ট্রি: ${numeralStyle === 'bangla' ? toBengaliNumerals(itemCount) : itemCount} টি`,
    60,
    summaryBoxY + 32
  );
  ctx.fillText(
    `সর্বমোট ওজন (Gross): ${formatWeight(grossKg, numeralStyle, 2)} কেজি`,
    60,
    summaryBoxY + 60
  );
  if (totalTare > 0) {
    ctx.fillText(
      `খালি বস্তা বাদ: -${formatWeight(totalTare, numeralStyle, 2)} কেজি (প্রতিটিতে ${formatWeight(tarePerItem, numeralStyle, 2)})`,
      60,
      summaryBoxY + 88
    );
  } else {
    ctx.fillText(
      `খালি বস্তার বাদ: নেই (০ কেজি)`,
      60,
      summaryBoxY + 88
    );
  }

  // Right column in summary (Hero figures)
  const rightX = width - 360;
  ctx.fillStyle = '#065f46';
  ctx.font = 'bold 16px "Hind Siliguri", sans-serif';
  ctx.fillText('নিট ওজন (Net Weight):', rightX, summaryBoxY + 32);

  ctx.font = 'bold 24px "JetBrains Mono", monospace';
  ctx.fillStyle = '#047857';
  ctx.fillText(`${formatWeight(netKg, numeralStyle, 2)} KG`, rightX + 175, summaryBoxY + 32);

  if (pricePerKg > 0) {
    ctx.font = '600 14px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#334155';
    ctx.fillText(`দর প্রতি কেজি: ${formatCurrency(pricePerKg, numeralStyle)}`, rightX, summaryBoxY + 64);

    ctx.font = 'bold 18px "Hind Siliguri", sans-serif';
    ctx.fillStyle = '#b91c1c';
    ctx.fillText(`মোট মূল্য: ${formatCurrency(totalAmount, numeralStyle)}`, rightX, summaryBoxY + 96);
  }

  // Signature lines & Footer
  const footerY = summaryBoxY + boxHeight + 45;
  ctx.strokeStyle = '#94a3b8';
  ctx.lineWidth = 1;

  // Buyer signature
  ctx.beginPath();
  ctx.moveTo(60, footerY);
  ctx.lineTo(200, footerY);
  ctx.stroke();
  ctx.fillStyle = '#64748b';
  ctx.font = '12px "Hind Siliguri", sans-serif';
  ctx.fillText('ক্রেতার স্বাক্ষর', 95, footerY + 18);

  // Seller signature / Stamp
  ctx.beginPath();
  ctx.moveTo(width - 200, footerY);
  ctx.lineTo(width - 60, footerY);
  ctx.stroke();
  ctx.fillText('বিক্রেতা / ওজনকারীর স্বাক্ষর', width - 180, footerY + 18);

  // App Watermark footer
  ctx.fillStyle = '#94a3b8';
  ctx.font = '11px "Hind Siliguri", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(
    'স্মার্ট ওজন খাতা (Smart Weight OCR & Calculator) দ্বারা প্রস্তুতকৃত চালান',
    width / 2,
    height - 28
  );

  return canvas;
}

/**
 * Exports the memo canvas as a downloadable PNG
 */
export async function downloadMemoImage(options: MemoExportOptions, filename?: string): Promise<void> {
  const canvas = await generateMemoCanvas(options);
  const dataUrl = canvas.toDataURL('image/png', 1.0);
  const a = document.createElement('a');
  a.href = dataUrl;
  a.download = filename || `ojon-memo-${options.record.id.slice(-6)}.png`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

/**
 * Shares memo image directly via Web Share API or falls back to download
 */
export async function shareMemoImage(options: MemoExportOptions): Promise<boolean> {
  const canvas = await generateMemoCanvas(options);
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(false);
        return;
      }

      const file = new File([blob], `ojon-memo-${options.record.id.slice(-6)}.png`, {
        type: 'image/png',
      });

      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            title: 'ওজন চালান মেমো',
            text: `মোট ওজন: ${options.record.totalKg} কেজি (${options.record.weights.length}টি বস্তা)`,
            files: [file],
          });
          resolve(true);
          return;
        } catch (e) {
          console.warn('Share sheet cancelled or failed:', e);
        }
      }

      // Fallback: download the file
      downloadMemoImage(options);
      resolve(true);
    }, 'image/png');
  });
}
