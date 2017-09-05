#!/bin/sh
mongoexport -h $MONGO_BLOG_HOST -d $MONGO_BLOG_COLL -c posts -u $MONGO_BLOG_USER -p $MONGO_BLOG_PASS -o "backup/posts-$(date +'%Y%m%d-%H%M').json"
