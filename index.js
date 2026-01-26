const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.use(express.static('public'));

// ---------------- SCRAPER ----------------
async function scrapeFollowers(username) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Speed + anti-bot
  await page.setUserAgent(
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 Chrome/120 Safari/537.36'
  );
  await page.setViewport({ width: 1366, height: 768 });

  // 🚀 BLOCK heavy resources
  await page.setRequestInterception(true);
  page.on('request', req => {
    const type = req.resourceType();
    if (['image', 'font', 'media', 'stylesheet'].includes(type)) {
      req.abort();
    } else {
      req.continue();
    }
  });

  const url1 = `https://${username}.medium.com/followers`;
  const url2 = `https://medium.com/@${username}/followers`;

  let followersCount = null;

  try {
    await page.goto(url1, { waitUntil: 'domcontentloaded', timeout: 12000 });
    followersCount = await extractFollowers(page);
  } catch {}

  if (!followersCount) {
    try {
      await page.goto(url2, { waitUntil: 'domcontentloaded', timeout: 12000 });
      followersCount = await extractFollowers(page);
    } catch {}
  }

  await browser.close();

  if (!followersCount) {
    throw new Error('Profile not found');
  }

  return followersCount;
}

// ---------------- SMART EXTRACTOR ----------------
async function extractFollowers(page) {
  const text = await page.evaluate(() => {

    // 1️⃣ Try container-based (subdomain profiles)
    const divs = Array.from(document.querySelectorAll('div'));
    for (const div of divs) {
      if (div.textContent.includes('Followers')) {
        const h2 = div.querySelector('h2');
        if (h2 && /followers$/i.test(h2.textContent.trim())) {
          return h2.textContent.trim();
        }
      }
    }

    // 2️⃣ Fallback: global h2 ( @username profiles )
    const h2s = Array.from(document.querySelectorAll('h2'));
    const el = h2s.find(h =>
      /followers$/i.test(h.textContent.trim())
    );

    return el ? el.textContent.trim() : null;
  });

  return text ? parseFollowers(text) : null;
}

// ---------------- PARSER ----------------
function parseFollowers(text) {
  text = text.toLowerCase().replace('followers', '').trim();

  const match = text.match(/([\d,.]+)\s*([km])?/i);
  if (!match) return null;

  let num = parseFloat(match[1].replace(/,/g, ''));
  const unit = match[2];

  if (unit === 'k') num *= 1_000;
  if (unit === 'm') num *= 1_000_000;

  return Math.round(num);
}

// ---------------- API ----------------
app.get('/getFollowers', async (req, res) => {
  const username = req.query.username?.trim();

  if (!username)
    return res.status(400).json({ error: 'Username is required.' });

  if (!/^[a-zA-Z0-9._-]+$/.test(username))
    return res.status(400).json({ error: 'Invalid username format.' });

  try {
    const followers = await scrapeFollowers(username);
    res.json({ numFollowers: followers });
  } catch (err) {
    res.status(404).json({ error: 'Not found' });
  }
});

