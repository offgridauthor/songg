import SongController from './SongController';
import express from 'express';
import _ from 'underscore';
import utilExt from './codelibs/utilsExtension';
import Router from './Router';

global.app = express();
global._ = _;
global.app.songAttributesKey = 'songAttributes';
_._ = utilExt;

const router = new Router({
  get: {
    '/songSystem': SongController
  },
  post: {},
  use: [express.static('public')]

});

router.boot();
