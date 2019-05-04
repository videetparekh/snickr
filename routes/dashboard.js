const express = require("express");
const session = require("express-session");

const router = express.Router();

// Display the dashboard page
router.get("/", (req, res) => {
    const workspaces = [];
    getWorkspaces(req.user.id, res);
});
router.post("/addworkspace", (req, res) => {
    addWorkspace(req.body.workspace_name, req.user.id, res);
});


function addWorkspace(w_name, uid, res) {
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
                    connection.query('Insert into WorkspaceUser values(LAST_INSERT_ID(), ?, ?, now())', [uid, 'ADMINI'],
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
                            getWorkspaces(uid, res);

                        });
                });
        });
    });
}

async function getWorkspaces(uid, res) {
    query = global.db.query(`SELECT w.wid, wname, wcreatorid, wtimestamp from WorkspaceUser wuser join Workspace w
    on wuser.wid = w.wid where wuser.uid = ?`, uid, function (err, results, fields) {
            console.log(results);
            val_list = JSON.parse(JSON.stringify(results));
            res.render("dashboard", { "workspaceList": val_list });
        });
}

router.get("/test", (req, res) => {
    res.render("test");
});

module.exports = router;
