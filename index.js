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
      <title>Medium Followers Checker</title>
      <style>
        body { 
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
          text-align: center; 
          margin-top: 60px; 
          background-color: #f8f9fa;
          color: #333;
          line-height: 1.6;
        }
        .container {
          max-width: 500px;
          margin: 0 auto;
          padding: 25px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.08);
        }
        h1 { 
          color: #1a8917; 
          margin-bottom: 30px;
          font-weight: 600;
        }
        form { 
          margin-bottom: 25px; 
        }
        input { 
          padding: 12px 15px; 
          width: 280px; 
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 16px;
          transition: border-color 0.3s;
        }
        input:focus {
          outline: none;
          border-color: #1a8917;
          box-shadow: 0 0 0 3px rgba(26, 137, 23, 0.15);
        }
        button { 
          padding: 12px 28px; 
          background: #1a8917;
          color: white;
          border: none;
          border-radius: 8px;
          font-size: 16px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          margin-left: 8px;
        }
        button:hover {
          background: #156d12;
          transform: translateY(-1px);
        }
        button:active {
          transform: translateY(0);
        }
        button:disabled {
          background: #a0d8a0;
          cursor: wait;
        }
        #result {
          min-height: 36px;
          font-size: 1.3em;
          margin-top: 15px;
          padding: 12px;
          border-radius: 8px;
          background: #f0f7f0;
          display: none;
        }
        .loading {
          display: inline-block;
          width: 20px;
          height: 20px;
          border: 3px solid rgba(26, 137, 23, 0.3);
          border-radius: 50%;
          border-top-color: #1a8917;
          animation: spin 1s linear infinite;
          margin-right: 10px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .error { 
          background: #fff0f0; 
          color: #d32f2f;
        }
        .success { 
          color: #1a8917; 
          font-weight: 600;
        }
        .username { 
          font-weight: 600; 
          color: #1a0dab; 
        }
        @media (max-width: 480px) {
          .container { padding: 20px; }
          input { width: 240px; }
          button { margin-top: 10px; margin-left: 0; }
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Medium Followers Checker</h1>
        <form id="followerForm">
          <input type="text" name="username" placeholder="Enter Medium username" required autocomplete="off">
          <button type="submit" id="searchBtn">Check</button>
        </form>
        <div id="result"></div>
      </div>

      <script>
        document.getElementById('followerForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const username = document.querySelector('input[name="username"]').value.trim();
          const resultDiv = document.getElementById('result');
          const searchBtn = document.getElementById('searchBtn');
          
          // Reset UI
          resultDiv.textContent = '';
          resultDiv.className = '';
          resultDiv.style.display = 'block';
          searchBtn.disabled = true;
          
          // Show loading state
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
            
            // Extract result from response HTML
            const resultElement = tempDiv.querySelector('h2');
            if (resultElement) {
              // Check if it's an error message
              const isFailure = resultElement.textContent.includes('not available');
              resultDiv.className = isFailure ? 'error' : 'success';
              resultDiv.innerHTML = resultElement.innerHTML;
            } else {
              throw new Error('Unexpected response format');
            }
          } catch (error) {
            resultDiv.className = 'error';
            resultDiv.innerHTML = '❌ Error: Could not fetch followers. Please try again later.';
            console.error('Fetch error:', error);
          } finally {
            searchBtn.disabled = false;
          }
        });
        
        // Auto-focus input on load
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
      <h2>Followers for <b>${username}</b>: ${followers.toLocaleString()}</h2>
      <a href="/">Check another user</a>
    `);
  } else {
    res.send(`
      <h2>Followers not available for <b>${username}</b></h2>
      <a href="/">Try again</a>
    `);
  }
});

/* Start server */
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
