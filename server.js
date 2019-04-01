'use strict';

const express = require('express');
require('express-async-errors');

const app = express();
const bodyParser = require('body-parser');
const formidable = require('express-formidable');


app.use(async function (req, res, next) {
  console.log('HERE', req.url); next();
});


// ------ MIDDLEWARES
app.use(express.static('./'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
// ------

const router = express.Router();


// GET /aj/long_request
router.get('/long_request', function (req, res) {
  setTimeout(function() {
    console.log('END TIMEOUT');
    res.send({
      ok: true,
      data: 'long_request'
    });
  }, 20000);
});


// POST  /aj/long_request
router.post('/long_request', function (req, res) {
  setTimeout(function() {
    console.log('END TIMEOUT');
    res.send({
      ok: true,
      data: 'long_request'
    });
  }, 20000);
});



router.get('/:user_id', function (req, res) {
  console.log('GET');
  res.send({
    ok: true,
    data: [1,2,3]
  });
});

router.post('/:user_id', function (req, res) {
  console.log('POST req.body=', req.body);
  res.send({
    ok: true,
    data: 'POST'
  });
});

router.put('/:user_id', function (req, res) {
  console.log('PUT req.body=', req.body);
  res.send({
    ok: true,
    data: 'PUT'
  });
});


router.delete('/:user_id', function (req, res) {
  console.log('DELETE req.body=', req.body);
  res.send({
    ok: true,
    data: 'DELETE'
  });
});


router.post('/users/:user_id', function (req, res) {
  console.log('POST req.body=', req.body);
  res.send({
    ok: true,
    data: 'urlencode'
  });
});


router.post('/upload/:user_id', formidable(), function (req, res) {
  console.log('POST upload req.body=', req.fields, req.files);
  res.send({
    ok: true,
    data: 'form-data'
  });
});

app.use('/aj', router);



// TODO: refactor
app.all('*', function(req, res) {
  if (/\/api\//.test(req.url)) {
    res.status(404).send('Не найден url '+req.url);
  } else {
    res.status(404).send('404 Not found');
  }
});

// ===============================================
// TODO: add logger
app.use(async function(err, req, res, next) {
  console.error('HANDLE ERROR=', err);
  if (/\/api\//.test(req.url)) {
    res.status(500).send('500 Internal error');
  } else {
    res.status(500).send('500 Internal error');
  }
  next();
});

app.listen(4002, function() {
  console.log('Example app listening on port 4002!');
});
