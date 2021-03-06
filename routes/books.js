const express = require("express");
const Book = require("../models/book");
const jsonschema = require('jsonschema');
const bookSchema = require('../schemas/bookSchema.json');
const updateBookSchema = require ('../schemas/bookUpdateSchema.json');
const { json } = require("express");
const ExpressError = require("../expressError");

const router = new express.Router();


/** GET / => {books: [book, ...]}  */

router.get("/", async function (req, res, next) {
  try {
    const books = await Book.findAll(req.query);
    return res.json({ books });
  } catch (err) {
    return next(err);
  }
});

/** GET /[id]  => {book: book} */

router.get("/:id", async function (req, res, next) {
  try {
    const book = await Book.findOne(req.params.id);
    return res.json({ book });
  } catch (err) {
    return next(err);
  }
});

/** POST /   bookData => {book: newBook}  */

router.post("/", async function (req, res, next) {
  try {
    // Check if book fits schema requirements.
    const result = jsonschema.validate(req.body, bookSchema);
  
    // Check if schema failed 
    if (!result.valid){
      return next({
        status: 400,
        error: result.errors.map(e => e.stack)
      })
    }

    // Create the new book. 
    const newBook = await Book.create(req.body);
    return res.status(201).json({ newBook });
  } catch (err) {
    return next(err);
  }
});

/** PUT /[isbn]   bookData => {book: updatedBook}  */

router.put("/:isbn", async function (req, res, next) {
  try {
    
    // Isbn in request body not allowed.
    if ('isbn' in req.body){
      throw new ExpressError('ISBN in body not allowed.', 400);
    }

    // Check schema.
    const result =  jsonschema.validate(req.body, updateBookSchema);
    if (!result.valid){
      return next({
        status: 400,
        errors: result.errors.map(e => e.stack)
      })
    }

    // Book update is legit. 
    const book = await Book.update(req.params.isbn, req.body);
    return res.json({ book });

  } catch (err) {
    return next(err);
  }
});

/** DELETE /[isbn]   => {message: "Book deleted"} */

router.delete("/:isbn", async function (req, res, next) {
  try {
    await Book.remove(req.params.isbn);
    return res.json({ message: "Book deleted" });
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
