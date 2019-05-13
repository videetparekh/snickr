const express   = require("express");

const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var cid = req.query.channel;
    Promise.all([getMessages(cid),getChannelDetails(cid), getUserList(cid)]).then(([val_list, channel_details, user_list])=>res.render("chat", {
        "messageList"   : val_list,
        "channelDetails": channel_details,
        "userList"      : user_list
    }));
});

router.post("/load", (req, res) => {
    cid=req.body.cid;
    Promise.all([getMessages(cid),getChannelDetails(cid)]).then(([val_list, channel_details])=>res.render("load", {
        "messageList"   : val_list,
        "channelDetails": channel_details
    }));
});

router.post("/addAdmin", (req, res) => {
    var cid = req.query.channel;
    var email = req.body.userToAdmin;
    makeUserAdmin(cid, email).then(value=>res.redirect('/chat/?channel='+cid));
});

// Change url (easy to confuse with the GET method)
router.post("/sendmessage", (req, res) => {
    var cid = req.query.channel;
    var msg = req.body.message;
    var uid = req.user.id;
    sendMessage(cid, uid, msg);
    Promise.all([getMessages(cid),getChannelDetails(cid), getUserList(cid, req.user.id)]).then(([val_list, channel_details, user_list])=>{
        res.send({success: true});
    });
});

router.post("/sendinvite", (req, res) => {
    var cid     = req.query.channel;
    var email   = req.body.user_email;
    Promise.all([getChannelDetails(cid), getUser(email)])
    .then(results=>checkWorkspaceUser(results[0], results[1]))
    .then(value=>res.send({success: true}));
});

async function getMessages(cid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT m.*, u.name from Message m join Channel c join SnickrUser u on m.cid = c.cid
            and m.uid = u.uid where m.cid=? order by mtimestamp asc`, cid, function (err, results, fields) {
            if(err)
                reject(err);
            val_list = [];
            if(typeof results!=='undefined'){
                val_list = JSON.parse(JSON.stringify(results));
            }
            resolve(val_list);
        });
    });
}

async function sendMessage(cid, uid, msg) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`INSERT into Message(cid, uid, content, mtimestamp)
        values (?, ?, ?, now())`, [cid, uid, msg], function (err, results, fields) {
            if(err)
                reject(err);
            resolve();
        });
    });
}

async function getChannelDetails(cid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT * from Channel c
        where c.cid = ?`, cid, function (err, results, fields) {
            if(err)
                reject(err);
                channel_details = [];
                if(typeof results!=='undefined'){
                    channel_details = JSON.parse(JSON.stringify(results));
                }
                resolve(channel_details);
        });

    });
}

async function getUser(email) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT * from SnickrUser u
        where u.email = ?`, email, function (err, results, fields) {
            if(err)
                reject(err);
                invited_user_details = [];
                if(typeof results!=='undefined'){
                    invited_user_details = JSON.parse(JSON.stringify(results));
                }
                resolve(invited_user_details);
        });
    });
}

async function inviteUserToChannel(channel, invited_user) {
    if (channel[0].ctype == 'direct') {
        return new Promise((resolve, reject) => {
            query = global.db.query(`Insert into ChannelInvitation(uid, cid, citimestamp, cistatus, cistatuschange)
            select ?, ?, now(), ?, now() from dual
            where not exists (Select cid from ChannelInvitation where cid = ?
            and (cistatus='Accepted' or cistatus='Pending'))`, [invited_user[0].uid, channel[0].cid, "Pending", channel[0].cid], function(err, results, fields) {
                if (err){
                    console.log(err);
                    reject(err);
                }
                resolve();
            });
        });
    } else {
        return new Promise((resolve, reject) => {
            query = global.db.query(`Insert into ChannelInvitation(uid, cid, citimestamp, cistatus, cistatuschange)
            select ?, ?, now(), ?, now() from dual
            where not exists (Select uid, cid from ChannelInvitation where uid = ? and cid = ?
            and (cistatus='Accepted' or cistatus='Pending'))`, [invited_user[0].uid, channel[0].cid, "Pending", invited_user[0].uid, channel[0].cid], function(err, results, fields) {
                if (err) {
                    console.log(err)
                    reject(err);
                }
                resolve();
            });
        });
    }
}

async function checkWorkspaceUser(channel, invited_user) {
    if (invited_user[0] === undefined) {
        console.log("Invitation cannot be sent.");
        return;
    }
    return new Promise((resolve, reject)=>{
        // console.log(invited_user[0]['uid'], channel[0]['cid']);
        query = global.db.query(`SELECT * from WorkspaceUser wu
        where wu.wid = ? and uid = ?`, [channel[0].wid, invited_user[0].uid], function (err, results, fields) {
            if(err){
                reject(err);
                console.log(err);
            }
            // Verify if user exists in Workspace
            if(typeof results!=='undefined' && results.length!=0)
                inviteUserToChannel(channel, invited_user).then(value=>resolve(value));
            else
                resolve();
        });
    });
}

async function getUserList(cid) {
    return new Promise((resolve, reject) => {
        query = global.db.query(`SELECT cu.cid, u.uid, u.email from ChannelUser cu join SnickrUser u
            on cu.uid = u.uid where cu.cid = ? and cu.cauth != 'ADMIN'`, cid, function (err, results, fields) {
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

async function makeUserAdmin(cid, email) {
    return new Promise((resolve, reject) => {
        query = global.db.query(` UPDATE ChannelUser cu SET cu.cauth='ADMIN'
        where cu.cid = ? and cu.uid = (SELECT uid from SnickrUser where email = ?)`, [cid, email], function (err, results, fields) {
            if(err){
                reject(err);
                console.log(err);
            }
            resolve();
        });
    });
}

module.exports = router;
