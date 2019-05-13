const express = require("express");
const session = require("express-session");

const router = express.Router();

// Display the dashboard page
router.get("/", (req, res) => {
    updateUser(req.user);
    getWorkspaces(req.user.id)
    .then(val_list=>res.render("dashboard", { "workspaceList": val_list }));
});

router.post("/addworkspace", (req, res) => {
    addWorkspace(req.body.workspace_name, req.user.id)
    .then(values=>res.render("dashboard", { "workspaceList": values }));
});


async function addWorkspace(w_name, uid) {
    return new Promise((resolve, reject)=>{
        global.db.getConnection(function (err, connection) {
            if (err) throw err;
            connection.beginTransaction(function (err) {
                if (err) { throw err; }
                connection.query('Insert into Workspace(wname, wcreatorid, wtimestamp) values (?, ?, now())',
                    [w_name, uid], function (err, result) {
                        if (err) {
                            connection.rollback(function () {
                                throw err;
                            });
                        }
                        connection.query('Insert into WorkspaceUser values(LAST_INSERT_ID(), ?, ?, now())', [uid, 'ADMIN'],
                            function (err, result) {
                                if (err) {
                                    console.log(err)
                                    connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                connection.commit(function (err) {
                                    if (err) {
                                        connection.rollback(function () {
                                            throw err;
                                        });
                                    }
                                });
                                connection.release()
                                if(err)
                                    reject(err);
                                getWorkspaces(uid).then(value=>resolve(value));

                            });
                    });
            });
        });
    });
}

async function getWorkspaces(uid) {
    return new Promise((resolve, reject)=>{
    query = global.db.query(`SELECT w.wid, wname, wcreatorid, wtimestamp from WorkspaceUser wuser join Workspace w
    on wuser.wid = w.wid where wuser.uid = ?`, uid, function (err, results, fields) {
            if(err)
                reject(err);
                val_list = []
                if(typeof results!=='undefined'){
                    val_list = JSON.parse(JSON.stringify(results));
                }
                resolve(val_list);
        });

    });
}

router.get("/test", (req, res) => {
    res.render("test");
});

async function updateUser(user) {
    global.db.query('SELECT uid from SnickrUser where uid=?', user.id, function(err, results, fields) {
      if (!results[0]) {
        db.query('INSERT INTO SnickrUser(uid, name, email, nickname, joindate, lastlogin) VALUES (?,?,?,?,?,?)',
        [
          user.id,
          user.profile.firstName+' '+user.profile.lastName,
          user.profile.email,
          user.profile.secondEmail,
          new Date(user.created).toISOString().slice(0, 19).replace('T', ' '),
          new Date(user.lastLogin).toISOString().slice(0, 19).replace('T', ' ')
        ],
       function(err, results, fields) {
         if(err) {
           console.log(err);
         }
       });
     } else {
       global.db.query('UPDATE SnickrUser SET lastlogin = ? WHERE uid = ?', [new Date(user.lastLogin).toISOString().slice(0, 19).replace('T', ' '), user.id],
       function(err, results, fields){
         if(err) {
           console.log(err);
         }
       });
     }
   });

}

module.exports = router;
