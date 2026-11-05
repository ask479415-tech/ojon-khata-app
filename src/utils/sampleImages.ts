export interface SampleSlip {
  id: string;
  name: string;
  description: string;
  expectedWeights: number[];
  generateDataUrl: () => string;
}

export const SAMPLE_SLIPS: SampleSlip[] = [
  {
    id: 'sample-1',
    name: 'নমুনা ১: বাজারের ওজন খাতা (English: 1.5, 2, 3.5...)',
    description: 'হাতে লেখা ইংরেজি সংখ্যা: 1.5, 2, 3.5, 4.25, 2.0, 1.75, 5.0, 3.5',
    expectedWeights: [1.5, 2, 3.5, 4.25, 2.0, 1.75, 5.0, 3.5],
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 780;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Aged notebook paper background
      ctx.fillStyle = '#fdfbf7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Subtle texture lines
      ctx.strokeStyle = '#e2dfd2';
      ctx.lineWidth = 1;
      for (let y = 70; y < canvas.height; y += 45) {
        ctx.beginPath();
        ctx.moveTo(30, y);
        ctx.lineTo(canvas.width - 30, y);
        ctx.stroke();
      }

      // Red margin line
      ctx.strokeStyle = '#f87171';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(110, 20);
      ctx.lineTo(110, canvas.height - 20);
      ctx.stroke();

      // Header handwritten text
      ctx.fillStyle = '#1e3a8a';
      ctx.font = 'bold 24px "Hind Siliguri", cursive, sans-serif';
      ctx.fillText('ওজন তালিকা (বাজারের চালান)', 130, 55);

      // Handwritten numbers
      const weights = ['1.5', '2', '3.5', '4.25', '2.0', '1.75', '5.0', '3.5'];
      const notes = ['বস্তা ১', 'বস্তা ২', 'বস্তা ৩', 'বস্তা ৪', 'বস্তা ৫', 'বস্তা ৬', 'বস্তা ৭', 'বস্তা ৮'];

      weights.forEach((w, idx) => {
        const y = 110 + idx * 75;
        // Bag label
        ctx.fillStyle = '#475569';
        ctx.font = '19px "Hind Siliguri", sans-serif';
        ctx.fillText(notes[idx] + ' :', 125, y);

        // Handwritten weight in ink pen
        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 36px "Courier New", "Caveat", cursive, monospace';
        // Add slight human tilt/jitter
        ctx.save();
        ctx.translate(230, y);
        ctx.rotate(((idx % 3) - 1) * 0.02);
        ctx.fillText(`${w} kg`, 0, 0);
        ctx.restore();
      });

      // Bottom scribble
      ctx.strokeStyle = '#1e3a8a';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(120, 720);
      ctx.lineTo(380, 720);
      ctx.stroke();

      return canvas.toDataURL('image/jpeg', 0.92);
    },
  },
  {
    id: 'sample-2',
    name: 'নমুনা ২: বাংলা সংখ্যার ওজন খাতা (১.৫, ২, ৩.৫...)',
    description: 'হাতে লেখা খাঁটি বাংলা সংখ্যা: ১.৫, ২, ৩.৫, ৪.০, ২.৭৫, ১.৫',
    expectedWeights: [1.5, 2, 3.5, 4.0, 2.75, 1.5],
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      // Yellowish pad background
      ctx.fillStyle = '#fef3c7';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid/ruled lines
      ctx.strokeStyle = '#cbd5e1';
      ctx.lineWidth = 1.2;
      for (let y = 60; y < canvas.height; y += 48) {
        ctx.beginPath();
        ctx.moveTo(25, y);
        ctx.lineTo(canvas.width - 25, y);
        ctx.stroke();
      }

      // Title in blue ink
      ctx.fillStyle = '#0369a1';
      ctx.font = 'bold 26px "Hind Siliguri", serif';
      ctx.fillText('দৈনিক মাল ওজন - মেসার্স ব্রাদার্স', 60, 50);

      const items = [
        { text: '১.৫ কেজি', num: '১.৫', note: 'মাছ' },
        { text: '২ কেজি', num: '২', note: 'মুরগি' },
        { text: '৩.৫ কেজি', num: '৩.৫', note: 'গরু' },
        { text: '৪.০ কেজি', num: '৪.০', note: 'খাসি' },
        { text: '২.৭৫ কেজি', num: '২.৭৫', note: 'মাছ' },
        { text: '১.৫ কেজি', num: '১.৫', note: 'চিংড়ি' },
      ];

      items.forEach((item, idx) => {
        const y = 115 + idx * 80;
        ctx.fillStyle = '#334155';
        ctx.font = '22px "Hind Siliguri", sans-serif';
        ctx.fillText(`${idx + 1}. ${item.note}:`, 60, y);

        // Handwritten bold ink
        ctx.fillStyle = '#1e1b4b';
        ctx.font = 'bold 36px "Hind Siliguri", cursive, sans-serif';
        ctx.save();
        ctx.translate(220, y);
        ctx.rotate(((idx % 2 === 0 ? 1 : -1) * 0.025));
        ctx.fillText(item.text, 0, 0);
        ctx.restore();
      });

      return canvas.toDataURL('image/jpeg', 0.92);
    },
  },
  {
    id: 'sample-3',
    name: 'নমুনা ৩: পাইকারি আলুর বস্তার ওজন (Tally Slips)',
    description: 'দ্রুত হাতের লেখা কলাম: 50.5, 48.0, 52.5, 51.25, 49.0, 50.0',
    expectedWeights: [50.5, 48.0, 52.5, 51.25, 49.0, 50.0],
    generateDataUrl: () => {
      const canvas = document.createElement('canvas');
      canvas.width = 650;
      canvas.height = 700;
      const ctx = canvas.getContext('2d');
      if (!ctx) return '';

      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Light grid
      ctx.strokeStyle = '#e2e8f0';
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 30) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 30) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      ctx.fillStyle = '#b91c1c';
      ctx.font = 'bold 24px "Hind Siliguri", sans-serif';
      ctx.fillText('আলু আড়ৎ বস্তার ওজন তালিকা', 50, 48);

      const sacks = ['50.5', '48.0', '52.5', '51.25', '49.0', '50.0'];
      sacks.forEach((val, idx) => {
        const y = 110 + idx * 85;
        ctx.fillStyle = '#475569';
        ctx.font = '20px "Hind Siliguri", sans-serif';
        ctx.fillText(`বস্তা #${idx + 1}`, 50, y);

        ctx.fillStyle = '#0f172a';
        ctx.font = 'bold 38px monospace';
        ctx.fillText(`${val}`, 180, y);

        ctx.fillStyle = '#64748b';
        ctx.font = '20px "Hind Siliguri", sans-serif';
        ctx.fillText('কেজি', 320, y);
      });

      return canvas.toDataURL('image/jpeg', 0.92);
    },
  },
];
