const fs = require('fs');
const path = require('path');

const raeDir = 'G:\\open-lovable\\components\\rae';

function walk(d) {
  return fs.readdirSync(d).flatMap(f => {
    const p = path.join(d, f);
    return fs.statSync(p).isDirectory() ? walk(p) : [p];
  });
}

const files = walk(raeDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

// Map of relative pattern -> absolute @/ path
const patterns = [
  // explicit .tsx extension imports
  { from: /from ["']\.\.\/hooks\/useLanguage\.tsx["']/g, to: 'from "@/components/rae/hooks/useLanguage"' },
  // ../hooks/
  { from: /from ["']\.\.\/hooks\/([^"']+)["']/g, to: 'from "@/components/rae/hooks/$1"' },
  // ../data/
  { from: /from ["']\.\.\/data\/([^"']+)["']/g, to: 'from "@/components/rae/data/$1"' },
  // ../layout/
  { from: /from ["']\.\.\/layout\/([^"']+)["']/g, to: 'from "@/components/rae/layout/$1"' },
  // ../sections/
  { from: /from ["']\.\.\/sections\/([^"']+)["']/g, to: 'from "@/components/rae/sections/$1"' },
  // ./hooks/
  { from: /from ["']\.\/hooks\/([^"']+)["']/g, to: 'from "@/components/rae/hooks/$1"' },
  // ./data/
  { from: /from ["']\.\/data\/([^"']+)["']/g, to: 'from "@/components/rae/data/$1"' },
  // ./layout/
  { from: /from ["']\.\/layout\/([^"']+)["']/g, to: 'from "@/components/rae/layout/$1"' },
  // ./sections/
  { from: /from ["']\.\/sections\/([^"']+)["']/g, to: 'from "@/components/rae/sections/$1"' },
];

let changedCount = 0;
files.forEach(filePath => {
  let content = fs.readFileSync(filePath, 'utf8');
  const original = content;

  patterns.forEach(({ from, to }) => {
    content = content.replace(from, to);
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    const rel = filePath.replace('G:\\open-lovable\\', '');
    console.log('Fixed:', rel);
    changedCount++;
  }
});

console.log('Done. Changed', changedCount, 'of', files.length, 'files.');
