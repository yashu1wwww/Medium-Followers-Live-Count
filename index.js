const express = require('express');
const app = express();
const port = 3000;
const _ = require('lodash');
const request = require('request-promise');

const JSON_HIJACKING_PREFIX = '])}while(1);</x>';

function generateMediumProfileUri(username) {
  return `https://medium.com/@${username}?format=json`;
}

function massageHijackedPreventionResponse(response) {
  return JSON.parse(response.replace(JSON_HIJACKING_PREFIX, ''));
}

function extractFollowedByCount(profileData) {
  const userId = _.get(profileData, 'payload.user.userId');
  return _.get(profileData, `payload.references.SocialStats.${userId}.usersFollowedByCount`, 0);
}

function extractJoinedDate(profileData) {
  const joinedTimestamp = _.get(profileData, 'payload.user.createdAt');
  if (joinedTimestamp) {
    const joinedDate = new Date(joinedTimestamp);
    if (!isNaN(joinedDate.getTime())) {
      return joinedDate.toISOString().split('T')[0]; // Returns YYYY-MM-DD
    }
  }
  return "Unknown";
}

function getFollowersAndJoinedDate(username) {
  const options = {
    uri: generateMediumProfileUri(username),
    transform: massageHijackedPreventionResponse,
  };

  return request(options)
    .then((profileData) => {
      const numFollowers = extractFollowedByCount(profileData);
      const joinedDate = extractJoinedDate(profileData);
      return Promise.resolve({ numFollowers, joinedDate });
    })
    .catch((error) => {
      // Handle different types of errors with user-friendly messages
      if (error.statusCode === 404) {
        throw new Error('Updating Soon.');
      }
      if (error.message && error.message.includes('No user found')) {
        throw new Error('Updating Soon.');
      }
      if (error.message && error.message.includes('success\":false')) {
        throw new Error('Updating Soon.');
      }
      // For any other error, show the same message
      throw new Error('Updating Soon.');
    });
}

