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
    getChannelDetails(cid)
    .then(channel_details=>getUser(email).then(inv_user_details=>checkWorkspaceUser(inv_user_details, channel_details)))
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

async function inviteUserToChannel(invited_user, channel) {
    return new Promise((resolve, reject) => {
        query = global.db.query(`Insert into ChannelInvitation(uid, cid, citimestamp, cistatus, cistatuschange)
        Values (?, ?, now(), ?, now())`, [invited_user[0].uid, channel[0].cid, "Pending"], function(err, results, fields) {
            resolve();
        });
    });
}

async function checkInvitationForDirectChannel(cid) {
    new Promise((resolve, reject) => {
        query = global.db.query(`Select * from ChannelInvitation ci where ci.cid = ?
            and (ci.cistatus=='Accepted' or ci.status='Pending')`, cid,function(err, results, fields) {
            var sendInvite = !(typeof results !== 'undefined');
            resolve(sendInvite);
        });
    });
}

async function checkForSentInvitation(cid, user_id) {
    new Promise((resolve, reject) => {
        query = global.db.query(`Select * from ChannelInvitation ci where ci.cid = ? and ci.uid = ?
            and (ci.cistatus=='Accepted' or ci.status='Pending')`, [cid, user_id],function(err, results, fields) {
            var sendInvite = !(typeof results !== 'undefined');
            resolve(sendInvite);
        });
    });
}

async function checkWorkspaceUser(invited_user, channel) {
    if (invited_user[0] === undefined) {
        return "Invitation cannot be sent.";
    }
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT * from WorkspaceUser wu
        where wu.wid = ? and uid = ?`, [channel[0].wid, invited_user[0].uid], function (err, results, fields) {
            if(err)
                reject(err);
                if(typeof results!=='undefined'){
                    if(channel[0].ctype == 'direct') {
                        checkInvitationForDirectChannel(channel)
                        .then(sendInvite=>new function() {
                            if(sendInvite) {
                                inviteUserToChannel(invited_user, channel);
                            }
                        })
                        .then(value=>resolve(value));
                    } else {
                        checkForSentInvitation(channel)
                        .then(sendInvite=>new function() {
                            if(sendInvite) {
                                inviteUserToChannel(invited_user, channel);
                            }
                        })
                        .then(value=>resolve(value));
                    }
                }
        });
    });
}

module.exports = router;
