const fetch = require('node-fetch'); // Assuming node-fetch is available, or use native fetch if Node 18+

async function testApi() {
  try {
    const res = await fetch('http://localhost:5000/api/products');
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log(`Body: ${text}`);
  } catch (err) {
    console.error("Fetch Error:", err.message);
  }
}
testApi();
