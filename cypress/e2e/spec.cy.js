import { faker } from '@faker-js/faker';

const fullName = faker.person.fullName();
const email = faker.internet.email();
const password = '123456789';
let userId;
let accessToken;
let movie;

describe('Cadastro de usuário', () => {

  it('Deve receber bad request ao tentar cadastrar um usuário sem nome', () => {
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
    });
  });

  it('Deve receber bad request ao tentar cadastrar um usuário com e-mail inválido', () => {
    cy.request({
      method: 'POST', 
      url: 'users', 
      body: {
      "name": fullName,
      "email": 'email.com',
      "password": password
    },
    failOnStatusCode: false
  }).then((response) => {
      expect(response.status).to.eq(400);
    });
  });

  it('Deve ser possível cadastrar o usuário com dados corretos', () => {
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

  it('Não deve ser possível cadastrar o usuário com e-mail já utilizado', () => {
    cy.request({
      method: 'POST', 
      url: 'users', 
      body: {
      "name": fullName,
      "email": email,
      "password": password
    },
    failOnStatusCode: false
  }).then((response) => {
      expect(response.status).to.eq(409);
      expect(response.body.message).to.eq('Email already in use');
      expect(response.body.error).to.eq('Conflict');
    });
  });

});

describe('Autenticação', () => {
  it('Deve receber bad request ao tentar autenticar um usuário sem senha', () => {
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

  it('Deve receber unauthorized ao tentar autenticar um usuário com senha invalida', () => {
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

  it('Deve ser possível autenticar o usuário com dados corretos', () => {
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
  it('Deve receber unauthorized ao tentar consultar um usuário sem access token', () => {
    cy.request({
      method: 'GET', 
      url: 'users/'+userId,
      failOnStatusCode: false
    }).then((response) => {
      expect(response.status).to.eq(401);
      expect(response.body.error).to.eq("Unauthorized");
    });
  });

  it('Deve receber forbidden ao consultar usuário com ID invalido', () => {
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

  it('Deve ser possível buscar os dados do usuário', () => {
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
  it('Deve ser possível buscar a lista de filmes', () => {
    cy.request({
      method: 'GET',
      url: 'movies?sort=true',
    }).then((response) => {
      expect(response.status).to.eq(200);
      response.body.filter((item) => {
        if(item.totalRating != null) {
          movie = item
          return movie
        }
      });
      expect(movie.totalRating).to.not.equal(null);
    });
  });

  it('Deve ser possível buscar o filme por ID', () => {
    cy.request({
      method: 'GET', 
      url: 'movies/'+movie.id
    }).then((response) => {
      expect(response.status).to.eq(200);
      expect(response.body.title).to.eq(movie.title);
      expect(response.body.genre).to.eq(movie.genre);
      expect(response.body.reviews).to.not.equal(null);
      expect(response.body.reviews[0].score).to.not.equal(null);
      expect(response.body.reviews[0].score).to.be.within(0, 5);
    });
  });

  it('Deve ser possível buscar o filme por título', () => {
    cy.request({
      method: 'GET', 
      url: 'movies/search?title='+movie.title
    }).then((response) => {
      expect(response.status).to.eq(200);
    });
  });
});