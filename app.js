var createError = require('http-errors');
var express = require('express');
var path = require('path');
var logger = require('morgan');
var session = require("express-session");
var okta = require("@okta/okta-sdk-nodejs");
var mysql = require("mysql");
var ExpressOIDC = require("@okta/oidc-middleware").ExpressOIDC;


const dashboardRouter = require("./routes/dashboard");
const publicRouter = require("./routes/public");
const usersRouter = require("./routes/users");
const workspaceRouter = require("./routes/workspace");
const chatRouter = require("./routes/chat");
const searchRouter = require("./routes/search")
const invitationRouter = require('./routes/invitations')

var app = express();

var oktaClient = new okta.Client({
  orgUrl: 'https://dev-157670.okta.com',
  token: '00ZGR9HElFATBvgR76PHO2xrQTv99CUuKOp2xj9_ed'
});

const oidc = new ExpressOIDC({
  issuer: "https://dev-157670.okta.com/oauth2/default",
  client_id: '0oaj1nmn9IOFcSBav356',
  client_secret: 'eRoR-RT8U5hOQRN-6ADkKGCLc7wsM9qZ_gxzlQa7',
  redirect_uri: 'http://localhost:3000/users/callback',
  scope: "openid profile",
  routes: {
    login: {
      path: "/users/login"
    },
    callback: {
      path: "/users/callback",
      defaultRedirect: "/dashboard"
    }
  }
});

var db = mysql.createPool({
  connectionLimit : 100,
  host            : 'localhost',
  user            : 'snickr-daemon',
  password        : 'snickrdb2019',
  database        : 'snickr'
});

global.db = db;

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(session({
  secret: '1iAjnoxRLSla36avrIvG',
  resave: true,
  saveUninitialized: false
}));

app.use(oidc.router);

app.use((req, res, next) => {
  if (!req.userinfo) {
    return next();
  }

  oktaClient.getUser(req.userinfo.sub)
    .then(user => {
      req.user = user;
      res.locals.user = user;
      next();
    }).catch(err => {
      next(err);
    });
});

app.use('/', publicRouter);
app.use('/dashboard', loginRequired, dashboardRouter);
app.use('/users', usersRouter);
app.use('/workspace', loginRequired, workspaceRouter);
app.use('/chat', loginRequired, chatRouter);
app.use('/search', loginRequired, searchRouter);
app.use('/invitations', loginRequired, invitationRouter);
app.use('/resources', express.static(path.resolve(__dirname, './resources')))


// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;

app.get('/test', (req, res) => {
  res.json({ profile: req.user ? req.user.profile : null });
});

function loginRequired(req, res, next) {
  if (!req.user) {
    return res.status(401).render("unauthenticated");
  }
  next();
}
