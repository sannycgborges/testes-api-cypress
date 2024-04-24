import { faker } from '@faker-js/faker';

describe('Atividade 4 - Testes de API com Cypress', () => {
  
  const fullName = faker.person.fullName();
  const email = faker.internet.email();
  const password = "password";
  var _token = "";
  var movie = {
    "title": faker.music.songName(),
    "genre": faker.music.genre(),
    "description": "Mussum Ipsum, cacilds vidis litro abertis. Paisis, filhis, espiritis santis.",
    "durationInMinutes": 120,
    "releaseYear": 2010
  };

   before(() => {
    cy.request('POST', 'users', {
      "name": fullName,
      "email": email,
      "password": password
    }).then(() => {
      cy.request('POST', 'auth/login', {
        "email" : email,
        "password" : password
      }).then((response) => {
        _token = response.body.accessToken;
      })
    })
   })

   describe('O recurso /movies apresenta cenários de teste relacionados à criação e atualização de filmes', () => {
    it('Deve promover um usuário a ADMIN', () => {
      cy.request({
        method: 'PATCH', 
        url: 'users/admin',
        headers: {
          Authorization : 'Bearer '+_token
        }
      }).then((response) => {
        expect(response.status).to.eq(204);
      })
    });

    it('Deve receber bad request ao tentar criar um filme', () => {
      cy.request({
        method: 'POST', 
        url: 'movies',
        body: {
          "title": null,
          "genre": null,
          "description": "Mussum Ipsum, cacilds vidis litro abertis. Paisis, filhis, espiritis santis.",
          "durationInMinutes": 120,
          "releaseYear": 2010
        },
        headers: {
          Authorization : 'Bearer '+_token
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
      })
    });

    it('Deve ser possível criar um filme com sucesso', () => {
      cy.request({
        method: 'POST', 
        url: 'movies',
        body: movie,
        headers: {
          Authorization : 'Bearer '+_token
        }
      }).then((response) => {
        expect(response.status).to.eq(201);
      })
    });

    it('Deve ser possível procurar por um filme pelo título', () => {
      cy.request({
        method: 'GET',
        url: 'movies/search?title='+movie.title,
      }).then((response) => {
        expect(response.status).to.eq(200);
        response.body.filter((item) => {
          if (movie.title == item.title && item.genre == movie.genre && item.description == movie.description) {
            movie = item
          }
        });
        expect(movie.durationInMinutes).to.deep.eq(120);
        expect(movie.totalRating).to.deep.eq(null);
      });
    });

    it('Deve receber um not found ao tentar atualizar um filme por ID', () => {
      cy.request({
        method: 'PUT',
        url: 'movies/'+movie.id,
        headers: {
          Authorization: 'Bearer '+_token
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.body.statusCode).to.eq(404);
        expect(response.body.error).to.eq('Not Found');
        expect(response.body.message).to.eq('Movie not found');
      })
    });

    it('Deve receber um bad request ao tentar atualizar um filme por ID', () => {
      cy.request({
        method: 'PUT',
        url: 'movies/123abcd',
        body: movie,
        headers:{
          Authorization: 'Bearer '+_token
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.body.statusCode).to.eq(400);
        expect(response.body.error).to.eq('Bad Request');
      })
    });

    it('Deve ser possível atualizar um filme por ID com sucesso', () => {
      movie.title = faker.music.songName();
      movie.genre = faker.music.genre();
      movie.description = 'Lorem Ipsum is simply dummy text of the printing and typesetting industry.';
      movie.durationInMinutes = 145;
      movie.releaseYear = 1991;
  
      cy.request({
        method: 'PUT',
        url:'movies/'+movie.id,
        body: movie,
        headers: {
          Authorization : 'Bearer '+_token
        }
      }).then((response) => {
        expect(response.status).to.eq(204);
      })
    });

   });

   describe('O recurso /users, apresenta cenários de teste relacionados à criação de uma review e a consulta de reviews feitas por usuário', () => {
    it('Deve receber um bad request ao tentar criar a review de um filme', () =>{
      cy.request({
        method: 'POST',
        url: 'users/review',
        body: {
          "movieId": '1234abcd',
          "score": 5,
          "reviewText": "xxxx",
        },
        headers: {
          Authorization : 'Bearer '+_token
        },
        failOnStatusCode: false
      }).then((response) => {
        expect(response.status).to.eq(400);
      })
    });
  
    it('Deve receber sucesso ao criar a review de um filme', () => {
      cy.request({
        method: 'POST',
        url:'users/review',
        body: {
          "movieId": movie.id,
          "score": 5,
          "reviewText": "Imagina um texto lindo de review."
        },
        headers: {
          Authorization : 'Bearer '+_token
        },
      }).then((response) => {
        expect(response.status).to.eq(201);
      })
    });
  
    it('Deve listar as reviews criadas pelo usuário', () => {
      cy.request({
        method: 'GET',
        url:'users/review/all',
        headers: {
          Authorization : 'Bearer '+_token
        },
      }).then((response) => {
        expect(response.status).to.eq(200);
      })
    });
   });

});