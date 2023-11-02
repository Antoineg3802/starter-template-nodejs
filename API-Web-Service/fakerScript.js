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

// Génération des fausses données pour la table "adresses"
async function generateAdresses() {
    console.log("Generating...")
    const adresses = [];
    for (let i = 1; i <= 71; i++) {
        console.log(i)
        const streetNumber = faker.string.numeric(2);
        const streetName = faker.location.street();
        const description = faker.lorem.sentence();
        const postalCode = faker.location.zipCode();
        const city = faker.location.city();

        const query = `INSERT INTO adresses (street_number, street_name, description, postal_code, city)
                   VALUES (?,?,?,?,?)`;

        console.log(query, [streetNumber, streetName, description, postalCode, city])

        await SQLRequest(query, [streetNumber, streetName, description, postalCode, city]);
        adresses.push({ id: i, streetNumber, streetName, description, postalCode, city });
    }
    return adresses;
}

// Génération des fausses données pour la table "establishements"
async function generateEstablishments(adresses) {
    const establishments = [];
    for (let i = 1; i <= 30; i++) {
        const siret = faker.string.numeric(14);
        const name = faker.company.name();
        const description = faker.lorem.sentence();
        const addressId = faker.helpers.arrayElement(adresses).id;

        const query = `INSERT INTO establishements (siret, name, description, adress_id)
                   VALUES (?,?,?,?)`;

        await SQLRequest(query, [siret, name, description, addressId]);
        establishments.push({ id: i, siret, name, description, addressId });
    }
    return establishments;
}

// Génération des fausses données pour la table "users"
async function generateUsers() {
    const users = [];
    for (let i = 1; i <= 86; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const email = faker.internet.email({firstName, lastName});
        const password = faker.internet.password();
        const roleId = faker.string.numeric(14, { min: 1, max: 3 });
        const phone = faker.phone.number();

        const query = `INSERT INTO users (firstname, lastname, mail, password, role_id, phone)
                   VALUES (?,?,?,?,?,?)`;

        await SQLRequest(query, [firstName, lastName, email, password, roleId, phone]);
        users.push({ id: i, firstName, lastName, email, password, roleId, phone });
    }
    return users;
}

// Génération des fausses données pour la table "services"
async function generateServices() {
    const services = [
        { name: 'Coiffure', description: 'Se faire couper les cheveux', salaryCount: 0 },
        { name: 'Esthétique', description: 'Rendez-vous frais', salaryCount: 0 },
    ];

    for (let i = 0; i < services.length; i++) {
        const { name, description, salaryCount } = services[i];

        const query = `INSERT INTO services (name, description, salary_count)
                   VALUES (?,?,?)`;

        await SQLRequest(query, [name, description, salaryCount]);
    }
}

// Génération des fausses données pour la table "appointments"
async function generateAppointments(users) {
    const appointments = [];
    for (let i = 1; i <= 100; i++) {
        const date = faker.date.recent({ days: 25});
        const duration = faker.string.numeric({ min: 30, max: 120 });
        const userId = faker.helpers.arrayElement(users).id;
        const serviceId = faker.string.numeric({ min: 1, max: 2 });

        const query = `INSERT INTO appointments (date, duration, user_id, service_id)
                   VALUES (?,?,?,?)`;

        await SQLRequest(query, [date.toISOString(), duration, userId, serviceId]);
        appointments.push({ id: i, date, duration, userId, serviceId });
    }
    return appointments;
}

// Génération des fausses données pour la table "notes"
async function generateNotes(users, establishments) {
    const notes = [];
    for (let i = 1; i <= 50; i++) {
        const note = faker.string.numeric({ min: 1, max: 5 });
        const comment = faker.lorem.paragraph();
        const userId = faker.helpers.arrayElement(users).id;
        const establishmentId = faker.helpers.arrayElement(establishments).id;

        const query = `INSERT INTO notes (note, comment, user_id, establishment_id)
                   VALUES (?,?,?,?)`;

        await SQLRequest(query, [note, comment, userId, establishmentId]);
        notes.push({ id: i, note, comment, userId, establishmentId });
    }
    return notes;
}

// Exécution de la génération des données
async function main(){
    console.log('start')
    try {
        // Génération des adresses
        const adresses = await generateAdresses();
        console.log('Adresses générées avec succès.');

        // Génération des établissements
        // const establishments = await generateEstablishments(adresses);
        // console.log('Établissements générés avec succès.');

        // // // Génération des utilisateurs
        // const users = await generateUsers();
        // console.log('Utilisateurs générés avec succès.');

        // // // Génération des services
        // await generateServices();
        // console.log('Services générés avec succès.');

        // // // Génération des rendez-vous
        // const appointments = await generateAppointments(users);
        // console.log('Rendez-vous générés avec succès.');

        // // // Génération des notes
        // const notes = await generateNotes(users, establishments);
        // console.log('Notes générées avec succès.');

        // console.log('Génération de données fictives terminée.');

        // // Affichage des données générées (facultatif)
        // console.log('Adresses:', adresses);
        // console.log('Établissements:', establishments);
        // console.log('Utilisateurs:', users);
        // console.log('Rendez-vous:', appointments);
        // console.log('Notes:',notes)
        // console.log('end')

    }catch(e){
        console.error(e)
    }
}
main()