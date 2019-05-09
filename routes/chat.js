const express = require("express");


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
router.post("/sendMessage", (req, res) => {
    var cid = req.query.channel;
    var msg = req.body.message;
    var uid = req.user.id;
    sendMessage(cid, uid, msg);
    getMessages(cid).then(val_list=>getChannelDetails(cid)).then(channel_details=>res.render("chat", {
        "messageList"   : val_list,
        "channelDetails": channel_details
    }));
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

module.exports = router;
