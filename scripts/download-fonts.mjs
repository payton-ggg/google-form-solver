import https from 'https';
import fs from 'fs';
import path from 'path';

const fontsDir = path.resolve('public/fonts');
if (!fs.existsSync(fontsDir)) {
  fs.mkdirSync(fontsDir, { recursive: true });
}

const userAgent =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';

const fonts = [
  {
    name: 'Outfit',
    family: 'Outfit',
    url: 'https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700;800&display=swap',
  },
  {
    name: 'PlusJakartaSans',
    family: 'Plus Jakarta Sans',
    url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@500;600;700;800&display=swap',
  },
  {
    name: 'Manrope',
    family: 'Manrope',
    url: 'https://fonts.googleapis.com/css2?family=Manrope:wght@500;600;700;800&display=swap',
  },
  {
    name: 'SpaceGrotesk',
    family: 'Space Grotesk',
    url: 'https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@500;600;700&display=swap',
  },
  {
    name: 'Inter',
    family: 'Inter',
    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap',
  },
];

async function fetchCss(url) {
  return new Promise((resolve, reject) => {
    https
      .get(url, { headers: { 'User-Agent': userAgent } }, (res) => {
        let data = '';
        res.on('data', (chunk) => (data += chunk));
        res.on('end', () => resolve(data));
      })
      .on('error', reject);
  });
}

async function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    https
      .get(url, (res) => {
        if (res.statusCode === 302 || res.statusCode === 301) {
          return downloadFile(res.headers.location, dest).then(resolve).catch(reject);
        }
        const file = fs.createWriteStream(dest);
        res.pipe(file);
        file.on('finish', () => file.close(resolve));
      })
      .on('error', reject);
  });
}

async function run() {
  let combinedCss = '';

  for (const f of fonts) {
    console.log(`Fetching CSS for ${f.name}...`);
    const css = await fetchCss(f.url);
    const matches = [...css.matchAll(/src:\s*url\((https:\/\/[^)]+\.woff2)\)/g)];
    console.log(`Found ${matches.length} woff2 slices for ${f.name}`);

    let localCss = css;
    for (let i = 0; i < matches.length; i++) {
      const woff2Url = matches[i][1];
      const filename = `${f.name}-${i}.woff2`;
      const dest = path.join(fontsDir, filename);
      await downloadFile(woff2Url, dest);
      localCss = localCss.replace(woff2Url, `__FONT_BASE_URL__/${filename}`);
    }

    combinedCss += `\n/* === ${f.name} === */\n` + localCss + '\n';
  }

  fs.writeFileSync(path.join(fontsDir, 'fonts.css.template'), combinedCss);
  console.log('✅ All fonts successfully downloaded to public/fonts/');
}

run().catch((err) => {
  console.error('Failed to download fonts:', err);
  process.exit(1);
});
