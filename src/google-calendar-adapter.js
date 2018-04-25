const google = require('googleapis');

function init(callback){
  const fs = require('fs');
  const mkdirp = require('mkdirp');
  const readline = require('readline');
  const OAuth2Client = google.google.auth.OAuth2;
  const SCOPES = ['https://www.googleapis.com/auth/calendar.readonly'];
  const TOKEN_PATH = 'credentials.json';
  
  // Load client secrets from a local file.
  fs.readFile('secret/client_secret_753232535471-6g5gaeprojdr7kc27i1ihhgeeli7k514.apps.googleusercontent.com.json', (err, content) => {
    if (err) return console.log('Error loading client secret file:', err);
    // Authorize a client with credentials, then call the Calendar API.
    authorize(JSON.parse(content), callback);
  });
    
  /**
   * Create an OAuth2 client with the given credentials, and then execute the
   * given callback function.
   * @param {Object} credentials The authorization client credentials.
   * @param {function} callback The callback to call with the authorized client.
   */
  function authorize(credentials, callback) {
    const { client_secret, client_id, redirect_uris } = credentials.installed;
    const oAuth2Client = new OAuth2Client(client_id, client_secret, redirect_uris[0]);

    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, (err, token) => {
      if (err) return getAccessToken(oAuth2Client, callback);
      oAuth2Client.setCredentials(JSON.parse(token));
      callback(oAuth2Client);
    });
  }

  /**
   * Get and store new token after prompting for user authorization, and then
   * execute the given callback with the authorized OAuth2 client.
   * @param {google.auth.OAuth2} oAuth2Client The OAuth2 client to get token for.
   * @param {getEventsCallback} callback The callback for the authorized client.
   */
  function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
      rl.close();
      oAuth2Client.getToken(code, (err, token) => {
        if (err) return callback(err);
        oAuth2Client.setCredentials(token);
        // Store the token to disk for later program executions
        fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
          if (err) console.error(err);
          console.log('Token stored to', TOKEN_PATH);
        });
        callback(oAuth2Client);
      });
    });
  }
}

/**
 * Lists the next 100 events on the user's primary calendar.
 * @param {google.auth.OAuth2} auth An authorized OAuth2 client.
 */
function listEvents(auth, callback) {
  const calendar = google.google.calendar({version: 'v3', auth});
  const timeMin = new Date(new Date().getTime() - 24 * 60 * 60 * 1000);

  calendar.events.list({
    calendarId: 'primary',
    timeMin: timeMin.toISOString(),
    maxResults: 100,
    singleEvents: true,
    orderBy: 'startTime',
  }, (err, {data}) => {
    if (err) return console.log('The API returned an error: ' + err);
    const events = data.items;
    callback(events);
    
  });
}

function getEvents(){
  return new Promise((resolve, reject) => {
    init(auth => {
        listEvents(auth, (list) => {
            if (list.length){
                let newList = [];

                list.map(item => {
                  newList.push({ start: item.start.dateTime, end: item.end.dateTime })
                })

                resolve(newList);
            }
            else {
                reject("error")
            }
        })
    });
  })
}

exports.module = { getEvents }