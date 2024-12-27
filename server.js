const express = require('express');
const app = express();
const port = 3000;
const path = require('path');

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
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
