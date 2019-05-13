const express = require("express");


const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var wid = req.query.workspace;
    var uid = req.user.id;
    Promise.all([getChannels(wid, uid),getWorkspaceDetails(wid), getUserList(wid)]).then(([val_list, workspace_details, user_list])=>res.render("workspace", {
        "channelList"       : val_list,
        "workspaceDetails"  : workspace_details,
        "userList"          : user_list
    }));
});

router.post("/addchannel", (req, res) => {
    addChannel(req.body.channel_name, req.body.channel_type, req.query.workspace, req.user.id)
    .then(new_channel=>updateChannelUser(new_channel))
    .then(value=>res.redirect("/workspace/?workspace="+req.query.workspace));
});

router.post("/addAdmin", (req, res) => {
    var wid = req.query.workspace;
    var email = req.body.userToAdmin;
    makeUserAdmin(wid, email).then(value=>res.redirect("/workspace/?workspace="+wid));
});

router.post("/sendinvite", (req, res) => {
    var email = req.body.user_email;
    var wid   = req.query.workspace;
    inviteUserToWorkspace(wid, email).then(value=>res.redirect("/workspace/?workspace="+wid));
});

async function addChannel(c_name, c_type, wid, uid) {
    return new Promise((resolve, reject)=>{
        global.db.getConnection(function (err, connection) {
            if (err) throw err;
            connection.beginTransaction(function (err) {
                if (err) { throw err; }
                connection.query('Insert into Channel(cname, wid, ctype, ccreatorid, ctimestamp) values (?, ?, ?, ?, now())',
                    [c_name, wid, c_type, uid], function (err, result) {
                        if (err) {
                            connection.rollback(function () {
                                throw err;
                            });
                        }
                        connection.query('SELECT * from Channel where cid = LAST_INSERT_ID()',
                            function (err, result) {
                                if (err) {
                                    console.log(err)
                                    connection.rollback(function () {
                                        throw err;
                                    });
                                }
                                var new_channel = JSON.parse(JSON.stringify(result));
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
                                resolve(new_channel);
                            });
                    });
            });
        });
    });
}

async function updateChannelUser(new_channel) {
    console.log(new_channel);
    return new Promise((resolve, reject)=>{
        global.db.query('Insert into ChannelUser(cid, uid, cauth, cutimestamp) values (?, ?, ?, now())',
                    [new_channel[0].cid, new_channel[0].ccreatorid, 'ADMIN'], function (err, result) {
                        addUsersToChannel(new_channel).then(value=>resolve(value));
                    });
    });
}

async function addUsersToChannel(new_channel) {
    return new Promise((resolve, reject)=>{
        if(new_channel[0].ctype == 'public') {
            global.db.query(`INSERT INTO ChannelUser(uid, cid, cauth, cutimestamp) select uid, ?, ?, now()
            from WorkspaceUser where wid = ? and uid != ?`, [new_channel[0].cid, 'MEMBER', new_channel[0].wid, new_channel[0].ccreatorid],
            function (err, result) {
                console.log(err);
                console.log(result);
                resolve();
            });
        } else {resolve();}
    });
}

async function getChannels(wid, uid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT c.wid, c.cid, cname , ctype, ccreatorid, ctimestamp, w.wname from ChannelUser cuser join Channel c join Workspace w
        on cuser.cid=c.cid and c.wid = w.wid where c.wid = ? and cuser.uid = ?`, [wid, uid], function (err, results, fields) {
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

async function inviteUserToWorkspace(wid, email) {
    console.log(wid);
    console.log(email);
    return new Promise((resolve, reject) => {
        query = global.db.query(`Insert into WorkspaceInvitation(uid, wid, witimestamp, wistatus, wistatuschange)
        Select u.uid, ?, now(), ?, now() from SnickrUser u where u.email = ?`, [wid, "Pending", email], function(err, results, fields) {
            resolve();
        });
    });
}

async function getWorkspaceDetails(wid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT * from Workspace w
        where w.wid = ?`, wid, function (err, results, fields) {
            if(err)
                reject(err);
                workspace_details = [];
                if(typeof results!=='undefined'){
                    workspace_details = JSON.parse(JSON.stringify(results));
                }
                resolve(workspace_details);
        });
    });
}

async function getUserList(wid) {
    return new Promise((resolve, reject) => {
        query = global.db.query(`SELECT wu.wid, u.uid, u.email from WorkspaceUser wu join SnickrUser u
            on wu.uid = u.uid where wu.wid = ? and wu.wauth != 'ADMIN'`, wid, function (err, results, fields) {
            if(err){
                reject(err);
                console.log(err);
            }
            user_list = [];
            if(typeof results!=='undefined'){
                user_list = JSON.parse(JSON.stringify(results));
            }
            resolve(user_list);
        });
    });
}

async function makeUserAdmin(wid, email) {
    return new Promise((resolve, reject) => {
        query = global.db.query(` UPDATE WorkspaceUser wu SET wu.wauth='ADMIN'
        where wu.wid = ? and wu.uid = (SELECT uid from SnickrUser where email = ?)`, [wid, email], function (err, results, fields) {
            if(err){
                reject(err);
                console.log(err);
            }
            resolve();
        });
    });
}

module.exports = router;
