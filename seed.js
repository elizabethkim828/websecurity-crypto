'use strict';

var chance = require('chance')(123);
var Promise = require('bluebird');

var db = require('./server/db');
var User = require('./server/api/users/user.model');
var Story = require('./server/api/stories/story.model');
var crypto = require('crypto');
var iterations = 1;
var bytes = 64;

var numUsers = 100;
var numStories = 500;

var emails = chance.unique(chance.email, numUsers);

function doTimes (n, fn) {
  var results = [];
  while (n--) {
    results.push(fn());
  }
  return results;
}

function randPhoto () {
  var g = chance.pick(['men', 'women']);
  var n = chance.natural({
    min: 0,
    max: 96
  });
  return 'http://api.randomuser.me/portraits/' + g + '/' + n + '.jpg'
}

function randUser () {
  var originalpw = chance.word();
  var salt = crypto.randomBytes(16);
  var buffer = crypto.pbkdf2Sync(originalpw, salt, iterations, bytes);
  var hash = buffer.toString('base64');

  return User.build({
    name: [chance.first(), chance.last()].join(' '),
    photo: randPhoto(),
    phone: chance.phone(),
    email: emails.pop(),
    password: hash,
    salt: salt,
    isAdmin: chance.weighted([true, false], [5, 95])
  });
}

function randTitle () {
  var numWords = chance.natural({
    min: 1,
    max: 8
  });
  return chance.sentence({words: numWords})
  .replace(/\b\w/g, function (m) {
    return m.toUpperCase();
  })
  .slice(0, -1);
}

function randStory (createdUsers) {
  var user = chance.pick(createdUsers);
  var numPars = chance.natural({
    min: 3,
    max: 20
  });
  return Story.build({
    author_id: user.id,
    title: randTitle(),
    paragraphs: chance.n(chance.paragraph, numPars)
  });
}

function generateUsers () {
  var zekepw = '123'
  var omripw = '123'
  var zekesalt = crypto.randomBytes(16).toString('base64')
  var omrisalt = crypto.randomBytes(16).toString('base64')
  var zekebuffer = crypto.pbkdf2Sync(zekepw, zekesalt, iterations, bytes);
  var omribuffer = crypto.pbkdf2Sync(omripw, omrisalt, iterations, bytes);
  var zekehash = zekebuffer.toString('base64');
  var omrihash = omribuffer.toString('base64');

  var users = doTimes(numUsers, randUser);
  users.push(User.build({
    name: 'Zeke Nierenberg',
    photo: 'http://learndotresources.s3.amazonaws.com/workshop/55e5c92fe859dc0300619bc8/zeke-astronaut.png',
    phone: '(510) 295-5523',
    email: 'zeke@zeke.zeke',
    password: zekehash,
    salt: zekesalt,
    isAdmin: true
  }));
  users.push(User.build({
    name: 'Omri Bernstein',
    photo: 'http://learndotresources.s3.amazonaws.com/workshop/55e5c92fe859dc0300619bc8/sloth.jpg',
    phone: '(781) 854-8854',
    email: 'omri@zeke.zeke',
    password: omrihash,
    salt: omrisalt
  }));
  return users;
}

function generateStories (createdUsers) {
  return doTimes(numStories, function () {
    return randStory(createdUsers);
  });
}

function createUsers () {
  return Promise.map(generateUsers(), function (user) {
    return user.save();
  });
}

function createStories (createdUsers) {
  return Promise.map(generateStories(createdUsers), function (story) {
    return story.save();
  });
}

function seed () {
  return createUsers()
  .then(function (createdUsers) {
    return createStories(createdUsers);
  });
}

db.sync({force: true})
.then(function () {
  return seed();
})
.then(function () {
  console.log('Seeding successful');
}, function (err) {
  console.error('Error while seeding');
  console.error(err.stack);
})
.then(function () {
  process.exit();
});
