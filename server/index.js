'use strict';

const express = require('express');
const moment  = require('moment');
const db      = require('./db');

const PORT      = process.env.PORT || 4000;
const DATA_HOST = 'http://aurelienjp.cluster010.ovh.net/data/blog';

setupAndStart();

const app = express();
app.set('json spaces', 2);

// -----------------------------------------------------------------------------
// LOGS
// -----------------------------------------------------------------------------

app.use((req, res, next) => {
  const date = moment.utc().format('YYYY/MM/DD HH:mm:ss');
  console.log(`${date} [${req.ip}] ${req.method} ${req.originalUrl}`);
  return next();
});

// -----------------------------------------------------------------------------
// REWRITE RULES
// -----------------------------------------------------------------------------

app.all('/post/:postId', (req, res, next) => {
  req.url = '/post.html';
  return next();
});

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

app.get('/api/getpostmetas/:offset/:limit', async (req, res) => {
  const offset = Math.max(Number(req.params.offset) || 0, 0);
  const limit  = Math.max(Number(req.params.limit)  || 1, 1);
  const posts  = await db.getPostMetas(offset, limit);
  return res.json(posts);
});

app.get('/api/getpost/:postId', async (req, res) => {
  const postId = req.params.postId;
  const post   = await db.getPost(postId);

  if (!post) {
    return res.status(404).end('Post not found');
  }

  const result  = await db.getNextAndPreviousPosts(post.date);
  post.previous = result.previous;
  post.next     = result.next;
  return res.json(post);
});

app.get('/data/thumbnail/:id', (req, res) => {
  const id = req.params.id;
  return res.redirect(`${DATA_HOST}/thumbnails/${id}`);
});

app.get('/data/images/:id', (req, res) => {
  const id = req.params.id;
  return res.redirect(`${DATA_HOST}/images/${id}`);
});

app.use('/dist', express.static(`${__dirname}/../dist`));
app.use(express.static(`${__dirname}/../public`));

// -----------------------------------------------------------------------------
// MISC
// -----------------------------------------------------------------------------

async function setupAndStart() {
  process.stdout.write('Connecting to database...');

  await db.connect();

  process.stdout.write(' OK!\n');
  process.stdout.write('Starting server...');

  app.listen(PORT, () => {
    process.stdout.write(' OK!\n');
    process.stdout.write(`\nServer is listening on port ${PORT}.\n\n`);
  });
}
