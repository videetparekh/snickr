const express = require("express");


const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var wid = req.query.workspace;
    console.log(wid);
    var cid = req.query.channel;
    var uid = req.user.id;
    if(cid === undefined) {
        getChannels(wid, uid).then(val_list=>getWorkspaceDetails(wid)).then(workspace_details=>res.render("workspace", {
            "channelList": val_list,
            "workspaceDetails": workspace_details
        }));
    }

});

router.post("/addchannel", (req, res) => {
    addChannel(req.body.channel_name, req.body.channel_type, req.query.workspace, req.user.id)
    .then(new_channel=>addAdminToChannel(new_channel))
    .then(value=>getChannels(req.query.workspace, req.user.id))
    .then(value=>getWorkspaceDetails(req.query.workspace))
    .then(workspace_details=>res.render("workspace", {
        "channelList": val_list,
        "workspaceDetails": workspace_details
    }));
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

async function addAdminToChannel(new_channel) {
    console.log(new_channel);
    return new Promise((resolve, reject)=>{
        global.db.query('Insert into ChannelUser(cid, uid, cauth, cutimestamp) values (?, ?, ?, now())',
                    [new_channel[0].cid, new_channel[0].ccreatorid, 'ADMIN'], function (err, result) {
                        addUsersToChannel(new_channel).then(value=>resolve(value));
                    });
    });
}

async function addUsersToChannel(new_channel) {
    console.log(new_channel);
    return new Promise((resolve, reject)=>{
        if(new_channel[0].c_type = 'public') {
            global.db.query(`INSERT INTO channeluser(uid, cid, cauth, ctimestamp) select uid, ?, ?, now()
            from workspaceuser where wid = ? and uid != ?;`, [new_channel[0].cid, 'MEMBER', new_channel[0].wid, new_channel[0].uid],
            function (err, result) {resolve();});
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

module.exports = router;
