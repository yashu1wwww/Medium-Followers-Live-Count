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
      <title>Medium Followers</title>
      <!-- Add Bootstrap CSS link -->
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
          background-color:HoneyDew;
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
        <h1>Enter Medium Username</h1>
        <form action="/getFollowers" method="get">
          <div class="input-group mb-3">
            <input type="text" name="username" class="form-control" required>
            <button type="submit" class="btn btn-primary">Get Followers</button>
          </div>
        </form>
      </div>
    </body>
    </html>
  `;
  res.send(html);
});

app.get('/getFollowers', (req, res) => {
  const username = req.query.username;

  if (!username) {
    res.send('Please provide a username.');
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
          <title>Medium Followers</title>
          <!-- Add Bootstrap CSS link -->
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
            <p><a href="/" class="btn btn-primary">Go Back</a></p>
          </div>
        </body>
        </html>
      `;
      res.send(html);
    })
    .catch((error) => {
      res.status(500).send(`Error: ${error.message}`);
    });
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});

