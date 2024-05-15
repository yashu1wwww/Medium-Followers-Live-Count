<!-- Copying the code is easy, but when you create it, you have to become busy -->
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

function getFollowersForUser(username) {
  const options = {
    uri: generateMediumProfileUri(username),
    transform: massageHijackedPreventionResponse,
  };

  return request(options)
    .then((profileData) => {
      const numFollowers = extractFollowedByCount(profileData);
      return Promise.resolve(numFollowers);
    });
}

app.use(express.static('public')); 
app.get('/', (req, res) => {
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
	     <meta http-equiv="X-UA-Compatible" content="IE=edge">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Medium Followers Live Count</title>
      <link rel="icon" href="https://cdn.iconscout.com/icon/free/png-256/free-medium-47-433328.png?f=webp" type="image/x-icon">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
      <style>
        body {
          font-family: Arial, sans-serif;
          margin: 0;
          padding: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          height: 100vh;
          background-image: url('https://wallpaperaccess.com/full/1567770.gif');
          background-size: cover;
          background-position: center;
        }

        .container {
          text-align: center;
          background-color:#8cafe76b;
          padding: 20px;
          border-radius: 10px;
        }

        #followersCount {
          color: #333;
        }
.title {
    font-family: Arial, sans-serif;
    font-size: 17px;
    color: #271313e6;
    background-color: #1f11112e;
    display: inline-block;
    padding: -1px 3px;
    text-transform: uppercase;
}
      </style>
    </head>
    <body>
     <div class="container">
    <div class="outer-black-box">
        <button style="background-color:#00000014; padding: 10px 8px; margin-right: 27px;">
            <a href="#" style="display: flex; align-items: center; text-decoration: none; color: black; font-size: 14px; font-weight: bold;">
               <img src="data:image/png;base64,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" alt="medium Logo" style="height: 30px; margin-right: 5px; width: 150px;">
                REALTIME FOLLOWERS COUNT
            </a>
			</button>
	<br>
	<br>
<div class="center">
  <h5 class="title">Visitors Count</h5>
</div>
<a href="https://www.hitwebcounter.com" target="_blank">
<img src="https://hitwebcounter.com/counter/counter.php?page=12946004&style=0006&nbdigits=4&type=page&initCount=1000" title="Counter Widget" Alt="Visit counter For Websites"   border="0" /></a>   
<br>
<div class="container" style="margin-top: 20px; text-align: center;">
  <button style="background-color: #00000000; padding: 10px 20px; margin-right: 1px;">
    <a href="https://yashwanthwebproject.netlify.app" style="color: black; text-decoration: none; font-size: 18px; font-weight: bold; display: block; background-color: inherit; border: 2px solid white; border-radius: 5px; padding: 5px;">
      Web Development Projects
    </a>
  </button>
</div>
        <form id="searchForm" action="/getFollowers" method="get">
          <div class="input-group mb-3">
            <input type="text" name="username" id="username" class="form-control" placeholder="Enter Medium Username Only..." required>
            <button type="submit" class="btn btn-primary">SEARCH</button>
          </div>
        </form>
      </div>
      
      <script>
        document.addEventListener('DOMContentLoaded', function() {
          const form = document.getElementById('searchForm');
          form.addEventListener('submit', function(event) {
            const input = document.getElementById('username');
            const username = input.value.trim();
  
            const mediumUsernameRegex = /^@?[a-zA-Z0-9_-]+$/;
  
            if (!mediumUsernameRegex.test(username)) {
              event.preventDefault();
              alert('Only Medium username is acceptable.');
            }
          });
        });
      </script>
    </body>
    </html>
  `;
  res.send(html);
});

app.get('/getFollowers', (req, res) => {
  const username = req.query.username;

  if (!username) {
    // Show a popup notification for missing username
    return res.send(`
      <script>alert('Please provide a username.')</script>
      <meta http-equiv="refresh" content="0; url=/">
    `);
  }

  getFollowersForUser(username)
    .then((numFollowers) => {
      const html = `
        <!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Medium Followers Live Count</title>
          <link rel="icon" href="https://cdn.iconscout.com/icon/free/png-256/free-medium-47-433328.png?f=webp" type="image/x-icon">
          <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.0/dist/css/bootstrap.min.css" rel="stylesheet">
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              display: flex;
              align-items: center;
              justify-content: center;
              height: 100vh;
              background-image: url('/background.jpg');
              background-size: cover;
              background-position: center;
            }

            .container {
              text-align: center;
              background-color: rgba(255, 255, 255, 0.8);
              padding: 20px;
              border-radius: 10px;
            }

            #followersCount {
              color: #333;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <h1 id="followersCount">${username}'s Followers: ${numFollowers}</h1>
            <p><a href="/" class="btn btn-primary">Search Again</a></p>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    })
    .catch((error) => {
      // Show a popup notification for errors
      res.send(`
        <script>alert('Error: ${error.message}')</script>
        <meta http-equiv="refresh" content="0; url=/">
      `);
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
