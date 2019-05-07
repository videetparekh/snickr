const express = require("express");


const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var cid = req.query.channel;
    getMessages(cid).then(val_list=>res.render("chat", { "messageList": val_list }));
});

// Change url (easy to confuse with the GET method)
router.post("/", (req, res) => {
    var cid = req.query.channel;
    var msg = req.body.message;
    var uid = req.user.id;
    sendMessage(cid, uid, msg);
    getMessages(cid).then(val_list=>res.render("chat", { "messageList": val_list }));
});

async function getMessages(cid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT m.*, c.cname, u.name from Message m join Channel c join SnickrUser u on m.cid = c.cid
            and m.uid = u.uid where m.cid=?`, cid, function (err, results, fields) {
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

module.exports = router;
