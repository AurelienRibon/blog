'use strict';

const express = require('express');
const db      = require('./db');

const PORT      = 4000;
const DATA_HOST = 'http://aurelienjp.cluster010.ovh.net/data/blog';

setupAndStart();

const app = express();
app.set('json spaces', 2);

// -----------------------------------------------------------------------------
// ROUTES
// -----------------------------------------------------------------------------

app.get('/api/getpostmetas/:offset/:limit', async (req, res) => {
  const offset = Math.max(Number(req.params.offset) || 0, 0);
  const limit  = Math.max(Number(req.params.limit) || 1, 1);
  const posts = await db.getPostMetas(offset, limit);
  return res.json(posts);
});

app.get('/api/getpost/:postId', async (req, res) => {
  const post = await db.getPost(req.params.postId);
  return res.json(post);
});

app.get('/data/thumbnail/:id', (req, res) => {
  const id = req.params.id;
  res.redirect(`${DATA_HOST}/thumbnails/${id}`);
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
    process.stdout.write(` OK!\n\nServer is listening on port ${PORT}.\n\n`);
  });
}
