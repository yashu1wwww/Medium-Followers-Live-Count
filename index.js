const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.urlencoded({ extended: true }));

/* simple delay */
const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function getFollowers(username) {
  const urls = [
    `https://${username}.medium.com/followers`,
    `https://medium.com/@${username}/followers`
  ];

  for (const url of urls) {
    try {
      await sleep(1200); // important to avoid rate limits

      const res = await axios.get(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 AppleWebKit/537.36'
        },
        timeout: 10000
      });

      const html = res.data;

      const match = html.match(/<h2[^>]*>\s*([\d,]+)\s+followers\s*<\/h2>/i);

      if (match) {
        return parseInt(match[1].replace(/,/g, ''), 10);
      }
    } catch (e) {
      continue;
    }
  }
  return null;
}

/* Serve homepage with embedded HTML/JS */
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medium Realtime Followers Count</title>
      <link rel="icon" href="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtZmNJmVFzKn2sZmJyW547OrmP3UAFZ5m-mQ&s" type="image/png">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }

        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Helvetica Neue', sans-serif;
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 20px;
          color: white;
          position: relative;
          overflow: hidden;
        }

        .bubble {
          position: absolute;
          border-radius: 50%;
          background: rgba(255, 255, 255, 0.1);
          animation: float 15s infinite ease-in-out;
        }

        .bubble:nth-child(1) {
          width: 80px;
          height: 80px;
          top: 10%;
          left: 10%;
          animation-delay: 0s;
        }

        .bubble:nth-child(2) {
          width: 120px;
          height: 120px;
          top: 20%;
          right: 10%;
          animation-delay: 2s;
        }

        .bubble:nth-child(3) {
          width: 60px;
          height: 60px;
          bottom: 20%;
          left: 15%;
          animation-delay: 4s;
        }

        .bubble:nth-child(4) {
          width: 100px;
          height: 100px;
          bottom: 10%;
          right: 20%;
          animation-delay: 6s;
        }

        .bubble:nth-child(5) {
          width: 70px;
          height: 70px;
          top: 50%;
          left: 50%;
          animation-delay: 3s;
        }

        .bubble:nth-child(6) {
          width: 90px;
          height: 90px;
          top: 30%;
          right: 30%;
          animation-delay: 5s;
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0px) translateX(0px);
          }
          25% {
            transform: translateY(-50px) translateX(30px);
          }
          50% {
            transform: translateY(-80px) translateX(-30px);
          }
          75% {
            transform: translateY(-40px) translateX(50px);
          }
        }

        .content {
          position: relative;
          z-index: 10;
          text-align: center;
          max-width: 600px;
          width: 100%;
        }

        .logo {
          width: 100px;
          height: 100px;
          margin: 0 auto 30px;
          border-radius: 20px;
          box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
          animation: fadeIn 0.8s ease-out;
        }

        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.8);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        h1 {
          font-size: 36px;
          font-weight: 700;
          margin-bottom: 40px;
          letter-spacing: -0.5px;
          text-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
        }

        form {
          display: flex;
          flex-direction: column;
          gap: 16px;
          margin-bottom: 50px;
        }

        .input-group {
          display: flex;
          gap: 12px;
          flex-wrap: wrap;
          justify-content: center;
        }

        input {
          flex: 1;
          min-width: 200px;
          padding: 14px 18px;
          border: 2px solid rgba(255, 255, 255, 0.3);
          border-radius: 12px;
          font-size: 16px;
          font-family: inherit;
          transition: all 0.3s ease;
          background: rgba(255, 255, 255, 0.15);
          color: white;
          backdrop-filter: blur(10px);
        }

        input::placeholder {
          color: rgba(255, 255, 255, 0.7);
        }

        input:focus {
          outline: none;
          border-color: rgba(255, 255, 255, 0.6);
          background: rgba(255, 255, 255, 0.25);
          box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.15);
        }

        button {
          padding: 14px 32px;
          background: rgba(255, 255, 255, 0.25);
          color: white;
          border: 2px solid rgba(255, 255, 255, 0.4);
          border-radius: 12px;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 120px;
          backdrop-filter: blur(10px);
        }

        button:hover:not(:disabled) {
          background: rgba(255, 255, 255, 0.35);
          border-color: rgba(255, 255, 255, 0.6);
          transform: translateY(-2px);
          box-shadow: 0 12px 24px rgba(0, 0, 0, 0.2);
        }

        button:active:not(:disabled) {
          transform: translateY(0);
        }

        button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        #result {
          min-height: 50px;
          padding: 18px;
          border-radius: 12px;
          font-size: 16px;
          display: none;
          animation: slideDown 0.4s ease-out;
          backdrop-filter: blur(10px);
          background: rgba(255, 255, 255, 0.15);
          border: 2px solid rgba(255, 255, 255, 0.2);
          margin-bottom: 30px;
        }

        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        #result.success {
          background: rgba(34, 197, 94, 0.25);
          color: #86efac;
          border-color: rgba(34, 197, 94, 0.4);
        }

        #result.error {
          background: rgba(220, 38, 38, 0.25);
          color: #fca5a5;
          border-color: rgba(220, 38, 38, 0.4);
        }

        .loading {
          display: inline-block;
          width: 18px;
          height: 18px;
          border: 3px solid rgba(255, 255, 255, 0.3);
          border-top-color: white;
          border-radius: 50%;
          animation: spin 0.8s linear infinite;
          margin-right: 10px;
          vertical-align: middle;
        }

        @keyframes spin {
          to {
            transform: rotate(360deg);
          }
        }

        .username {
          font-weight: 700;
          color: #ffd700;
        }

        #result.success {
          background: rgba(34, 197, 94, 0.25);
          border-color: rgba(34, 197, 94, 0.4);
          font-size: 72px !important;
          font-weight: 700 !important;
          padding: 40px 20px !important;
          color: #86efac !important;
          min-height: auto !important;
          margin-bottom: 40px;
        }

        .footer {
          position: relative;
          z-index: 10;
          text-align: center;
          margin-top: 40px;
          font-size: 13px;
          color: rgba(255, 255, 255, 0.8);
        }

        .footer strong {
          color: white;
        }

        @media (max-width: 640px) {
          h1 {
            font-size: 28px;
            margin-bottom: 30px;
          }

          .logo {
            width: 80px;
            height: 80px;
            margin-bottom: 25px;
          }

          .input-group {
            flex-direction: column;
          }

          input {
            min-width: 100%;
          }

          button {
            width: 100%;
          }

          .footer {
            font-size: 12px;
          }
        }
      </style>
    </head>
    <body>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>
      <div class="bubble"></div>

      <div class="content">
        <img src="https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRtZmNJmVFzKn2sZmJyW547OrmP3UAFZ5m-mQ&s" alt="Medium Logo" class="logo">
        <h1>Medium Realtime Followers Count</h1>

        <form id="followerForm">
          <div class="input-group">
            <input type="text" name="username" placeholder="Enter your Medium username" required autocomplete="off">
            <button type="submit" id="searchBtn">Check</button>
          </div>
        </form>

        <div id="result"></div>

        <div class="footer">
          Designed & Developed by <strong>Yashwanth R</strong>
        </div>
      </div>

      <script>
        document.getElementById('followerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.querySelector('input[name="username"]').value.trim();
          const resultDiv = document.getElementById('result');
          const searchBtn = document.getElementById('searchBtn');

          resultDiv.textContent = '';
          resultDiv.className = '';
          resultDiv.style.display = 'block';
          searchBtn.disabled = true;

          resultDiv.innerHTML = '<div class="loading"></div> Checking followers for <span class="username">' +
                               username + '</span>...';

          try {
            const formData = new URLSearchParams();
            formData.append('username', username);

            const response = await fetch('/followers', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: formData
            });

            const htmlText = await response.text();
            const tempDiv = document.createElement('div');
            tempDiv.innerHTML = htmlText;

            const resultElement = tempDiv.querySelector('h2');
            if (resultElement) {
              const text = resultElement.textContent.trim();
              const isFailure = text.includes('Not available') || text.includes('not available');
              resultDiv.className = isFailure ? 'error' : 'success';
              resultDiv.textContent = text;
            } else {
              throw new Error('Unexpected response format');
            }
          } catch (error) {
            resultDiv.className = 'error';
            resultDiv.innerHTML = '⚠️ Error: Could not fetch followers. Please try again later.';
            console.error('Fetch error:', error);
          } finally {
            searchBtn.disabled = false;
          }
        });

        window.addEventListener('load', () => {
          document.querySelector('input[name="username"]').focus();
        });
      </script>
    </body>
    </html>
  `);
});

/* Handle form submission - UNCHANGED FROM ORIGINAL */
app.post('/followers', async (req, res) => {
  const username = req.body.username?.trim();
  if (!username) {
    return res.send('Please enter a Medium username!');
  }

  const followers = await getFollowers(username);

  if (followers !== null) {
    res.send(`
      <h2>${followers.toLocaleString()}</h2>
    `);
  } else {
    res.send(`
      <h2>Not available</h2>
    `);
  }
});

/* Start server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
