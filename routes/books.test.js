process.env.NODE_ENV = 'test';
const request = require('supertest');
const app = require('../app');
const db = require('../db');


// sample isbn holder
let temp_isbn; 


// Test Data
beforeEach(async ()=>{
    let result = await db.query(
        `INSERT INTO books
        (isbn, amazon_url,author,language,pages,publisher,title,year)
        VALUES(
            '123432122', 
            'https://amazon.com/anime', 
            'Kenny',
            'English', 
            100, 
            'LOL''s Printing', 
            'my first book', 
            2019)
        RETURNING isbn`);
   
    temp_isbn = result.rows[0].isbn;
});

describe('GET /books', async function(){
    test('It should get a list that has only one book in it.', async function(){
        const response = await request(app).get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty('publisher');
        expect(books[0]).toHaveProperty('amazon_url');

    });
});

describe('POST /books', async function(){
    test('It should create a new book.', async function(){
        const response = await request(app)
            .post(`/books`)
            .send({
                isbn: '121212123',
                amazon_url: "https://anime.com",
                author: "testname",
                language: "english",
                pages: 1,
                publisher: "testpublisher",
                title: "testitle",
                year: 1500
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.newBook).toHaveProperty('isbn');
    });
    test('It should not create a new book with missing title.', async function(){
        const response = await request(app).post('/books').send({year: 1999});
        expect(response.statusCode).toBe(400);
    });
});

describe('GET /books/:isbn', async function(){
    test('It should get a single book.', async function(){
        const response = await request(app).get(`/books/${temp_isbn}`);
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.isbn).toBe(temp_isbn);
    });
    test('It should get 404 for invalid single book.', async function(){
        const response = await request(app).get(`/books/asdsada`);
        expect(response.statusCode).toBe(404);
    });
});

describe('PUT /books/:isbn', async function(){
    test('It should update a single book', async function(){
        const response = await request(app)
            .put(`/books/${temp_isbn}`)
            .send({
                amazon_url: "https://anime.com",
                author: "testname",
                language: "english",
                pages: 1,
                publisher: "testpublisher",
                title: "UPDATED",
                year: 1500
            });
        expect(response.body.book).toHaveProperty('isbn');
        expect(response.body.book.title).toBe('UPDATED');
    });
    test('It should prevent bad book updates.', async function(){
        const response = await request(app)
            .put(`/books/${temp_isbn}`)
            .send({
                amazon_url: "https://anime.com",
                bad_field: 'I am bad data',
                author: "testname",
                language: "english",
                pages: 1,
                publisher: "testpublisher",
                title: "UPDATED",
                year: 1500
            });
        expect(response.statusCode).toBe(400);
    });
});

describe('DELETE /books/:isbn', async ()=>{
    test('It should delete a single book', async ()=>{
        const response = await request(app).delete(`/books/${temp_isbn}`);
        expect(response.body).toEqual({message: "Book deleted"});
    });
});

afterEach(async ()=>{
    await db.query('DELETE FROM books');
});

afterAll(async ()=>{
    await db.end();
});