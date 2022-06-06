const supertest = require('supertest');
const mongoose = require('mongoose');
const path = require('path');
const jwt = require('jsonwebtoken');
const { app, server } = require('../server');
const userModel = require('../models/users.model');
const requestModel = require('../models/requests.model');

/**
 * Login
   * Informacion valida
   * Informacion invalida (usuario no existe)
   * Informacion invalida (contraseña incorrecta)
 * Registro
   * Informacion completa
   * Informacion incompleta
 * Informacion de Usuario
   * Contraseña y fecha de cumpleaños no incluida en el response
   * Numero de publicaciones del usuario refleja el numero correcto
   * Numero de publicaciones que le gustan al usuario refleja el numero correcto
   * Numero de seguidores refleja el numero correcto
   * Numero de seguidos refleja el numero correcto
 */

require('dotenv').config({ path: path.resolve(__dirname, '../database/.env') });

const api = supertest(app);

const TEST_TOKEN = process.env.TEST_TOKEN; 
const TEST_TOKEN2 = process.env.TEST_TOKEN2; 
const USER_ID = "629804e0a09e3be16918b548";
const USER2_ID = "62995b2b98a694ecb156281f";
const REQUEST_ID = "62996a1e9326cf28025ef620";

const validateToken = accessToken => {
    return jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET);
}

