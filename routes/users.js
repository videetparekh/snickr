const express = require("express");


const router = express.Router();

// Log a user out
router.get("/logout", (req, res) => {
  req.logout();
  res.redirect("/");
});

router.get("/callback", (req, res) => {
    global.db.query('SELECT uid from SnickrUser where uid=?', req.user.id, function(err, results, fields) {
      if (!results[0]) {
        db.query('INSERT INTO SnickrUser(uid, name, email, nickname, joindate, lastlogin) VALUES (?,?,?,?,?,?)',
        [
          req.user.id,
          req.user.profile.firstName+' '+req.user.profile.lastName,
          req.user.profile.email,
          req.user.profile.secondEmail,
          new Date(req.user.created).toISOString().slice(0, 19).replace('T', ' '),
          new Date(req.user.lastLogin).toISOString().slice(0, 19).replace('T', ' ')
        ],
       function(err, results, fields) {
         if(err) {
           console.log(err);
         }
       });
     } else {
       global.db.query('UPDATE SnickrUser SET lastlogin = ? WHERE uid = ?', [new Date(req.user.lastLogin).toISOString().slice(0, 19).replace('T', ' '), req.user.id],
       function(err, results, fields){
         if(err) {
           console.log(err);
         }
       });
     }
   });
});

module.exports = router;
