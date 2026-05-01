const fs = require('fs');
const path = require('path');

const dir = path.join(__dirname, '../components/rae/sections');
const files = fs.readdirSync(dir).filter(f => f.endsWith('.tsx'));

files.forEach(file => {
  const fp = path.join(dir, file);
  let content = fs.readFileSync(fp, 'utf8');

  // Spacing & Layout
  content = content.replace(/py-10 md:py-14 lg:py-20/g, 'py-12 md:py-16 lg:py-24');
  content = content.replace(/mb-10/g, 'mb-8 md:mb-10 lg:mb-12');
  content = content.replace(/mb-14/g, 'mb-8 md:mb-10 lg:mb-12');
  content = content.replace(/p-4 sm:p-6/g, 'p-5 md:p-6 lg:p-8');
  content = content.replace(/p-5/g, 'p-5 md:p-6 lg:p-8');
  content = content.replace(/gap-6/g, 'gap-4 md:gap-6 lg:gap-8');
  content = content.replace(/gap-4/g, 'gap-4 md:gap-6 lg:gap-8'); // This might hit too many, let's be careful. Actually, only in grid.
  
  // Undo over-replacements if any
  content = content.replace(/gap-4 md:gap-6 lg:gap-8 md:gap-6 lg:gap-8/g, 'gap-4 md:gap-6 lg:gap-8');
  content = content.replace(/p-5 md:p-6 lg:p-8 md:p-6 lg:p-8/g, 'p-5 md:p-6 lg:p-8');

  // Typography - h1
  content = content.replace(/text-4xl sm:text-5xl lg:text-7xl font-bold/g, 'text-3xl md:text-5xl lg:text-6xl font-semibold leading-tight tracking-tight');
  
  // Typography - h2
  content = content.replace(/text-2xl sm:text-3xl lg:text-4xl font-bold/g, 'text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight');
  content = content.replace(/text-2xl sm:text-3xl font-bold/g, 'text-2xl md:text-3xl lg:text-4xl font-semibold leading-tight tracking-tight');
  
  // Typography - h3
  content = content.replace(/text-base font-bold/g, 'text-lg md:text-xl lg:text-2xl font-semibold leading-snug');
  content = content.replace(/text-lg font-bold/g, 'text-lg md:text-xl lg:text-2xl font-semibold leading-snug');

  // Typography - eyebrow
  content = content.replace(/text-xs font-semibold (.*?) uppercase tracking-widest/g, 'text-xs md:text-sm font-medium $1 uppercase tracking-[0.18em]');

  // Dark Mode - Backgrounds
  content = content.replace(/bg-white/g, 'bg-white dark:bg-slate-950');
  // Specifically for cards that might use bg-white -> dark:bg-slate-900. We'll do this manually for cards later or let the global dark:bg-slate-950 apply to page, and fix cards.
  content = content.replace(/bg-\[\#f8fafc\]/g, 'bg-slate-50 dark:bg-slate-900/60');
  
  // Dark Mode - Text Colors
  content = content.replace(/text-\[\#0a1628\]/g, 'text-[#0a1628] dark:text-slate-50');
  content = content.replace(/text-slate-500/g, 'text-slate-500 dark:text-slate-400');
  content = content.replace(/text-slate-400/g, 'text-slate-500 dark:text-slate-400'); // ensure contrast
  content = content.replace(/text-slate-600/g, 'text-slate-600 dark:text-slate-300');
  
  // Dark Mode - Borders
  content = content.replace(/border-slate-100/g, 'border-slate-200 dark:border-slate-800');
  content = content.replace(/border-slate-200/g, 'border-slate-200 dark:border-slate-800');

  // Buttons & Badges (Focus Rings & Rounded)
  // Ensure rounded-full for buttons. Let's just append dark:shadow-none to shadows
  content = content.replace(/shadow-xl/g, 'shadow-xl dark:shadow-none');
  content = content.replace(/shadow-lg/g, 'shadow-lg dark:shadow-none');
  content = content.replace(/shadow-md/g, 'shadow-md dark:shadow-none');

  fs.writeFileSync(fp, content);
});

// Also fix RAEFooter.tsx
const footerPath = path.join(__dirname, '../components/rae/layout/RAEFooter.tsx');
if (fs.existsSync(footerPath)) {
  let footer = fs.readFileSync(footerPath, 'utf8');
  footer = footer.replace(/bg-\[\#0a1628\]/g, 'bg-[#0a1628] dark:bg-slate-950');
  footer = footer.replace(/border-white\/10/g, 'border-white/10 dark:border-slate-800');
  fs.writeFileSync(footerPath, footer);
}

console.log('Polish complete.');
