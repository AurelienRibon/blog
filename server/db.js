'use strict';

const mongoClient = require('mongodb').MongoClient;

const MONGO_HOST = process.env.MONGO_BLOG_HOST;
const MONGO_USER = process.env.MONGO_BLOG_USER;
const MONGO_PASS = process.env.MONGO_BLOG_PASS;

const db = { posts: null };

exports.connect = async function() {
  try {
    const conn = await mongoClient.connect(`mongodb://${MONGO_USER}:${MONGO_PASS}@${MONGO_HOST}`);
    db.posts   = conn.collection('posts');
  } catch (err) {
    console.error('[FATAL] Connection to database failed.');
    console.error(err.stack);
    process.exit(1);
  }
};

exports.addPosts = async function(posts) {
  return db.posts.insertMany(posts);
};

exports.getPostMetas = async function(offset, limit) {
  const projection = { _id: 1, date: 1, title: 1, image: 1 };
  return db.posts.find().skip(offset).limit(limit).project(projection).sort({ date: 1 }).toArray();
};

exports.getPost = async function(postId) {
  return db.posts.findOne({ _id: postId });
};
