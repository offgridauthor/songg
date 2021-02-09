import SongController from './SongController.mjs';
import express from 'express';
import _ from 'underscore';
import utilExt from './codelibs/utilsExtension.mjs';
import Router from './Router.mjs';

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
