const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const BRAND_BG = { r: 14, g: 82, b: 48, alpha: 1 }; // #0E5230 — hijau tua logo

const assets = [
  {
    input: "./assets/cerdik.jpeg",
    output: "./assets/icon.png",
    width: 1024,
    height: 1024,
  },
  {
    input: "./assets/cerdik.jpeg",
    output: "./assets/adaptive-icon.png",
    width: 1024,
    height: 1024,
  },
  {
    input: "./assets/cerdik.jpeg",
    output: "./assets/splash.png",
    width: 1284,
    height: 2778,
  },
  {
    input: "./assets/cerdik.jpeg",
    output: "./assets/favicon.png",
    width: 48,
    height: 48,
  },
  {
    input: "./assets/cerdik.jpeg",
    output: "./assets/splash-icon.png",
    width: 200,
    height: 200,
  },
];

async function convertAssets() {
  for (const asset of assets) {
    try {
      if (!fs.existsSync(path.resolve(asset.input))) {
        console.error(`✗ Missing: ${asset.input}`);
        continue;
      }

      const tmp = `${asset.output}.tmp`;
      await sharp(asset.input)
        .resize(asset.width, asset.height, {
          fit: "contain",
          background: BRAND_BG,
        })
        .png()
        .toFile(tmp);

      fs.renameSync(tmp, asset.output);
      console.log(`✓ Converted: ${asset.output}`);
    } catch (err) {
      console.error(`✗ Failed: ${asset.input}`, err?.message ?? String(err));
    }
  }
  console.log("Semua asset berhasil dikonversi!");
}

convertAssets();
