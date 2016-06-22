'use strict';

let gutil = require('gulp-util');
let PluginError = gutil.PluginError;
let chalk = require('chalk');
let through2 = require('through2');

let fs = require('fs');
let path = require('path');

let ejs = require('ejs');
// let babel = require('babel-core');
// let babelConfig = require('../../babelrc.js');
let templates = require('./views.js');
let premark = require('./premark.js');
let markdown = require('./markdown.js');
// let jsAPI = require('./js-api.js');
let sitemap = require('./sitemap.json');

module.exports = function(options) {
    options = options || {verbose: true};

    return through2.obj(function(file, enc, cb) {
        // 目前只为*.md的生成页面

        if (file.isNull())
            return cb(null, file);
        else if(file.isStream())
            throw new PluginError('gulp-build', 'Streaming not supported');

        let sitepath = file.path.replace(/^.*regular-ui-doc\/src\/content\/(.*)\.md/, '$1');
        console.log(sitepath);
        let levels = sitepath.split('/');

        let jsonpath = path.join(file.path, '../../index.json');

        let data = {
            sitemap: sitemap,
            mainnavs: [],
            sidenavs: [],
            assetsPath: '../',
            mainnav: levels[0],
            sidenav: levels[1],

            // assetsPath: 'http://regular-ui.github.io/',
            name: '',
            zhName: '',
            content: '',
            script: '',
            api: '',
        };

        // 组织主导航数据
        sitemap.children.forEach(function(level1) {
            level1.path = level1.children[0] ? (level1.lowerName + '/' + level1.children[0].lowerName + '.html').toLowerCase() : '#';
            // level1.path = level1.path || (level1.lowerName + '/index.html').toLowerCase();
            data.mainnavs.push(level1);
        });

        // 组织侧边栏数据
        for(var i = 0; i < sitemap.children.length; i++)
            if(sitemap.children[i].lowerName === levels[0]) {
                data.sidenavs = sitemap.children[i].children;
                data.sidenavs.forEach(function(item) {
                    if(item.lowerName === levels[1]) {
                        data.name = item.name;
                        data.zhName = item.zhName;
                    }
                    item.path = item.path || (data.assetsPath + levels[0] + '/' + item.lowerName + '.html').toLowerCase();
                    item.blank = /^http/.test(item.path);
                });
                break;
            }

        // 获取index.json中的基本信息
        // if(fs.existsSync(jsonpath))
        //     data = Object.assign(data, JSON.parse(fs.readFileSync(jsonpath, 'utf-8')));

        data.content = file.contents.toString();
        let tpl = templates.head + '<div class="g-bd"><div class="g-bdc">' + templates.sidebar + templates.main + '</div></div>' + templates.foot;

        // 对markdown中的示例进行预处理
        let result = premark.premark(data.content);
        // try {
        //     data.script = babel.transform(result.script, babelConfig).code;
        // } catch(e) {
        //     data.script = result.script;
        //     console.error('Babel transform error:', e, file.path);
        // }
        data.content = markdown(result.content);

        // 如果当前文件为index.md，并且组件有js代码，则生成api
        // let jspath = path.join(file.path, '../../index.js');
        // if(file.path.endsWith('/index.md') && fs.existsSync(jspath))
        //     data.api = jsAPI.render(jspath, templates['js-api']);

        let html;
        try {
            html = ejs.render(tpl, data);
        } catch(e) {
            html = tpl;
            console.error('Render ejs error:', e, file.path);
        }

        // 变更路径，修改file
        file.base = file.cwd;
        file.path = file.path.replace(/src\/content\/(.+)\.md$/, '$1.html');
        file.contents = new Buffer(html);

        options.verbose && console.log('[' + chalk.grey(new Date().toLocaleTimeString()) + ']', chalk.blue('Building'), 'doc/' + path.relative(file.base, file.path));

        cb(null, file);
    });
}