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
        // Pour chaque ligne on créé un document JSON pour l'acteur correspondant
        .on('data', data => {
            actors.push({
                "imdb_id": data.imdb_id,
                "name": data.name,
                "birth_date": data.birth_date
            });
        })
        // A la fin on créé l'ensemble des acteurs dans MongoDB
        .on('end', () => {
            collection.insertMany(actors, (err, result) => {
                callback(result);
            });
        });
}

MongoClient.connect(mongoUrl, (err, db) => {
    insertActors(db, result => {
        console.log(`${result.insertedCount} actors inserted`);
        db.close();
    });
});
