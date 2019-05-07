const express = require("express");


const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var wid = req.query.workspace;
    var cid = req.query.channel;
    var uid = req.user.id;
    if(cid === undefined) {
        getChannels(wid, uid).then(val_list=>res.render("workspace", { "channelList": val_list }));
    }

});

router.post("/addchannel", (req, res) => {
    addChannel(req.body.channel_name, req.body.channel_type, req.query.workspace, req.user.id)
    .then(values=>res.render("workspace", { "channelList": values }));
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
                        connection.query('Insert into ChannelUser values(LAST_INSERT_ID(), ?, ?, now())', [uid, 'ADMIN'],
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
                                if(err)
                                    reject(err);
                                getChannels(wid, uid).then(value=>resolve(value));

                            });
                    });
            });
        });
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

module.exports = router;
