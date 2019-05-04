const express = require("express");
const session = require("express-session");

const router = express.Router();

// Display the dashboard page
router.get("/", (req, res) => {
    const workspaces = [];
    getWorkspaces(req.user.id, res);
});

async function getWorkspaces(uid, res) {
    query = global.db.query(`SELECT w.wid, wname, wcreatorid, wtimestamp from WorkspaceUser wuser join Workspace w
    on wuser.wid = w.wid where wuser.uid = ?`, uid, function(err, results, fields) {
        console.log(results);
        val_list = JSON.parse(JSON.stringify(results));
        res.render("dashboard", {"workspaceList" : val_list});
    });
}

router.get("/test", (req, res) => {
  res.render("test");
});

module.exports = router;