app.use(express.static('public'));

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta name="description" content="Beautiful tool to display real-time follower count for Medium users with stunning animations and modern design.">
        <link rel="icon" href="https://cdn.iconscout.com/icon/free/png-256/free-medium-47-433328.png?f=webp" type="image/x-icon">
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&family=Playfair+Display:wght@400;500;600;700&display=swap" rel="stylesheet">
        <title>Medium Realtime Followers Count Tool</title>
        <style>
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            :root {
                --primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                --secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
                --accent-gradient: linear-gradient(135deg, #4facfe 0%, #00f2fe 100%);
                --dark-gradient: linear-gradient(135deg, #2c3e50 0%, #34495e 100%);
                --glass-bg: rgba(255, 255, 255, 0.1);
                --glass-border: rgba(255, 255, 255, 0.2);
                --text-primary: #ffffff;
                --text-secondary: rgba(255, 255, 255, 0.8);
                --shadow-primary: 0 20px 40px rgba(0, 0, 0, 0.3);
                --shadow-secondary: 0 10px 30px rgba(0, 0, 0, 0.2);
            }

            html {
                font-size: 62.5%;
                scroll-behavior: smooth;
            }

            body {
                font-family: 'Inter', sans-serif;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%);
                background-size: 400% 400%;
                animation: gradientShift 15s ease infinite;
                min-height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
                overflow-x: hidden;
                position: relative;
            }

            body::before {
                content: '';
                position: absolute;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: url('data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><pattern id="grain" width="100" height="100" patternUnits="userSpaceOnUse"><circle cx="25" cy="25" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="75" cy="75" r="1" fill="rgba(255,255,255,0.1)"/><circle cx="50" cy="10" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="10" cy="60" r="0.5" fill="rgba(255,255,255,0.05)"/><circle cx="90" cy="40" r="0.5" fill="rgba(255,255,255,0.05)"/></pattern></defs><rect width="100" height="100" fill="url(%23grain)"/></svg>');
                pointer-events: none;
                z-index: 1;
            }

            .floating-shapes {
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                overflow: hidden;
                z-index: 2;
                pointer-events: none;
            }

            .shape {
                position: absolute;
                background: rgba(255, 255, 255, 0.1);
                border-radius: 50%;
                animation: float 20s infinite linear;
            }

            .shape:nth-child(1) {
                width: 80px;
                height: 80px;
                left: 10%;
                animation-delay: 0s;
                animation-duration: 25s;
            }

            .shape:nth-child(2) {
                width: 120px;
                height: 120px;
                left: 80%;
                animation-delay: 5s;
                animation-duration: 30s;
            }

            .shape:nth-child(3) {
                width: 60px;
                height: 60px;
                left: 50%;
                animation-delay: 10s;
                animation-duration: 20s;
            }

            .container {
                position: relative;
                z-index: 10;
                max-width: 500px;
                width: 90%;
                background: var(--glass-bg);
                backdrop-filter: blur(20px);
                border: 1px solid var(--glass-border);
                border-radius: 24px;
                padding: 4rem 3rem;
                box-shadow: var(--shadow-primary);
                animation: slideUp 0.8s ease-out;
                transition: all 0.3s ease;
            }

            .container:hover {
                transform: translateY(-5px);
                box-shadow: 0 30px 60px rgba(0, 0, 0, 0.4);
            }

            .header {
                text-align: center;
                margin-bottom: 3rem;
            }

           .logo {
    width: 60px;
    height: 60px;
    background: var(--accent-gradient);
    border-radius: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    margin: 0 auto 2rem;
    box-shadow: var(--shadow-secondary);
    animation: pulse 2s infinite;
    background-image: url('https://cdn.iconscout.com/icon/free/png-256/free-medium-47-433328.png?f=webp');
    background-size: 70%;
    background-repeat: no-repeat;
    background-position: center;
}


            .title {
                font-family: 'Playfair Display', serif;
                font-size: 2.8rem;
                font-weight: 600;
                color: var(--text-primary);
                margin-bottom: 1rem;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                line-height: 1.2;
            }

            .subtitle {
                font-size: 1.6rem;
                color: var(--text-secondary);
                font-weight: 400;
                line-height: 1.4;
            }

            .form {
                display: flex;
                flex-direction: column;
                gap: 2rem;
                margin-bottom: 2rem;
            }

            .input-group {
                position: relative;
            }

            .input-field {
                width: 100%;
                padding: 1.6rem 2rem;
                background: rgba(255, 255, 255, 0.1);
                border: 2px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                color: var(--text-primary);
                font-size: 1.6rem;
                font-weight: 500;
                outline: none;
                transition: all 0.3s ease;
                backdrop-filter: blur(10px);
            }

            .input-field::placeholder {
                color: rgba(255, 255, 255, 0.6);
                font-weight: 400;
            }

            .input-field:focus {
                border-color: rgba(255, 255, 255, 0.5);
                background: rgba(255, 255, 255, 0.15);
                transform: translateY(-2px);
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
            }

            .submit-btn {
                padding: 1.8rem 3rem;
                background: var(--secondary-gradient);
                border: none;
                border-radius: 16px;
                color: white;
                font-size: 1.6rem;
                font-weight: 600;
                cursor: pointer;
                transition: all 0.3s ease;
                box-shadow: var(--shadow-secondary);
                text-transform: uppercase;
                letter-spacing: 0.5px;
                position: relative;
                overflow: hidden;
            }

            .submit-btn::before {
                content: '';
                position: absolute;
                top: 0;
                left: -100%;
                width: 100%;
                height: 100%;
                background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
                transition: left 0.5s;
            }

            .submit-btn:hover::before {
                left: 100%;
            }

            .submit-btn:hover {
                transform: translateY(-3px);
                box-shadow: 0 15px 40px rgba(0, 0, 0, 0.3);
            }

            .submit-btn:active {
                transform: translateY(-1px);
            }

            .loading {
                opacity: 0.7;
                pointer-events: none;
            }

            .loading::after {
                content: '';
                position: absolute;
                top: 50%;
                left: 50%;
                width: 20px;
                height: 20px;
                margin: -10px 0 0 -10px;
                border: 2px solid transparent;
                border-top: 2px solid white;
                border-radius: 50%;
                animation: spin 1s linear infinite;
            }

            .result-container {
                margin-top: 2rem;
                opacity: 0;
                transform: translateY(20px);
                transition: all 0.5s ease;
            }

            .result-container.show {
                opacity: 1;
                transform: translateY(0);
            }

            .result-card {
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(255, 255, 255, 0.2);
                border-radius: 16px;
                padding: 2.5rem;
                text-align: center;
                backdrop-filter: blur(10px);
                margin-bottom: 1rem;
            }

            .followers-count {
                font-size: 3.6rem;
                font-weight: 800;
                color: var(--text-primary);
                margin-bottom: 0.5rem;
                text-shadow: 0 2px 10px rgba(0, 0, 0, 0.3);
                animation: countUp 0.8s ease-out;
            }

            .followers-label {
                font-size: 1.4rem;
                color: var(--text-secondary);
                text-transform: uppercase;
                letter-spacing: 1px;
                font-weight: 500;
            }

            .joined-date {
                font-size: 1.6rem;
                color: var(--text-secondary);
                margin-top: 1rem;
                padding-top: 1rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .error {
                background: linear-gradient(135deg, #ff6b6b, #ee5a52);
                color: white;
                padding: 2rem;
                border-radius: 16px;
                text-align: center;
                font-size: 1.6rem;
                font-weight: 500;
                box-shadow: var(--shadow-secondary);
                animation: shake 0.5s ease-in-out;
            }

            .footer {
                text-align: center;
                margin-top: 3rem;
                padding-top: 2rem;
                border-top: 1px solid rgba(255, 255, 255, 0.1);
            }

            .copyright {
                font-size: 1.3rem;
                color: var(--text-secondary);
                font-weight: 400;
            }

            .developer-name {
                color: var(--text-primary);
                font-weight: 600;
                text-decoration: none;
                transition: all 0.3s ease;
            }

            .developer-name:hover {
                color: #4facfe;
                text-shadow: 0 0 10px rgba(79, 172, 254, 0.5);
            }

            /* Animations */
            @keyframes gradientShift {
                0% { background-position: 0% 50%; }
                50% { background-position: 100% 50%; }
                100% { background-position: 0% 50%; }
            }

            @keyframes float {
                0% { transform: translateY(100vh) rotate(0deg); opacity: 0; }
                10% { opacity: 1; }
                90% { opacity: 1; }
                100% { transform: translateY(-100px) rotate(360deg); opacity: 0; }
            }

            @keyframes slideUp {
                from {
                    opacity: 0;
                    transform: translateY(50px);
                }
                to {
                    opacity: 1;
                    transform: translateY(0);
                }
            }

            @keyframes pulse {
                0%, 100% { transform: scale(1); }
                50% { transform: scale(1.05); }
            }

            @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
            }

            @keyframes countUp {
                from {
                    opacity: 0;
                    transform: scale(0.5);
                }
                to {
                    opacity: 1;
                    transform: scale(1);
                }
            }

            @keyframes shake {
                0%, 100% { transform: translateX(0); }
                25% { transform: translateX(-5px); }
                75% { transform: translateX(5px); }
            }

            /* Responsive Design */
            @media (max-width: 768px) {
                html { font-size: 56.25%; }
                
                .container {
                    padding: 3rem 2rem;
                    margin: 2rem;
                }

                .title {
                    font-size: 2.4rem;
                }

                .followers-count {
                    font-size: 3rem;
                }
            }

            @media (max-width: 480px) {
                html { font-size: 50%; }
                
                .container {
                    padding: 2.5rem 1.5rem;
                }

                .title {
                    font-size: 2.2rem;
                }

                .input-field, .submit-btn {
                    padding: 1.4rem 1.8rem;
                }
            }

            /* Dark mode support */
            @media (prefers-color-scheme: dark) {
                :root {
                    --glass-bg: rgba(0, 0, 0, 0.2);
                    --glass-border: rgba(255, 255, 255, 0.1);
                }
            }
        </style>
    </head>
    <body>
        <div class="floating-shapes">
            <div class="shape"></div>
            <div class="shape"></div>
            <div class="shape"></div>
        </div>

        <div class="container">
            <div class="header">
                <div class="logo"></div>
                <h1 class="title">MEDIUM FOLLOWERS TOOL</h1>
            </div>

            <form class="form" id="searchForm">
                <div class="input-group">
                    <input 
                        type="text" 
                        class="input-field" 
                        id="username" 
                        placeholder="Enter Medium Username Only " 
                        required
                        autocomplete="off"
                    >
                </div>
                <button class="submit-btn" type="submit" id="fetchBtn">
                    <span>Get Followers Count</span>
                </button>
            </form>

            <div id="output" class="result-container"></div>

            <div class="footer">
                <p class="copyright">
                    Designed & Developed by 
                    <a href="https://yashwanthwebproject.netlify.app/" class="developer-name">Yashwanth R</a>
                </p>
            </div>
        </div>

        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('searchForm');
                const fetchBtn = document.getElementById('fetchBtn');
                const output = document.getElementById('output');
                const usernameInput = document.getElementById('username');

                function setLoading(isLoading) {
                    if (isLoading) {
                        fetchBtn.classList.add('loading');
                        fetchBtn.innerHTML = '';
                        fetchBtn.disabled = true;
                    } else {
                        fetchBtn.classList.remove('loading');
                        fetchBtn.innerHTML = '<span>Get Followers Count</span>';
                        fetchBtn.disabled = false;
                    }
                }

                function showResult(data) {
                    const joinedDateParts = data.joinedDate.split('-');
                    const year = joinedDateParts[0];
                    const month = joinedDateParts[1];
                    const day = joinedDateParts[2];

                    const monthNames = [
                        'January', 'February', 'March', 'April', 'May', 'June',
                        'July', 'August', 'September', 'October', 'November', 'December'
                    ];
                    
                    const formattedDate = \`\${monthNames[parseInt(month) - 1]} \${parseInt(day)}, \${year}\`;

                    output.innerHTML = \`
                        <div class="result-card">
                            <div class="followers-count">\${data.numFollowers.toLocaleString()}</div>
                            <div class="followers-label">Followers</div>
                            <div class="joined-date">Member since \${formattedDate}</div>
                        </div>
                    \`;
                    output.classList.add('show');
                }

                function showError(message) {
                    output.innerHTML = \`<div class="error">\${message}</div>\`;
                    output.classList.add('show');
                }

                function handleSubmit(event) {
                    event.preventDefault();
                    const username = usernameInput.value.trim().replace('@', '');
                    const mediumUsernameRegex = /^[a-zA-Z0-9_-]+$/;

                    output.classList.remove('show');
                    
                    if (!username) {
                        showError('Please enter a Medium username.');
                        return;
                    }

                    if (!mediumUsernameRegex.test(username)) {
                        showError('Please enter a valid Medium username.');
                        return;
                    }

                    setLoading(true);

                    fetch(\`/getFollowers?username=\${username}\`)
                        .then(response => response.json())
                        .then(data => {
                            setLoading(false);
                            if (data.error) {
                                showError(data.error);
                            } else if (data.numFollowers === undefined || data.joinedDate === undefined) {
                                showError('Only Medium username is acceptable.');
                            } else {
                                showResult(data);
                            }
                        })
                        .catch(error => {
                            setLoading(false);
                            showError('Only Medium username is acceptable.');
                            console.error('Error:', error);
                        });
                }

                form.addEventListener('submit', handleSubmit);
                
                // Add enter key support
                usernameInput.addEventListener('keypress', function(event) {
                    if (event.key === 'Enter') {
                        handleSubmit(event);
                    }
                });

                // Auto-focus input field
                usernameInput.focus();
            });
        </script>
    </body>
    </html>
  `);
});

app.get('/getFollowers', (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: 'Only Medium username is acceptable.' });
  }

  getFollowersAndJoinedDate(username)
    .then(({ numFollowers, joinedDate }) => {
      res.json({ numFollowers, joinedDate });
    })
    .catch((error) => {
      res.status(500).json({ error: error.message });
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

