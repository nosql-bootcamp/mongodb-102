var mongodb = require('mongodb');
var fs = require('fs');

var MongoClient = mongodb.MongoClient;
var mongoUrl = 'mongodb://localhost:27017/workshop';

var actorToUpdateQuery = function(actor) {
    return {
        "updateOne": {
            "filter": {
                "imdb_id": actor.data.id
            },
            "update": {
                "$set": {
                    "description": (actor.data.description || "No description provided").replace('                                See full bio &raquo;', ''),
                    "image": actor.data.image,
                    "occupation": actor.data.occupation
                }
            }
        }
    };
}

var updateActors = function(db, callback) {
    var collection = db.collection('actors');

    fs.readFile('./data/Top_1000_Actors_and_Actresses.json', 'utf8', (err, data) => {
        var updates = data.split('\n')
            // Chaque ligne correspond à un document JSON décrivant un acteur en détail
            .map(line => JSON.parse(line))
            // On transforme chaque ligne en requête de mise à jour qui sera utilisée dans un 'bulkWrite()'
            .map(actor => actorToUpdateQuery(actor));

        collection.bulkWrite(updates, (err, result) => {
            callback(result);
        });
    });
}

MongoClient.connect(mongoUrl, (err, db) => {
    updateActors(db, result => {
        console.log(`${result.modifiedCount} actors updated`);
        db.close();
    });
});
