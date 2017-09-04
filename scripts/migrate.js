'use strict';

const fs      = require('fs');
const moment  = require('moment');
const HJSON   = require('hjson');
const request = require('request');
const db      = require('../server/db');

const postmetaDb = JSON.parse(fs.readFileSync(`${__dirname}/../backup/blog_wp_postmeta.json`, 'utf8'));
const postsDb    = JSON.parse(fs.readFileSync(`${__dirname}/../backup/blog_wp_posts.json`, 'utf8'));

const deletedPostIds = new Set([
  'first-android-app-out-pirate-compass', 'pirate-compass-is-now-free', 'universal-tween-engine-rev-4-0',
  'just-married', 'box2d-editor-released-for-beta-testing', 'changing-blog', 'next-months-schedule', 'forum',
  'texturepacker-gui-v3-0-0', 'texturepacker-gui-support-for-multiple-packs'
]);

const thumbnails = postmetaDb
  .filter(row => row.meta_key === '_thumbnail_id')
  .map(row => ({
    postId : row.post_id,
    image  : postsDb.find(r => r.ID === row.meta_value).guid
  }));

const posts = postsDb
  .filter(row => row.post_type === 'post')
  .filter(row => row.post_status === 'publish')
  .filter(row => !deletedPostIds.has(row.post_name))
  .sort((a, b) => Number(a.ID) - Number(b.ID))
  .map(row => processPost(row, thumbnails));

fs.writeFileSync('posts.hjson', HJSON.stringify(posts), 'utf8');
console.log(`Processed ${posts.length} posts, written in "posts.hjson".`);

(async () => {
  console.log('Writing posts in Mongo database...');
  await db.connect();
  await db.addPosts(posts);
  console.log('All done!');
})();

// -----------------------------------------------------------------------------
// HELPERS
// -----------------------------------------------------------------------------

function processPost(post, thumbnails) {
  let imageUrl = thumbnails.find(tn => tn.postId === post.ID).image;
  imageUrl = imageUrl.slice('http://www.aurelienribon.com/blog/wp-content/uploads/'.length);
  imageUrl = imageUrl.replace(/\//g, '-');

  const postId  = post.post_name;
  const content = downloadAndReplaceImages(post.post_content, postId);

  return {
    _id     : post.post_name,
    date    : moment.utc(post.post_date_gmt).toDate(),
    title   : post.post_title,
    image   : imageUrl,
    content : content
      .replace(/\r/g, '')
      .replace(/<\/?strong>/g, '**')
      .replace(/<\/?em>/g, '*')
      .replace(/<\/?del>/g, '~~')
      .replace(/<\/?ul>/g, '')
      .replace(/<li>/g, '* ')
      .replace(/<\/li>/g, '')
      .replace(/<h1>/g, '\n# ')
      .replace(/<h2>/g, '\n## ')
      .replace(/<h3>/g, '\n### ')
      .replace(/<\/h\d>/g, '\n')
      .replace(/\t/g, '')
      .replace(/&amp;/g, '&')
      .replace(/\[caption.+?\](.+>) *(.+?)\[\/caption\]/g, '$1\n*$2*')
      .replace(/<img.*?src="(.+?)".*?\/>/g, '![]($1)')
      .replace(/<a.*?href="(.+?)".*?>(.+?)<\/a>/g, '[$2]($1)')
      .replace(/\[sourcecode\]/g, '```')
      .replace(/\[sourcecode language="java"\]/g, '```java')
      .replace(/\[\/sourcecode\]/g, '```')
      .replace(/<p style="text-align:\w+?;">/g, '')
      .replace(/<span style="color:#\d+?;">/g, '')
      .replace(/<\/p>/g, '')
      .replace(/<\/span>/g, '')
  };
}

function downloadAndReplaceImages(content, postId) {
  let imageCount = 0;
  const knownUrls = new Map();

  return content.replace(/http:\/\/[^ ]+?\.(jpg|png)/g, (url, ext) => {
    if (knownUrls.has(url)) {
      return knownUrls.get(url);
    }

    const fileName = `${postId}-${++imageCount}.${ext}`;
    const filePath = `${__dirname}/../database/images/${fileName}`;
    knownUrls.set(url, fileName);

    console.log(`Downloading ${fileName}`);
    request(url, () => {}).pipe(fs.createWriteStream(filePath));

    return `/data/images/${fileName}`;
  });
}
