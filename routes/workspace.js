const express = require("express");


const router = express.Router();

// Log a user out
router.get("/", (req, res) => {
    var wid = req.query.workspace;
    var cid = req.query.channel;
    console.log(wid);
    // Change try-catch logic later
    if(cid === undefined) {
        getChannels(wid).then(val_list=>res.render("workspace", { "channelList": val_list }));
    }
});

router.post("/addchannel", (req, res) => {
    addChannel(req.body.channel_name, req.body.channel_type, req.query.workspace, req.user.id, res);
});


// TODO Fix the functionality
// function addChannel(w_name, wid, uid, res) {
//     global.db.getConnection(function (err, connection) {
//         if (err) throw err;
//         connection.beginTransaction(function (err) {
//             if (err) { throw err; }
//             connection.query('Insert into Channel(cname, creatorid, wtimestamp) values (?, ?, now())',
//                 [w_name, uid], function (err, result) {
//                     if (err) {
//                         connection.rollback(function () {
//                             throw err;
//                         });
//                     }
//                     connection.query('Insert into WorkspaceUser values(LAST_INSERT_ID(), ?, ?, now())', [uid, 'ADMINI'],
//                         function (err, result) {
//                             if (err) {
//                                 console.log(err)
//                                 connection.rollback(function () {
//                                     throw err;
//                                 });
//                             }
//                             connection.commit(function (err) {
//                                 if (err) {
//                                     connection.rollback(function () {
//                                         throw err;
//                                     });
//                                 }
//                             });
//                             connection.release()
//                             getChannels(wid, res);
//
//                         });
//                 });
//         });
//     });
// }

async function getChannels(wid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`SELECT c.wid, c.cid, cname , ctype, ccreatorid, ctimestamp, w.wname from Channel c join Workspace w
        on c.wid = w.wid where c.wid = ?`, wid, function (err, results, fields) {
            if(err)
                reject(err);
            console.log(results);
            val_list = JSON.parse(JSON.stringify(results));
            resolve(val_list);
        });

    });
}

module.exports = router;
