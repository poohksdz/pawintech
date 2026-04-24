const fs = require('fs');
let content = fs.readFileSync('D:/pawin/pawin-backend 31 20250106/frontend/src/screens/ShippingScreen.jsx', 'utf8');

// The corrupted text is: "âš ï¸ No address set in profile"
// Find exact bytes: c3a2c5a1c2a0c3afc2b8c28f
const corruptedBytes = Buffer.from([0xc3, 0xa2, 0xc5, 0xa1, 0xc2, 0xa0, 0xc3, 0xaf, 0xc2, 0xb8, 0xc2, 0x8f]).toString('binary');
const corruptedText = 'âš ï¸ No address set in profile';

if (content.includes(corruptedText)) {
  content = content.split(corruptedText).join('ยังไม่ได้ตั้งค่าที่อยู่ในโปรไฟล์');
  console.log('Fixed using string split');
}

// Alternative: replace by line number
const lines = content.split('\n');
let fixed = false;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('No address set in profile')) {
    const lineContent = lines[i];
    // Replace only the corrupted prefix part
    lines[i] = lineContent.replace(/âš\s*ï¸ No address set in profile/, 'ยังไม่ได้ตั้งค่าที่อยู่ในโปรไฟล์');
    if (lines[i] !== lineContent) {
      console.log('Fixed line', i + 1);
      fixed = true;
    }
  }
}

if (fixed) {
  content = lines.join('\n');
  fs.writeFileSync('D:/pawin/pawin-backend 31 20250106/frontend/src/screens/ShippingScreen.jsx', content, 'utf8');
  console.log('Saved');
} else {
  console.log('No fix needed or pattern not found');
}