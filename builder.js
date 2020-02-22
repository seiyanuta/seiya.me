#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const chalk = require('chalk');
const program = require("commander");
const sass = require("node-sass");
const nunjucks = require("nunjucks");
const marked = require("marked");
const hljs = require("highlight.js");
const express = require("express");
const websocket = require("express-ws");
const frontmatter = require("front-matter");

const STATIC_FILES = [
    "index.html",
    "me.jpg",
]

const TRANSLATIONS = {
    en: {
        date_posted: "date",
        posts: "Posts",
        other_posts: "Other Posts",
    },
    ja: {
        date_posted: "投稿日",
        posts: "他の投稿",
        other_posts: "他の投稿を読む",
    }
}

marked.setOptions({
    renderer: new marked.Renderer(),
    highlight: function(code, lang) {
        lang = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(lang, code).value;
    },
    xhtml: false,
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
});

function info(msg) {
    console.log(chalk.blue.bold("INFO ")  + msg);
}

function warn(msg) {
    console.log(chalk.yellow.bold("WARN ")  + chalk.bold(msg));
}

function error(msg) {
    console.log(chalk.red.bold("ERR  ")  + chalk.bold(msg));
}

var debugMode = false;

function build() {
    info("Building...");

    if (!fs.existsSync("public")) {        
        fs.mkdirSync("public");
    }
   
    const templateHtml = fs.readFileSync("template.html", { encoding: "utf-8" });
    let posts = [];
    for (let file of fs.readdirSync("posts")) {
        file = path.join("posts", file);
        if (!file.endsWith(".md")) {
            continue;
        }

        const md = frontmatter(fs.readFileSync(file, { encoding: "utf-8" }));
        const bodyHtml = marked(md.body);
        const ctx = Object.assign(md.attributes, {
            debugMode,
            body: bodyHtml,
        });
        const renderer = new nunjucks.Environment();
        renderer.addFilter("l10n", (tag) => {
            return TRANSLATIONS[ctx.lang ? ctx.lang : "en"][tag];
        })
        const renderedHtml = renderer.renderString(templateHtml, ctx);
        const dst = path.join("public", path.basename(file).replace(".md", ".html"));
        fs.writeFileSync(dst, renderedHtml);

        const date = new Date(ctx.date);
        const month = `${date.getMonth()}`.padStart(2, '0');
        const day = `${date.getDay()}`.padStart(2, '0');
        posts.push({
                title: ctx.title,
                date,
                dateString:
                    `${date.getFullYear()}-${month}-${day}`,
                filename: path.basename(file).replace(".md", ""),
        });
    }

    let css;
    try {
        css = sass.renderSync({ file: "styles.scss" });
    } catch (e) {
        error(e.formatted);
        return;
    }

    fs.writeFileSync(path.join("public", "styles.css"), css.css);

    for (const file of fs.readdirSync("images")) {
        fs.copyFileSync(path.join("images", file),
            path.join("public", path.basename(file)));
    }

    for (const file of STATIC_FILES) {
        fs.copyFileSync(file, path.join("public", path.basename(file)));
    }

    const renderer = new nunjucks.Environment();
    renderer.addFilter("l10n", (tag) => TRANSLATIONS["en"][tag]);
    const postsHtml = renderer.renderString(templateHtml,
        { posts: posts.sort((a, b) => b.date - a.date), lang: "en" });
    fs.writeFileSync(path.join("public", "posts.html"), postsHtml);

    info("Done!");
}

function serve(port) {
    const server = express();
    websocket(server);
    server.use(express.static("public"));

    var wsClient;
    server.ws("/autoreload", (ws) => {
        wsClient = ws;
    });

    function onchange() {
        if (!wsClient) {
            return;
        }

        info("changes detected");
        build();
        try {
            wsClient.send("time to reload!");
        } catch (e) {
            warn(e);
        }
    }

    fs.watch("posts", { recursive: true }, onchange);
    fs.watchFile("template.html", onchange);
    fs.watchFile("styles.scss", onchange);

    server.listen(port, () => {
        info(`started a preview server at http://localhost:${port}`);
    })
}

program
    .option("-s, --serve", "start a preview server")
    .parse(process.argv);

if (program.serve) {
    debugMode = true;
    build();
    serve(3000);
} else {
    build();
}