describe('users/ route', () => {
    test('Login con username y password válido', async () => {
        const loginData = {
            username: "esaconn",
            password: "admin1234"
        }
        const response = await api.post(`/users/login`).type('form').send(loginData);
        expect(response.statusCode).toBe(200);
        const decoded = validateToken(response.body.token);
        expect(decoded.name).toBe(loginData.username);
    });
    
    test('Informacion inválida (usuario no existe)', async () => {
        const loginData = {
            username: "esa",
            password: "admin1234"
        }
        const response = await api.post(`/users/login`).type('form').send(loginData);
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Invalid user or password.");
    });

        test('Informacion inválida (contraseña incorrecta)', async () => {
        const loginData = {
            username: "esaconn",
            password: "as"
        }
        const response = await api.post(`/users/login`).type('form').send(loginData);
        expect(response.statusCode).toBe(401);
        expect(response.body.error).toBe("Invalid user or password.");
    });
    
    test('Login con token válido', async () => {
        const response = await api.post(`/users/login`).type('form').send({token: TEST_TOKEN});
        expect(response.statusCode).toBe(200);
        expect(response.body).toStrictEqual({});
    });

    test('Registro información completa', async () => {
        const registerData = {
            username: "esaconnf",
            password: "admin1234",
            email: "prueba@gmail.com",
            birthdate: "28/12/2000",
            bio: "Not too young"
        }
        await userModel.findOneAndDelete({username: registerData.username});
        const response = await api.post(`/users`).type('form').send(registerData);
        expect(response.statusCode).toBe(201);
        const decoded = validateToken(response.body.token);
        expect(decoded.name).toBe(registerData.username);
    });
    
    test('No registro información incompleta', async () => {
        const registerData = {
            username: "esaconnf",
            password: "admin1234",
            email: "prueba@gmail.com",
            bio: "Not too young"
        }
        await userModel.findOneAndDelete({username: registerData.username});
        const response = await api.post(`/users`).type('form').send(registerData);
        expect(response.statusCode).toBe(500);
        expect(response.body.error).toBe('Información incompleta.');
    });
    
    test('Informacion de Usuario', async () => {
        const unexpectedData = ['password', 'birthdate'];
        const userResponse = await api.get(`/users?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(userResponse.statusCode).toBe(200);
        expect(Object.keys(userResponse.body)).not.toContain(unexpectedData);

        const followers = await api.get(`/follows/followers?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(userResponse.followers_count).toBe(followers.length);

        const following = await api.get(`/follows/following?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(userResponse.followed_count).toBe(following.length);

        const post = await api.get(`/follows/following?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(userResponse.posts_count).toBe(post.length);

        const liked = await api.get(`/posts/liked-by?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(userResponse.liked_count).toBe(liked.length);
    });
});

////////////////////////////////////////////////////////////////////

/**
 * Lista de seguidores de un usuario
 * Lista de seguidos de un usuario
 * Solicitar seguir
 * Aceptar solicitud
 * Aceptar solicitud previamente aceptada o rechazada
 * Rechazar solicitud
 * Rechazar solicitud previamente aceptada o rechazada
 */

describe('follows/followers route', () => {
    test('Dennied access without token', async () => { 
        const response = await api.get(`/follows/followers?user_id=${USER_ID}`);
        expect(response.statusCode).toBe(401);        
        expect(response.body.error).toBe('No token provided in header.');
    });
    
    test('Dennied access for invalid token', async () => { 
        const response = await api.get(`/follows/followers?user_id=${USER_ID}`).set('token', USER_ID);
        expect(response.statusCode).toBe(403);        
        expect(response.body.error).toBe('Token is invalid or has expired.');
    });

    test('User not found for empty user_id', async () => { 
        const response = await api.get(`/follows/followers`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(404);        
        expect(response.body.error).toBe('User not found.');
    });

    test('User not found for invalid user_id', async () => { 
        const response = await api.get('/follows/followers?user_id=FFFFFFFFFFF').set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(404);        
        expect(response.body.error).toBe('User not found.');
    });

    test('Allow access for valid token', async () => { 
        const response = await api.get(`/follows/followers?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(200);        
    });
    
    test('Lista de seguidores de un usuario', async () => {  
        const response = await api.get(`/follows/followers?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(200);   
        expect(response.body).toBeInstanceOf(Array)
    });
});

describe('follows/following route', () => {
    test('Dennied access without token', async () => { 
        const response = await api.get(`/follows/following?user_id=${USER_ID}`);
        expect(response.statusCode).toBe(401);        
        expect(response.body.error).toBe('No token provided in header.');
    });
    
    test('Dennied access for invalid token', async () => { 
        const response = await api.get(`/follows/following?user_id=${USER_ID}`).set('token', USER_ID);
        expect(response.statusCode).toBe(403);        
        expect(response.body.error).toBe('Token is invalid or has expired.');
    });

    test('User not found for empty user_id', async () => { 
        const response = await api.get(`/follows/following`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(404);        
        expect(response.body.error).toBe('User not found.');
    });

    test('User not found for invalid user_id', async () => { 
        const response = await api.get('/follows/following?user_id=FFFFFFFFFFF').set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(404);        
        expect(response.body.error).toBe('User not found.');
    });

    test('Allow access for valid token', async () => { 
        const response = await api.get(`/follows/following?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(200);        
    });
    
    test('Lista de seguidos de un usuario', async () => {  
        const response = await api.get(`/follows/following?user_id=${USER_ID}`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(200);   
        expect(response.body).toBeInstanceOf(Array)
    });
});

describe('follows/request route', () => {
    test('Dennied access without token', async () => { 
        const response = await api.post(`/follows/request`).type('form').send({user_id: USER2_ID});
        expect(response.statusCode).toBe(401);        
        expect(response.body.error).toBe('No token provided in header.');
    });
    
    test('Dennied access for invalid token', async () => { 
        const response = await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', USER_ID);
        expect(response.statusCode).toBe(403);        
        expect(response.body.error).toBe('Token is invalid or has expired.');
    });

    test('User not found for empty user_id', async () => { 
        const response = await api.post(`/follows/request`).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(404);        
        expect(response.body.error).toBe('Not user to follow.');
    });

    test('User not found for invalid user_id', async () => { 
        const response = await api.post('/follows/request').type('form').send({user_id: "FFFFFFFFFFF"}).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(500);        
        expect(response.body.error).toBe('Invalid user_id.');
    });

    test('Not to follow itself', async () => { 
        const response = await api.post(`/follows/request`).type('form').send({user_id: USER_ID}).set('token', TEST_TOKEN);
        expect(response.statusCode).toBe(500);        
        expect(response.body.error).toBe('An user cannot follow itself.');
    });
    
    test('Solicitar seguir', async () => {  
        await requestModel.findOneAndDelete({requester: USER_ID, requested: USER2_ID});
        const response = await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', TEST_TOKEN);
        console.log(response.body)
        expect(response.statusCode).toBe(200);   
        expect(response.body).toStrictEqual({});
    });
});

describe('follows/response route', () => {
    test('Dennied access without token', async () => { 
        const response = await api.post(`/follows/response`).type('form').send({request_id: REQUEST_ID, action: "accept"});
        expect(response.statusCode).toBe(401);        
        expect(response.body.error).toBe('No token provided in header.');
    });
    
    test('Dennied access for invalid token', async () => { 
        const response = await api.post(`/follows/response`).type('form').send({request_id: REQUEST_ID, action: "accept"}).set('token', USER_ID);
        expect(response.statusCode).toBe(403);        
        expect(response.body.error).toBe('Token is invalid or has expired.');
    });

    test('Missing request_id and/or action', async () => { 
        const response = await api.post(`/follows/response`).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(400);        
        expect(response.body.error).toBe('Invalid request_id or action.');
    });

    test('Invalid request_id', async () => { 
        const response = await api.post('/follows/response').type('form').send({request_id: "FFFFFFFFFFF", action: "accept"}).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(400);        
        expect(response.body.error).toBe('Invalid request_id or action.');
    });
    
    test('Aceptar solicitud', async () => {  
        await requestModel.findOneAndDelete({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', TEST_TOKEN);
        const req = await requestModel.findOne({requester: USER_ID, requested: USER2_ID});
        const response = await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "accept"}).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(200);   
        expect(response.body).toStrictEqual({});
    });
    
    test('Rechazar solicitud', async () => {  
        await requestModel.findOneAndDelete({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', TEST_TOKEN);
        const req = await requestModel.findOne({requester: USER_ID, requested: USER2_ID});
        const response = await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "reject"}).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(200);   
        expect(response.body).toStrictEqual({});
    });

    test('Aceptar solicitud previamente aceptada o rechazada', async () => { 
        await requestModel.findOneAndDelete({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', TEST_TOKEN);
        const req = await requestModel.findOne({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "reject"}).set('token', TEST_TOKEN2);
        const response = await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "accept"}).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(400);        
        expect(response.body.error).toBe('The user has already rejected the follow request.');
    });

    test('Rechazar solicitud previamente aceptada o rechazada', async () => { 
        await requestModel.findOneAndDelete({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/request`).type('form').send({user_id: USER2_ID}).set('token', TEST_TOKEN);
        const req = await requestModel.findOne({requester: USER_ID, requested: USER2_ID});
        await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "accept"}).set('token', TEST_TOKEN2);
        const response = await api.post(`/follows/response`).type('form').send({request_id: String(req._id), action: "reject"}).set('token', TEST_TOKEN2);
        expect(response.statusCode).toBe(400);        
        expect(response.body.error).toBe('The user has already accepted the follow request.');
    });
});

///////////////////////////////////////////////////////////////////////////////////

afterAll(async () => {
    server.close();
    await mongoose.connection.close();
});