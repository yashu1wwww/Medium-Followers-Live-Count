const express = require('express');
const axios = require('axios');
const NodeCache = require('node-cache');

const app = express();
const cache = new NodeCache({ stdTTL: 600 }); // 10 minutes

app.set('trust proxy', true);

// Helper: Extract follower count from HTML
function extractFollowersFromText(text) {
  const match = text.match(/(\d{1,3}(?:,\d{3})*)\s+followers/i);
  if (match) {
    return parseInt(match[1].replace(/,/g, ''), 10);
  }
  return null;
}

app.get('/getFollowers', async (req, res) => {
  const username = req.query.username?.trim();

  if (!username || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ error: 'Enter Correct username' });
  }

  // ✅ CACHE CHECK
  const cached = cache.get(username);
  if (cached) {
    return res.json({ numFollowers: cached });
  }

  const headers = {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120',
    'Accept-Language': 'en-US,en;q=0.9'
  };

  // ✅ STRATEGY 1: Medium JSON API
  try {
    const jsonUrl = `https://medium.com/@${username}?format=json`;

    const response = await axios.get(jsonUrl, {
      headers,
      timeout: 8000
    });

    const cleanJson = response.data.replace('])}while(1);</x>', '');
    const data = JSON.parse(cleanJson);

    const count = data.payload?.user?.socialStats?.followersCount;
    if (count && count > 0) {
      cache.set(username, count);
      return res.json({ numFollowers: count });
    }
  } catch (err) {
    console.warn('JSON blocked:', err.message);
  }

  // ✅ STRATEGY 2: HTML fallback
  const urls = [
    `https://${username}.medium.com/followers`,
    `https://medium.com/@${username}/followers`
  ];

  for (const url of urls) {
    try {
      const response = await axios.get(url, {
        headers,
        timeout: 8000
      });

      const followers = extractFollowersFromText(response.data);
      if (followers && followers > 0) {
        cache.set(username, followers);
        return res.json({ numFollowers: followers });
      }
    } catch (err) {
      console.warn('HTML blocked:', err.message);
    }
  }

  // ❌ Medium blocked Render IP
  res.status(503).json({
    error: 'Medium blocked this request. Try again later.'
  });
});

// =======================
// UI ROUTE (UNCHANGED CSS)
// =======================
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <link rel="icon" type="image/jpeg" href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRSaSpbfxZ0vrnsU6pkYbQARlgbwiMZD3hC2g&s">
  <title>Medium Realtime Followers Tool</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      overflow: hidden;
      background: linear-gradient(135deg, #9d4edd 0%, #c77dff 50%, #9d4edd 100%);
    }
    .container {
      width: 100%;
      max-width: 500px;
      padding: 20px;
      z-index: 1;
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
      width: 60px; height: 60px; background: #000; color: #fff;
      border-radius: 50%; display: flex; align-items: center;
      justify-content: center; font-size: 28px; font-weight: bold;
      margin: 0 auto 30px;
    }
    .title {
      font-size: 17px; font-weight: 700; color: #fff;
      letter-spacing: 1px; margin-bottom: 45px; line-height: 1.2;
    }
    .input-field {
      width: 100%;
      padding: 16px 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff;
      font-size: 16px;
      margin-bottom: 25px;
      font-family: inherit;
      outline: none;
    }
    .btn-primary {
      width: 100%; padding: 16px;
      background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
      color: #fff; border: none; border-radius: 20px;
      font-size: 16px; font-weight: 700;
      cursor: pointer;
    }
    .result {
      margin-top: 30px; min-height: 40px;
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; color: #fff;
    }
    .footer {
      margin-top: 40px; font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">M</div>
      <h3 class="title">MEDIUM REAL TIME FOLLOWERS TOOL</h3>
      <input type="text" id="username" class="input-field" placeholder="Enter Medium Username Only">
      <button class="btn-primary" onclick="check()">GET FOLLOWERS COUNT</button>
      <div id="result" class="result"></div>
      <footer class="footer">
        Designed & Developed by <b>Yashwanth R</b>
      </footer>
    </div>
  </div>

<script>
async function check() {
  const username = document.getElementById('username').value.trim();
  const result = document.getElementById('result');

  if (!username) {
    alert('Enter Correct username');
    return;
  }

  result.textContent = 'Loading...';

  try {
    const res = await fetch('/getFollowers?username=' + encodeURIComponent(username));
    const data = await res.json();

    if (res.ok) {
      result.innerHTML = '<b>' + data.numFollowers.toLocaleString() + '</b>';
    } else {
      alert(data.error);
      result.textContent = '';
    }
  } catch {
    alert('Network error');
    result.textContent = '';
  }
}
</script>
</body>
</html>
`);
});

module.exports = app;

// ✅ LOCAL DEV
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log('✅ Server running on port', PORT);
  });
}
