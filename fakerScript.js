require('dotenv').config();

const mariadb = require('mariadb');
const { Faker, fr } = require('@faker-js/faker');

// Configuration de la connexion à la base de données
const pool = mariadb.createPool({
    host: process.env.APP_HOST,
    user: process.env.APP_USER,
    password: process.env.APP_PASSWORD,
    database: process.env.APP_DB,
    connectionLimit: 20
});

const faker = new Faker({ locale: [fr] })

async function SQLRequest(query, params){

    return new Promise((resolve, reject)=>{
        pool.execute(query, params, (error, results)=> {
            if (error){
                reject(new Error(error));
                console.log(error)
            }
            resolve(results);
        })
    })
}

// Génération des fausses données pour la table "users"
async function generateUsers() {
    const users = [];
    for (let i = 1; i <= 86; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({firstName, lastName});
        const password = faker.internet.password();
        const phone = faker.phone.number();

        const query = `INSERT INTO users (firstname, lastname, mail, password, phone)
                   VALUES (?,?,?,?,?,?)`;

        await SQLRequest(query, [firstName, lastName, email, password, phone]);
        users.push({ id: i, firstName, lastName, email, password, phone });
    }
    return users;
}

// Exécution de la génération des données
async function main(){
    console.log('start')
    try {
        // // Génération des utilisateurs
        const users = await generateUsers();
        console.log('Utilisateurs générés avec succès.');
    }catch(e){
        console.error(e)
    }
}
main()