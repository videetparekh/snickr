const express = require("express");

const router = express.Router();

router.post("/", (req, res)=>{
    search(req.body.search_message, req.user.id)
    .then(values=>{
        console.log(values)
        res.render("search", { "message": values})});
});

async function search(message, uid) {
    return new Promise((resolve, reject)=>{
        query = global.db.query(`Select content, wname, cname from Workspace natural join\
        WorkspaceUser natural join Channel natural join ChannelUser natural join Message where uid=? \
        and content like ? `, [uid, '%' + message + '%'], function (err, results, fields) {
            if(err)
                reject(err);
                val_list = []
                if(typeof results!=='undefined'){
                    val_list = JSON.parse(JSON.stringify(results));
                }
                console.log(query)
                resolve(val_list);
        });

    });
}
module.exports = router;