const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

const assets = [
  {
    input: "./assets/icon.png",
    output: "./assets/icon.png",
    width: 1024,
    height: 1024,
  },
  {
    input: "./assets/adaptive-icon.png",
    output: "./assets/adaptive-icon.png",
    width: 1024,
    height: 1024,
  },
  {
    input: "./assets/splash-icon.png",
    output: "./assets/splash.png",
    width: 1284,
    height: 2778,
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
          background: { r: 108, g: 99, b: 255, alpha: 1 },
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

