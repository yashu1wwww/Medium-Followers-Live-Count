const express = require('express');
const axios = require('axios');
const app = express();
const port = process.env.PORT || 3000;

app.use(express.static('public'));

// ---------------- JSON API FETCHER (NO PUPPETEER) ----------------
app.get('/getFollowers', async (req, res) => {
  const username = req.query.username?.trim();

  if (!username || !/^[a-zA-Z0-9._-]+$/.test(username)) {
    return res.status(400).json({ error: 'Invalid username format.' });
  }

  try {
    // ✅ CORRECT URL - NO EXTRA SPACES
    const url = `https://medium.com/@${username}?format=json`;
    
    const response = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; MediumFollowerChecker/1.0)'
      },
      timeout: 10000
    });

    // Remove Medium's anti-scraping prefix
    const cleanJson = response.data.replace('])}while(1);</x>', '');
    const data = JSON.parse(cleanJson);

    const followersCount = data.payload?.user?.socialStats?.followersCount;

    if (followersCount == null) {
      return res.status(404).json({ error: 'Profile not found or private' });
    }

    res.json({ numFollowers: followersCount });
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response?.status === 404) {
      res.status(404).json({ error: 'Profile not found' });
    } else {
      res.status(500).json({ error: 'Failed to fetch data' });
    }
  }
});

// ---------------- EMBEDDED UI ----------------
app.get('/', (req, res) => {
  res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Medium Followers Tool</title>
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
      font-size: 25px; font-weight: 700; color: #fff;
      letter-spacing: 1px; margin-bottom: 45px; line-height: 1.2;
    }
    .input-field {
      width: 100%; padding: 16px 20px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-radius: 20px;
      background: rgba(255, 255, 255, 0.1);
      color: #fff; font-size: 16px;
      margin-bottom: 25px;
      font-family: inherit;
    }
    .btn-primary {
      width: 100%; padding: 16px;
      background: linear-gradient(135deg, #ff6b9d 0%, #ff8fab 100%);
      color: #fff; border: none; border-radius: 20px;
      font-size: 16px; font-weight: 700;
      cursor: pointer;
      transition: all 0.3s ease;
      box-shadow: 0 8px 20px rgba(255, 107, 157, 0.3);
    }
    .result {
      margin-top: 30px; min-height: 40px;
      display: flex; align-items: center; justify-content: center;
      font-size: 38px; color: #fff; transition: all 0.3s ease;
    }
    .result.success { color: #6effa3; }
    .result.error { color: #ff6b6b; }
    .result.loading {
      font-size: 16px;
      animation: pulse 1.5s ease-in-out infinite;
    }
    @keyframes pulse {
      0%, 100% { opacity: 0.7; }
      50% { opacity: 1; }
    }
    .footer {
      margin-top: 40px; font-size: 14px;
      color: rgba(255, 255, 255, 0.7);
    }
    .author {
      font-weight: 600;
      color: rgba(255, 255, 255, 0.9);
    }
    @media (max-width: 600px) {
      .card { padding: 40px 25px; border-radius: 25px; }
      .title { font-size: 24px; margin-bottom: 25px; }
      .logo { width: 50px; height: 50px; font-size: 24px; }
      .input-field, .btn-primary { padding: 14px 16px; font-size: 15px; }
      .result b { font-size: 24px; }
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="card">
      <div class="logo">M</div>
      <h3 class="title">MEDIUM FOLLOWERS TOOL</h3>
      <input type="text" id="username" class="input-field" placeholder="Enter Medium Username Only" autocomplete="off">
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

      if (!username || !/^[a-zA-Z0-9._-]+$/.test(username)) {
        alert('Enter a valid Medium username (letters, numbers, . _ - only)');
        return;
      }

      resultDiv.className = 'result loading';
      resultDiv.textContent = 'Loading...';

      try {
        const response = await fetch('/getFollowers?username=' + encodeURIComponent(username));
        const data = await response.json();

        if (response.ok) {
          resultDiv.className = 'result success';
          resultDiv.innerHTML = '<b>' + data.numFollowers.toLocaleString() + '</b>';
        } else {
          alert(data.error || 'Profile not found');
          resultDiv.textContent = '';
        }
      } catch (error) {
        alert('Network error. Try again.');
        resultDiv.textContent = '';
      }
    }

    document.getElementById('username').addEventListener('keypress', (e) => {
      if (e.key === 'Enter') check();
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
