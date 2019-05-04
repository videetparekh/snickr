const express = require("express");
const session = require("express-session");

const router = express.Router();

// Display the dashboard page
router.get("/", (req, res) => {

    // TODO Fix the asynchronicity problem. Speak to Abhinav
    const workspaces = [];
    getWorkspaces(req.user.id).then(workspaces => workspaceList)
        .then(console.log("Outside function."))
        .then(console.log(workspaces))
        .then(res.render("dashboard", {"workspaceList" : workspaces}));
});

async function getWorkspaces(uid) {
    let workspaceList = [];
    await global.db.query(`SELECT w.wid, wname, wcreatorid, wtimestamp from WorkspaceUser wuser join Workspace w
    on wuser.wid = w.wid where wuser.uid = ?`, uid, function(err, results, fields) {
        console.log(results);
        workspaceList = JSON.parse(JSON.stringify(results));
        return workspaceList;
    });
}

router.get("/test", (req, res) => {
  res.render("test");
});

module.exports = router;
