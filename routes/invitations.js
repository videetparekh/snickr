const express = require("express");


const router = express.Router();

router.get("/", (req, res) => {
    var uid = req.user.id;
    Promise.all([get_workspace_invitations(uid), get_channel_invitations(uid)]).then(results=>{
        console.log(results[0]);
        res.render("invitations", {"winvites": results[0], "cinvites": results[1]});
    });
});

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
