const mongodb = require('mongodb');
const csv = require('csv-parser');
const fs = require('fs');

const MongoClient = mongodb.MongoClient;
const mongoUrl = 'mongodb://localhost:27017';
const dbName = 'mongo102';

const insertActors = (db, callback) => {
    const collection = db.collection('actors');

    const actors = [];
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

MongoClient.connect(mongoUrl, (err, client) => {
    if (err) {
        console.error(err);
        throw err;
    }
    const db = client.db(dbName);
    insertActors(db, result => {
        console.log(`${result.insertedCount} actors inserted`);
        client.close();
    });
});
