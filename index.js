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
        <meta name="description" content="Tool to display real-time follower count for Medium users.">
        <link rel="icon" href="https://cdn.iconscout.com/icon/free/png-256/free-medium-47-433328.png?f=webp" type="image/x-icon">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.2/css/all.min.css" />
        <title>MEDIUM REALTIME FOLLOWERS COUNT TOOL</title>
        <style>
            html, body {
                overflow: hidden;
            }
            * {
                font-family: 'Libre Baskerville', serif;
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            html {
                font-size: 62.5%;
            }

            body {
                background: linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url('https://rajaniraiyn.github.io/windows11/src/wallpaper/img28.webp');
                background-repeat: no-repeat;
                background-position: center;
                background-size: cover;
                height: 100vh;
                display: flex;
                justify-content: center;
                align-items: center;
            }

            .container {
                box-shadow: rgba(0, 0, 0, 0.4) 0px 54px 55px, rgba(0, 0, 0, 0.3) 0px -12px 30px, rgba(0, 0, 0, 0.2) 0px 4px 6px, rgba(0, 0, 0, 0.5) 0px 12px 13px, rgba(0, 0, 0, 0.5) 0px -3px 5px;
                max-width: 477px;
                width: 100%;
                height: auto;
                background: rgba(0, 0, 0, 0.5);
                border-radius: 19px;
                padding: 6rem;
            }

            .container > h1 {
                font-family: 'Cinzel', serif;
                font-size: 1.3rem;
                text-align: center;
                margin-top: 2rem;
                letter-spacing: 0.1em;
                color: #fdfdfd;
                border-bottom: 4px solid #42a0a0;
                text-shadow: 0 0 10px #38adad, 0 0 20px #38adad, 0 0 30px #38adad, 0 0 40px #38adad, 0 0 50px #38adad;
                animation: glow 2s infinite alternate;
            }

            .form {
                width: 100%;
                display: flex;
                justify-content: center;
                align-items: center;
                flex-direction: column;
            }

            .form-group {
                background: transparent;
                padding: 1rem 3rem;
                display: inline-block;
                color: #9ababa;
            }

            .form-control {
                background: transparent;
                width: 116%;
                max-width: 231px;
                height: 35px;
                padding: 0.5rem 1.5rem;
                opacity: 0.9;
                color: #f5f5f5;
                border: none;
                outline: none;
                box-shadow: rgb(255 208 208 / 40%) 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px;
            }

            .form-control::placeholder {
                color: #f5f5f5;
                font-size: 1.6rem;
            }

            .btn {
                font-family: 'Libre Baskerville', serif;
                padding: 0.8rem 1.8rem;
                margin-top: 1.5rem;
                background: transparent;
                border: none;
                font-size: 1.4rem;
                font-weight: 600;
                text-transform: uppercase;
                letter-spacing: 0.1em;
                cursor: pointer;
                color: #f5f5f5;
                text-align: center;
                transition: all 0.4s ease;
                box-shadow: #ff4040 0px 2px 4px, rgba(0, 0, 0, 0.3) 0px 7px 13px -3px;
            }

            .btn:hover {
                background: rgba(255, 255, 255, 0.3);
            }

            .result {
                font-size: 1.9em;
                margin: 10px 0;
                color: #03040a00;
                font-weight: bold;
                text-shadow: 0px 1px 0px #a9b5ff, 0 0 10px #000000, 0 0 15px #EFEBE9;

                text-align: center;
            }

            .error {
                color: yellow;
                font-size: 1.9em;
                margin-top: 20px;
                text-align: center;
            }

            .copyright {
                color: #ffffff;
                text-align: center;
                margin: 1rem;
                font-size: 1.4rem;
                font-family: 'Cinzel', serif;
                font-weight: bold;
                letter-spacing: 0.1em;
            }

            @media (max-width: 768px) {
                .container {
                    padding: 2rem;
                }

                .form-control {
                    width: 100%;
                    max-width: 100%;
                }

                .btn {
                    padding: 0.6rem 1.4rem;
                    font-size: 1.2rem;
                }

                .result, .error, .copyright {
                    font-size: 1.2rem;
                }
            }

            @media (max-width: 480px) {
                .container > h1 {
                    font-size: 1.2rem;
                }

                .form-control::placeholder {
                    font-size: 1.4rem;
                }
            }
        </style>
    </head>
    <body>
        <div class="container">
            <h1>MEDIUM REALTIME FOLLOWERS COUNT TOOL</h1>
            <br>
            <form class="form" id="searchForm">
                <div class="form-group">
                    <input type="text" class="form-control" id="username" placeholder="Medium Username only" required>
                </div>
                <button class="btn" type="submit" id="fetchBtn">Submit</button>
            </form>
            <div id="output"></div>
            <p class="copyright">Designed & Developed By Yashwanth R</p>
        </div>
        <script>
            document.addEventListener('DOMContentLoaded', function() {
                const form = document.getElementById('searchForm');
                const fetchBtn = document.getElementById('fetchBtn');

                function handleSubmit(event) {
                    event.preventDefault();
                    const username = document.getElementById('username').value.trim();
                    const mediumUsernameRegex = /^@?[a-zA-Z0-9_-]+$/;

                    if (!mediumUsernameRegex.test(username)) {
                        const output = document.getElementById('output');
                        output.innerHTML = 'Only Medium username is acceptable.';
                        output.className = 'error';
                        return;
                    }

                    fetch(\`/getFollowers?username=\${username}\`)
                        .then(response => response.json())
                        .then(data => {
                            const output = document.getElementById('output');
                            if (data.numFollowers === undefined || data.joinedDate === undefined) {
                                output.innerHTML = 'Only correct Medium username is acceptable.';
                                output.className = 'error';
                            } else {
                                const joinedDateParts = data.joinedDate.split('-');
                                const year = joinedDateParts[0];
                                const month = joinedDateParts[1];
                                const day = joinedDateParts[2];

                                output.innerHTML = \`
                                    <p class="result">Followers: \${data.numFollowers}</p>
                                    <p class="result">Joined Date: \${day}-\${month}-\${year}</p>
                                \`;
                                output.className = '';
                            }
                        })
                        .catch(error => {
                            const output = document.getElementById('output');
                            output.innerHTML = 'Error: ' + error.message;
                            output.className = 'error';
                        });
                }

                form.addEventListener('submit', handleSubmit);
                fetchBtn.addEventListener('click', handleSubmit);
            });
        </script>
    </body>
    </html>
  `);
});

app.get('/getFollowers', (req, res) => {
  const username = req.query.username;

  if (!username) {
    return res.status(400).json({ error: 'Please provide a username.' });
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
