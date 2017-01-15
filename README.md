# MongoDB 102

![mongo-logo](https://upload.wikimedia.org/wikipedia/en/thumb/4/45/MongoDB-Logo.svg/300px-MongoDB-Logo.svg.png)

**MongoDB 102** est un workshop permettant de découvrir le driver Node.js natif pour MongoDB.

<a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/"><img alt="Creative Commons Licence" style="border-width:0" src="https://i.creativecommons.org/l/by-nc-sa/4.0/88x31.png" /></a>

<span xmlns:dct="http://purl.org/dc/terms/" property="dct:title">mongodb-102</span> par <a xmlns:cc="http://creativecommons.org/ns#" href="https://github.com/nosql-bootcamp/mongodb-102" property="cc:attributionName" rel="cc:attributionURL">Chris WOODROW et Sébastien PRUNIER</a> est distribué sous les termes de la licence <a rel="license" href="http://creativecommons.org/licenses/by-nc-sa/4.0/">Creative Commons - Attribution - NonCommercial - ShareAlike</a>.

Ce workshop est basé sur la **version 3.4.1** de MongoDB.

## Le jeu de données

Le jeu de données utilisé pour le workshop est un ensemble d'actrices et d'acteurs, issus de la base [IMDb](http://www.imdb.com/).

Plus précisément, deux fichiers nous servent de source de données :

* `Top_1000_Actors_and_Actresses.csv` est un fichier CSV contenant le Top 1000 des actrices et acteurs, depuis lequel nous pourrons extraire le nom de l'actrice ou de l'acteur, sa date de naissance et son identifiant IMDb.
* `Top_1000_Actors_and_Actresses.json` est un fichier contenant une fiche détaillée au format JSON de chacun des 1000 actrices et acteur. Nous pourrons extraire de ce fichier une description, un lien vers une photos et une liste de métiers (acteur, réalisateur, producteur, etc...)

Ces deux fichiers sont disponibles dans le dossier `src/data`.

## Driver natif MongoDB pour Node.js

Les exemples de code du workshop se basent sur le [driver natif MongoDB pour Node.js](https://mongodb.github.io/node-mongodb-native/). La version utilisée est la [version 2.2](http://mongodb.github.io/node-mongodb-native/2.2/).

L'avantage d'utiliser Node.js et le driver natif est que la syntaxe des requêtes du driver est quasiment identique à celles effectuées dans le shell.

La dépendance au driver MongoDB est déjà présente dans le fichier `package.json`, ainsi que la dépendance au module `csv-parser` nécessaire pour la suite :

```json
"dependencies": {
  "csv-parser": "1.11.0",
  "mongodb": "2.2.21"
}
```

## Création des acteurs

L'objectif de cette première partie est d'alimenter une collection `actors` à partir du fichier CSV `Top_1000_Actors_and_Actresses.csv`.

Pour cela nous nous appuyons sur le module `csv-parser` pour lire le fichier CSV et sur la méthode `insertMany()` de MongoDB :

```javascript
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
```

Ce code est disponible dans le fichier `src/insert_actors.js`. Vous pouvez l'exécuter afin d'alimenter une première fois la base :

```bash
cd src

# A ne lancer qu'une seule fois pour récupérer les dépendances
npm install

node insert_actors.js
```


## Mise à jour des acteurs

L'objectif de cette seconde partie est de compléter chaque document de la collection `actors` à partir des données du fichier `Top_1000_Actors_and_Actresses.json`.

Pour cela nous nous appuyons sur la méthode `bulkWrite()` de MongoDB :

```javascript
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
```

Ce code est disponible dans le fichier `src/update_actors.js`. Vous pouvez l'exécuter :

```bash
cd src

# A ne lancer qu'une seule fois pour récupérer les dépendances
npm install

node update_actors.js
```

## Requêtes

A vous de jouer pour exécuter quelques requêtes intéressantes sur les données !

Par exemple pour récupérer l'acteur le plus vieux du Top 1000 :

```javascript
db.actors.find().sort({"birth_date": 1}).limit(1)
```

Autre exemple pour compter le nombre d'acteurs qui sont aussi des producteurs :

```javascript
db.actors.find({"occupation": "producer"}).count()
```
