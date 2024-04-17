import { faker } from '@faker-js/faker';

const fullName = faker.person.fullName();
const email = faker.internet.email();
const password = '123456789';
let userId;
let accessToken;
let movie;

describe('Cadastro de usuário', () => {

  it('Bad Request - Usuário sem nome informado', () => {
    cy.request({
      method: 'POST', 
      url: 'users', 
      body: {
      "email": email,
      "password": password
    },
    failOnStatusCode: false
  }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('Bad Request');
    });
  });

  it('Sucesso - Cadastrado', () => {
    cy.request('POST', 'users', {
      "name": fullName,
      "email": email,
      "password": password
    }).then((response) => {
      expect(response.status).to.eq(201);
      expect(response.body.name).to.eq(fullName);
      expect(response.body.email).to.eq(email);
      userId = response.body.id;
    });
  });

});

describe('Autenticação', () => {
  it('Bad Request - Usuário sem senha informada', () => {
    cy.request({
      method:'POST', 
      url:'auth/login', 
      body: {
        "email": email
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(400);
      expect(response.body.error).to.eq('Bad Request');
    });
  });

  it('Unauthorized - Usuário com email ou senha invalida', () => {
    cy.request({
      method:'POST', 
      url:'auth/login', 
      body: {
        "email": email,
        "password": '123456'
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.eq("Unauthorized");
      expect(response.body.message).to.eq("Invalid username or password.");
    });
  });

  it('Sucesso - Login', () => {
    cy.request('POST', 'auth/login', {
      "email": email,
      "password": password
    }).then((response) => {
      expect(response.status).to.eq(200);
      accessToken = response.body.accessToken;
    });
  });
});

describe('Consulta de usuário', () => {

  it('Unauthorized - Access token não informado', () => {
    cy.request({
      method: 'GET', 
      url: 'users/'+userId,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.eq("Unauthorized");
      cy.log(JSON.stringify(response.body));
    });
  });

  it('Forbidden - ID invalido', () => {
    cy.request({
      method: 'GET', 
      url: 'users/-1',
      headers: {
        Authorization : 'Bearer '+accessToken
      },
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(403);
      expect(response.statusText).to.eq("Forbidden");
    });
  });

  it('Sucesso - Buscar dados usuário', () => {
    cy.request({
      method: 'GET', 
      url: 'users/'+userId,
      headers: {
        Authorization : 'Bearer '+accessToken
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.id).to.eq(userId);
      expect(response.body.name).to.eq(fullName);
      expect(response.body.email).to.eq(email);
      expect(response.body.active).to.eq(true);
    });
  });
});

describe('Filmes', () => {
  it('Sucesso - Lista de filmes', () => {
    cy.request({
      method: 'GET',
      url: 'movies',
      headers : {
        Authorization : 'Bearer '+accessToken
      }
    }).then((response) => {
      expect(response.status).to.eq(200);
      const size = Object.keys(response.body).length;
      const index = Math.floor(Math.random() * size) + 1;
      movie = response.body[index];
    });
  });

  it('Sucesso - Busca de filme por ID', () => {
    cy.request({
      method: 'GET', 
      url: 'movies/'+movie.id
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.title).to.eq(movie.title);
      expect(response.body.genre).to.eq(movie.genre);
    });
  });

  it('Sucesso - Busca de filme por título', () => {
    cy.request({
      method: 'GET', 
      url: 'movies/search?title='+movie.title
    }).then((response) => {
      cy.log(JSON.stringify(response));
      expect(response.status).to.eq(200);
    });
  });
});