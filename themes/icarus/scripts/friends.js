// 生成友链页面
hexo.theme.on('processAfter', () => {
    // 需要等到初步处理完成后才能注册，因为要使用一些配置文件中的内容
    const friends = hexo.config.theme_config.friends;
    if (!friends || !friends.list) {
        return;
    }

    const defaultAvatar = 'https://cdn.jsdelivr.net/gh/Candinya/Kratos-Rebirth/source/images/avatar.webp';
    const style = '.linkpage ul{color:rgba(255,255,255,.15)}.linkpage ul:after{content:" ";clear:both;display:block}.linkpage ul li{float:left;width:48%;position:relative;transition:.3s ease-out;border-radius:5px;line-height:1.3;height:90px;display:block}.linkpage ul li:hover{background:rgba(230,244,250,.5);cursor:pointer}.linkpage ul li a{padding:0 10px 0 90px}.linkpage ul li a img{width:60px;height:60px;object-fit:cover;border-radius:50%;position:absolute;top:15px;left:15px;cursor:pointer;margin:auto;border:none}.linkpage ul li a h4{color:#333;font-size:18px;margin:0 0 7px;padding-left:90px}.linkpage ul li a p{font-size:12px;color:#999;padding-left:90px}.linkpage ul li a h4,.linkpage ul li a p{cursor:pointer;white-space:nowrap;text-overflow:ellipsis;overflow:hidden;line-height:1.4}.linkpage ul li a:hover h4{color:#51aded}.linkpage h3{margin:15px -25px;padding:0 25px;border-left:5px solid #51aded;background-color:#f7f7f7;font-size:25px;line-height:40px}';
    const friendsDom =
        `<div class="linkpage">
            <ul id="friendsList"></ul>
        </div>
        <script type="text/javascript">
        {
            const flist = JSON.parse(\`${JSON.stringify(friends.list)}\`);
            let friendNodes = '';
            while (flist.length > 0) {
                const rndNum = Math.floor(Math.random()*flist.length);
                friendNodes += \`<li><a target="_blank" href="\${flist[rndNum].link}"><img src="\${flist[rndNum].avatar || '${defaultAvatar}'}"><h4>\${flist[rndNum].name}</h4><p>\${flist[rndNum].bio || ''}</p></a></li>\`;
                flist.splice(rndNum, 1);
            }
            document.getElementById("friendsList").innerHTML = friendNodes;
        }
        </script>`;
    const friendsContent = '<style>' + style + '</style>' + friendsDom + '<hr/><br>提交友链附上：</p><ul><li>链接</li><li>一句话介绍自己（可选）</li><li>头像链接（可选）</li></ul>';

    hexo.extend.generator.register('friends', function(locals){
        return {
            path: friends.href + '/index.html',
            data: Object.assign(friends.page, {
                content: friendsContent
            }),
            layout: 'page'
        };
    });
});

hexo.theme.once('generateAfter', () => {
    const friends = hexo.config.theme_config.friends;
    if (!friends || !friends.list || !friends.verify) {
        return;
    }

    const https = require('https');
    friends.list.forEach((friend) => {
        https.get(friend.link)
            .on('error', err => {
                hexo.log.warn('友链"${friend.name}"(${friend.link})出现错误，以下是错误信息：');
                hexo.log.warn(err);
            });
    });
});