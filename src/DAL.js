const MongoClient = require('mongodb').MongoClient;



// Database Name
const dbName = 'TimeIn';

var db;

MongoClient.connect(url, function(err, client) {
    assert.equal(null, err);
    console.log("Connected successfully to server");
  
      db = client.db(dbName);
  
    client.close();
  });

// Use connect method to connect to the server
function getBusinessbyId(id) {
    
}


module.exports = {
    getBusinessbyId
}