// ---------------- UI ----------------
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medium Followers Tool</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }

    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
    }

    .background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(135deg, #9d4edd 0%, #c77dff 50%, #9d4edd 100%);
      z-index: -1;
    }

    .circle {
      position: absolute;
      border-radius: 50%;
      opacity: 0.15;
      animation: float ease-in-out infinite;
    }

    .circle-1 {
      width: 300px;
      height: 300px;
      top: -50px;
      right: 50px;
      background: rgba(255, 255, 255, 0.2);
      animation: float1 8s ease-in-out infinite;
    }

    .circle-2 {
      width: 200px;
      height: 200px;
      top: 150px;
      left: -80px;
      background: rgba(255, 255, 255, 0.15);
      animation: float2 10s ease-in-out infinite;
    }

    .circle-3 {
      width: 250px;
      height: 250px;
      bottom: 100px;
      left: 80px;
      background: rgba(255, 255, 255, 0.1);
      animation: float3 12s ease-in-out infinite;
    }

    .circle-4 {
      width: 180px;
      height: 180px;
      bottom: 50px;
      right: 120px;
      background: rgba(255, 255, 255, 0.12);
      animation: float4 9s ease-in-out infinite;
    }

    @keyframes float1 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-30px) translateX(20px); }
    }

    @keyframes float2 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(40px) translateX(-25px); }
    }

    @keyframes float3 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(-35px) translateX(15px); }
    }

    @keyframes float4 {
      0%, 100% { transform: translateY(0px) translateX(0px); }
      50% { transform: translateY(25px) translateX(-20px); }
    }

    .container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 500px;
      padding: 20px;
    }

    .card {
      background: rgba(93, 39, 126, 0.3);
      backdrop-filter: blur(10px);
      border-radius: 30px;
      padding: 50px 40px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      text-align: center;
      border: 1px solid rgba(255, 255, 255, 0.1);
    }

    .logo {
      width: 60px;
      height: 60px;
      background: #000;
      color: #fff;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 28px;
      font-weight: bold;
      margin: 0 auto 30px;
    }

    .title {
      font-size: 25px;
      font-weight: 700;
      color: #fff;
      letter-spacing: 1px;
      margin-bottom: 45px;
      line-height: 1.2;
    }

    .form-group {
      margin-bottom: 25px;
    }

    .input-field {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 16px;
      transition: all 0.3s ease;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    }

    .input-field::placeholder {
      color: rgba(255, 255, 255, 0.6);
    }

    .input-field:focus {
      outline: none;
      border-color: rgba(255, 255, 255, 0.6);
      background: rgba(255, 255, 255, 0.15);
      box-shadow: 0 0 15px rgba(255, 255, 255, 0.2);
    }

    .btn-primary {
      width: 100%;
      padding: 16px;
      background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
      color: #fff;
      border: none;
      border-radius: 20px;
      font-size: 16px;
      font-weight: 700;
      letter-spacing: 0.5px;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(255, 107, 157, 0.3);
    }

    .btn-primary:hover {
      transform: translateY(-2px);
      box-shadow: 0 12px 30px rgba(255, 107, 157, 0.4);
    }

    .btn-primary:active {
      transform: translateY(0);
    }

    .result {
      margin-top: 30px;
      min-height: 40px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 38px;
      color: #fff;
      transition: all 0.3s ease;
    }

    .result.success {
      color: #6effa3;
    }

    .result.error {
      color: #ff6b6b;
    }

    .result.loading {
      font-size: 16px;
      animation: pulse 1.5s ease-in-out infinite;
    }

    @keyframes pulse {
      0%, 100% {
        opacity: 0.7;
      }
      50% {
        opacity: 1;
      }
    }

    .footer {
      margin-top: 40px;
      font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }

    .author {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }

    @media (max-width: 600px) {
      .card {
        padding: 40px 25px;
        border-radius: 25px;
      }

      .title {
        font-size: 24px;
        margin-bottom: 25px;
      }

      .logo {
        width: 50px;
        height: 50px;
        font-size: 24px;
      }

      .input-field,
      .btn-primary {
        padding: 14px 16px;
        font-size: 15px;
      }

      .result b {
        font-size: 24px;
      }
    }
  </style>
</head>
<body>
  <div class="background">
    <div class="circle circle-1"></div>
    <div class="circle circle-2"></div>
    <div class="circle circle-3"></div>
    <div class="circle circle-4"></div>
  </div>

  <div class="container">
    <div class="card">
      <div class="logo">M</div>
      <h3 class="title">MEDIUM FOLLOWERS TOOL</h3>
      <div class="form-group">
        <input type="text" id="username" class="input-field" placeholder="Enter Medium Username Only" autocomplete="off">
      </div>
      <button class="btn-primary" onclick="check()">GET FOLLOWERS COUNT</button>
      <div id="result" class="result"></div>
      <footer class="footer">
        Designed & Developed by <span class="author">Yashwanth R</span>
      </footer>
    </div>
  </div>

  <script>
    async function check() {
      const username = document.getElementById('username').value.trim();
      const resultDiv = document.getElementById('result');

      if (!username) {
        alert('Enter Correct Username');
        return;
      }

      // Same regex as backend for consistency
      if (!/^[a-zA-Z0-9._-]+$/.test(username)) {
        alert('Enter Correct Username');
        return;
      }

      resultDiv.className = 'result loading';
      resultDiv.textContent = 'Loading...'; // ✅ Changed from "Checking followers..."

      try {
        const response = await fetch('/getFollowers?username=' + encodeURIComponent(username));
        const data = await response.json();

        if (response.ok) {
          // ✅ ONLY show the number — no "followers" text
          resultDiv.className = 'result success';
          resultDiv.innerHTML = '<b>' + data.numFollowers.toLocaleString() + '</b>';
        } else {
          alert('Enter Correct Username');
          resultDiv.textContent = '';
        }
      } catch (error) {
        alert('Enter Correct Username');
        resultDiv.textContent = '';
      }
    }

    document.getElementById('username').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        check();
      }
    });

    document.getElementById('username').addEventListener('focus', () => {
      document.getElementById('result').textContent = '';
    });
  </script>
</body>
</html>
`);
});

app.listen(port, () => {
  console.log(`✅ Server running at http://localhost:${port}`);
});
