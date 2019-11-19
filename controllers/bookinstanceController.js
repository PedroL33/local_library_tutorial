var BookInstance = require('../models/bookinstance');
var Book = require('../models/book')
const { body,validationResult } = require('express-validator/check');
const { sanitizeBody } = require('express-validator/filter');

var async = require('async');

// Display list of all BookInstances.
exports.bookinstance_list = function(req, res, next) {
    BookInstance.find()
      .populate('book')
      .exec(function (err, list_bookinstances) {
          if(err) { return next(err); }
          res.render('bookinstance_list', { title: 'Book Instance List', bookinstance_list : list_bookinstances});
      });
};

// Display detail page for a specific BookInstance.
exports.bookinstance_detail = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, bookinstance) {
      if(err) { return next(err) };
      if (BookInstance == null) {
        var err = new Error('Book copy not found')
        err.status = 404;
        return next(err);
      }
      res.render('bookinstance_detail', { title: 'Copy: ' + bookinstance.book.title, bookinstance: bookinstance});
    })
};

// Display BookInstance create form on GET.
exports.bookinstance_create_get = function(req, res, next) {
    Book.find({}, 'title')
    .exec(function (err, books) {
        if(err) { return next(err); }
        res.render('bookinstance_form', {title: 'Create BookInstance', book_list: books});
    });
};

// Handle BookInstance create on POST.
exports.bookinstance_create_post = [
    body('book', 'Book must be specified').isLength({ min:1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min:1 }).trim(),
    body('due_back', 'Due back date must be specified').isLength({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('due_back').toDate(),
    sanitizeBody('status').trim().escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookinstance = new BookInstance( 
            { book: req.body.book,
              imprint: req.body.imprint,
              status: req.body.status, 
              due_back: req.body.due_back
            });
        
        if(!errors.isEmpty()) {
            Book.find({}, 'title')
              .exec(function(err, books) {
                  if(err) {return next(err) }
                  res.render('bookinstance_form', { title: 'Create BookInstance', book_list: books, selected_book: bookinstance._id, errors: errors.array(), bookinstace: bookinstance});
              });
              return;
            }
        else {
            bookinstance.save(function(err) {
                if (err) { return next(err) }
                    res.redirect(bookinstance.url);
            });
        }
    }        
];

// Display BookInstance delete form on GET.
exports.bookinstance_delete_get = function(req, res, next) {
    BookInstance.findById(req.params.id)
    .populate('book')
    .exec(function(err, results) {
        if(err) { return next(err); }
        if(results==null) {
            res.redirect('/catalog/bookinstances');
        }
        res.render('bookinstance_delete', { title: 'Delete Book Instance', bookinstance: results });
    })
};

// Handle BookInstance delete on POST.
exports.bookinstance_delete_post = function(req, res, next) {
    BookInstance.findByIdAndRemove(req.body.bookinstance_id, function(err) {
        if(err) { return next(err); }
        res.redirect('/catalog/bookinstances')
    })
};

// Display BookInstance update form on GET.
exports.bookinstance_update_get = function(req, res, next) {
    async.parallel({
        bookinstance: function(callback) {
            BookInstance.findById(req.params.id).exec(callback)
        },
        book_list: function(callback) {
            Book.find().exec(callback)
        },
    }, function(err, results) {
        if(err) { return next(err); }
        res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: results.bookinstance, book_list: results.book_list})
    })
};

// Handle bookinstance update on POST.
exports.bookinstance_update_post = [
    body('book', 'Book must be specified').isLength({ min:1 }).trim(),
    body('imprint', 'Imprint must be specified').isLength({ min:1 }).trim(),
    body('due_back', 'Due back date must be specified').isLength({ checkFalsy: true }).isISO8601(),

    sanitizeBody('book').escape(),
    sanitizeBody('imprint').escape(),
    sanitizeBody('due_back').toDate(),
    sanitizeBody('status').trim().escape(),

    (req, res, next) => {
        const errors = validationResult(req);

        var bookInstance = new BookInstance( 
            {
                book: req.body.book,
                imprint: req.body.imprint, 
                status: req.body.status,
                due_back: req.body.due_back,
                _id: req.params.id
            });
        
        if(!errors.isEmpty()) { 
            Book.find()
            .exec(function(err, results) {
                if(err) { return next(err); }
                res.render('bookinstance_form', {title: 'Update Book Instance', bookinstance: bookInstance, book_list: results})
            })
            return;
        }
        else {
            BookInstance.findByIdAndUpdate(req.params.id, bookInstance, {}, function (err,thebookinstance) {
                if(err) { return next(err); }
                res.redirect(bookInstance.url);
            });
        }
    }
];