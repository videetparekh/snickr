const express = require("express");


const router = express.Router();

router.get("/", (req, res) => {
    var uid = req.user.id;
    Promise.all([get_workspace_invitations(uid), get_channel_invitations(uid)]).then(results=>{
        console.log(results[0]);
        res.render("invitations", {"winvites": results[0], "cinvites": results[1]});
    });
});

router.post("/workspace", (req, res)=>{
    var uid = req.user.id;
    var wid = req.query.workspace;
    var status;
    if(req.body.status=="accept"){
        status="Accepted";
        service_invitation(status, wid, uid).then(values=>res.redirect("/invitations"));
    }
    else if(req.body.status=="reject"){
        status="Rejected";
        service_invitation(status, wid, uid).then(values=>res.redirect("/invitations"));
    }
    else
        res.redirect("/invitations");
    
});

async function service_invitation(status, wid, uid){
    return new Promise((resolve, reject)=>{
        global.db.getConnection(function (err, connection) {
            if (err) throw err;
            connection.beginTransaction(function (err) {
                if (err) { throw err; }
                connection.query(`update WorkspaceInvitation set wistatus=? where wid=? and uid=?`,
                    [status, wid, uid], function (err, result) {
                        if (err) {
                            connection.rollback(function () {
                                throw err;
                            });
                        }
                        if(status=="Accepted"){
                            connection.query(`insert into WorkspaceUser values(?, ?, 'normal', now())`,[wid, uid],
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
                                    connection.release();
                                    resolve(null);
                                });
                            }else{
                                connection.commit(function (err) {
                                    if (err) {
                                        connection.rollback(function () {
                                            throw err;
                                        });
                                    }
                                });
                                connection.release();
                                resolve(null);
                            }
                    });
            });
        });
    });
}
async function get_workspace_invitations(uid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`select wid, wname from Workspace natural join WorkspaceInvitation \
        where uid=? and wistatus='Pending'`, [uid], function (err, results, fields) {
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

async function get_channel_invitations(uid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`select cid, wid, cname from Channel natural join ChannelInvitation \
        where uid=? and cistatus='Pending'`, [uid], function (err, results, fields) {
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
