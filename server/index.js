'use strict';

const express    = require('express');
const moment     = require('moment');
const bodyParser = require('body-parser');
const bcrypt     = require('bcrypt');
const db         = require('./db');

const PORT       = process.env.PORT || 4000;
const DATA_HOST  = 'http://aurelienjp.cluster010.ovh.net/data/blog';
const ADMIN_HASH = '$2a$14$X91C3anDql.EKSEAn7L/JO/t.JHtMbuiDztxMU.QyUPlvVK1zBHwK';

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
// ROUTES
// -----------------------------------------------------------------------------

app.post('*', bodyParser.json());
app.get('/post/*', rewriteUrlToHome);
app.get('/editpost/*', rewriteUrlToHome);

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

app.post('/api/editpost/:postId', async (req, res) => {
  const postId   = req.params.postId;
  const password = String(req.body.password);
  const content  = String(req.body.content);
  let passwordMatches;

  try {
    passwordMatches = await bcrypt.compare(password, ADMIN_HASH);
  } catch (err) {
    return res.status(500).end(`Password check crashed for some reason: ${err.message}`);
  }

  if (!passwordMatches) {
    return res.status(403).end('Invalid password');
  }

  await db.setPostContent(postId, content);
  return res.end();
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

app.get('/*', (req, res) => {
  return res.redirect('/');
});

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

function rewriteUrlToHome(req, res, next) {
  req.url = '/';
  return next();
}
