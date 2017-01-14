var mongodb = require('mongodb');
var csv = require('csv-parser');
var fs = require('fs');

var MongoClient = mongodb.MongoClient;

var mongoUrl = 'mongodb://localhost:27017/workshop';

var insertActors = function(db, callback) {
  var collection = db.collection('actors');

  var actors = [];
  fs.createReadStream('./data/Top_1000_Actors_and_Actresses.csv')
    .pipe(csv())
    .on('data', function (data) {
      actors.push({
        "imdb_id": data.imdb_id,
        "name": data.name,
        "birth_date": data.birth_date
      });
    })
    .on('end', function() {
      collection.insertMany(actors, function(err, result) {
        callback(result);
      });
    });
}

var updateActors = function(db, callback) {
  var collection = db.collection('actors');

  fs.readFile('./data/Top_1000_Actors_and_Actresses.json', 'utf8', function (err,data) {
    var updates = data.split('\n')
      .map(function(line) {
        return JSON.parse(line);
      })
      .map(function(actor) {
        return {
          "updateOne" : {
               "filter" : {
                 "imdb_id": actor.data.id
               },
               "update" : {
                 "$set" : {
                   "description" : (actor.data.description || "No description provided").replace('                                See full bio &raquo;', ''),
                   "image" : actor.data.image
                 }
               }
          }
        }
      });

    collection.bulkWrite(updates, function(err, result) {
      callback(result);
    });
  });
}

MongoClient.connect(mongoUrl, function(err, db) {
  console.log("Connected successfully to server");
  insertActors(db, function(result) {
    console.log(result.insertedCount + ' actors inserted');
    updateActors(db, function(result) {
      console.log(result.modifiedCount + ' actors updated');
      db.close();
    });
  });
});
