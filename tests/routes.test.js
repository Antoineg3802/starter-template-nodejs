const request = require('supertest');
const app = require('../app'); // Assurez-vous d'importer correctement votre application Express

const testUserData = {
    firstname: 'John',
    lastname: 'Doe',
    email: 'john.doe@example.com',
    password: 'password123',
    phone: '1234567890',    
};

let authToken = '';

describe('GET /users', () => {
    it('responds with JSON containing all users', async () => {
        const response = await request(app).get('/users');
        if (response.status === 200) {
            expect(response.status).toBe(200);
            expect(response.body).toBeDefined();
        } else if (response.status === 304) {
            expect(response.status).toBe(304);
            expect(response.body).toBeDefined();
        } else {
            throw new Error('Invalid status code');
        }
    });
});

describe('POST /users/register', () => {
    it('responds with JSON containing authentication token for valid registration data', async () => {
        const response = await request(app)
            .post('/users/register')
            .send(testUserData);

        expect(response.status).toBe(201);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('token');
        expect(response.body).toHaveProperty('maxAge', 259560000);

        authToken = response.body.token;
    });

    it('responds with JSON when error is containing', async () => {
        const response = await request(app)
            .post('/users/register')
            .send(testUserData);

        expect(response.status).toBe(409);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('error');
        expect(response.body).toHaveProperty('message');

        authToken = response.body.token;
    });

    it('responds with 400 for invalid registration data', async () => {
        const invalidUserData = {
            firstname: 'John',
            lastname: 'Doe',
            // Missing email, password or phone
        };

        const response = await request(app)
            .post('/users/register')
            .send(invalidUserData);

        expect(response.status).toBe(400);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('error', true);
        expect(response.body).toHaveProperty('message', 'Invalid parameters');
    });
});

describe('POST Login', () => {
    // Test d'authentification
    it('authenticates user and gets JWT token', async () => {
        const userData = {
            email: testUserData.email,
            password: testUserData.password
        };

        const response = await request(app)
            .post('/users/login')
            .send(userData);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        expect(response.body).toHaveProperty('token');

        authToken = response.body.token;
    });

});

describe('GET /users/currentUser', () => {
    it('responds with JSON containing current user data', async () => {
        const response = await request(app)
            .get('/users/currentUser')
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        // Ajoutez d'autres assertions pour vérifier les propriétés de la réponse si nécessaire
    });
    it('respond whitout token', async () => {
        const response = await request(app)
            .get('/users/currentUser');

        expect(response.status).toBe(401);
        expect(response.body).toBeDefined();
    });
});


describe('GET /users/one/:id', () => {
    it('responds with JSON containing a specific user data', async () => {
        const userId = 35; // Remplacez par un ID d'utilisateur valide
        const response = await request(app)
            .get(`/users/one/${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(200);
        expect(response.body).toBeDefined();
        // Ajoutez d'autres assertions pour vérifier les propriétés de la réponse si nécessaire
    });
    it('reponds not found user', async () => {  
        const userId = 10000;
        const response = await request(app)
            .get(`/users/one/${userId}`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
    });
});

describe('DELETE /users/delete/:userId', () => {
    it('deletes a specific user and responds with JSON', async () => {

        const response = await request(app)
            .delete(`/users/`)
            .set('Authorization', `Bearer ${authToken}`);

        expect(response.status).toBe(202);
        expect(response.body).toBeDefined();
        // Ajoutez d'autres assertions pour vérifier les propriétés de la réponse si nécessaire
    });

    it('deletes a specific user and responds with JSON', async () => {

        const response = await request(app)
            .delete(`/users/`)
            .set('Authorization', `Bearer ${authToken}`);
            console.log(authToken, 'le token deleted')

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
        // Ajoutez d'autres assertions pour vérifier les propriétés de la réponse si nécessaire
    });

    it('cannot delete if user doesn\'t set bearer jwt token', async () => {

        const response = await request(app)
            .delete(`/users/`)

        expect(response.status).toBe(400);
        expect(response.body).toBeDefined();
    });

    it('respond user not found',  () => {
        console.log(authToken, 'le token nofound');
        const response =  request(app)
            .get('/users/currentUser')
            .set('Authorization', `Bearer ${authToken}`);
    

        expect(response.status).toBe(404);
        expect(response.body).toBeDefined();
    });
});