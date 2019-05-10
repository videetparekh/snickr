const express   = require("express");

const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var cid = req.query.channel;
    getMessages(cid).then(val_list=>getChannelDetails(cid)).then(channel_details=>res.render("chat", {
        "messageList"   : val_list,
        "channelDetails": channel_details
    }));
});

// Change url (easy to confuse with the GET method)
router.post("/sendmessage", (req, res) => {
    var cid = req.query.channel;
    var msg = req.body.message;
    var uid = req.user.id;
    sendMessage(cid, uid, msg);
    getMessages(cid).then(val_list=>getChannelDetails(cid)).then(channel_details=>res.render("chat", {
        "messageList"   : val_list,
        "channelDetails": channel_details
    }));
});

router.post("/sendinvite", (req, res) => {
    var cid     = req.query.channel;
    var email   = req.body.user_email;
    Promise.all([getChannelDetails(cid), getUser(email)])
    .then(results=>checkWorkspaceUser(results[0], results[1]))
    .then(value=>res.redirect("/chat/?channel="+cid));
});

async function getMessages(cid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT m.*, u.name from Message m join Channel c join SnickrUser u on m.cid = c.cid
            and m.uid = u.uid where m.cid=?`, cid, function (err, results, fields) {
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
            if(typeof results!=='undefined')
                inviteUserToChannel(channel, invited_user).then(value=>resolve(value));
        });
    });
}

module.exports = router;
