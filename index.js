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
          background-image: url('https://wallpaperaccess.com/full/1567770.gif'); /* Add the path to your background image */
          background-size: cover;
          background-position: center;
        }

        .container {
          text-align: center;
          background-color:#b3bac4;
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
        <h2>MEDIUM FOLLOWERS COUNT</h2>
        <form action="/getFollowers" method="get">
          <div class="input-group mb-3">
    <input type="text" name="username" class="form-control" placeholder="Enter Medium Username Only..." required>
    <button type="submit" class="btn btn-primary">SEARCH</button>
</div>
</form>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.get('/getFollowers', (req, res) => {
  let username = req.query.username;

  if (!username) {
    res.send('Please provide a username.');
    return;
  }

  if (username.startsWith('@')) {
    username = username.substring(1);
  }
  if (!username.match(/^[a-zA-Z0-9-_]+$/)) {
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Error: Invalid Username</title>
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
            background-color: #f8d7da;
          }

          .container {
            text-align: center;
            background-color: #fff;
            padding: 20px;
            border-radius: 10px;
          }

          #errorMessage {
            color: #721c24;
            font-weight: bold;
            margin-bottom: 20px;
          }

          #searchAgain {
            margin-top: 20px;
          }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 id="errorMessage">Only correct Medium search results are acceptable, not even URLs</h1>
          <p><a href="/" id="searchAgain" class="btn btn-primary">Search Again</a></p>
        </div>
      </body>
      </html>
    `;
    res.send(html);
    return;
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
              background-image: url('/background.jpg'); /* Add the path to your background image */
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
      if (error.message.includes('No user found')) {
        const html = `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Error: Invalid Username</title>
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
                background-color: #000000;
              }

              .container {
                text-align: center;
                background-color: #fff;
                padding: 20px;
                border-radius: 10px;
              }

              #errorMessage {
                color: #721c24;
                font-weight: bold;
                margin-bottom: 20px;
              }

              #searchAgain {
                margin-top: 20px;
              }
            </style>
          </head>
          <body>
            <div class="container">
              <h1 id="errorMessage">Only Correct Username Accetable Not Even URL</h1>
              <p><a href="/" id="searchAgain" class="btn btn-primary">Search Again</a></p>
            </div>
          </body>
          </html>
        `;
        res.send(html);
      } else {
        res.status(500).send(`Error: ${error.message}`);
      }
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
