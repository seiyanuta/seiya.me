const { program } = require("commander");
const fs = require("fs");
const hljs = require("highlight.js");
const nunjucks = require("nunjucks");
const marked = require("marked");
const frontmatter = require("front-matter");

const renderer = new marked.Renderer();

// https://github.com/markedjs/marked/pull/675#issuecomment-408135046
renderer.oldImage = renderer.image;
renderer.image = function (href, title, text) {
    var videos = ['webm', 'mp4', 'mov'];
    var filetype = href.split('.')[1];
    if (videos.indexOf(filetype) > -1) {
        var out = '<video autoplay loop alt="' + text + '" muted>'
            + '  <source src="' + href + '" type="video/' + filetype + '">'
            + '</video>'
        return out;
    } else {
        return renderer.oldImage(href, title, text);
    }
};

marked.setOptions({
    renderer,
    highlight: function (code, lang) {
        lang = hljs.getLanguage(lang) ? lang : 'plaintext';
        return hljs.highlight(code, { language: lang }).value;
    },
    xhtml: false,
    pedantic: false,
    gfm: true,
    breaks: false,
    sanitize: false,
    smartLists: true,
    smartypants: false,
});

function md2html(mdFile, { css, template }) {
    const md = frontmatter(fs.readFileSync(mdFile, { encoding: "utf-8" }));
    const cssBody = fs.readFileSync(css, { encoding: "utf-8" });
    const templateHtml = fs.readFileSync(template, { encoding: "utf-8" });
    let bodyHtml = marked(md.body);
    bodyHtml = bodyHtml.replace(/<img /g, "<figure><img ");
    bodyHtml = bodyHtml.replace(/<video /g, "<figure><video ");
    bodyHtml = bodyHtml.replace(/alt="([^"]+)">/g, "alt=\"$1\"><figcaption>$1</figcaption></figure>");
    bodyHtml = bodyHtml.replace(/alt="([^"]+)" muted>(.+)<\/video>/g, "alt=\"$1\" muted>$2</video><figcaption>$1</figcaption></figure>");
    return (new nunjucks.Environment()).renderString(templateHtml, {
        body: bodyHtml,
        css: cssBody,
        ...md.attributes,
    });
}

program
    .arguments("<mdFile> <outFile>")
    .option("--template <file>", "html template")
    .option("--css <file>", "css file")
    .action((mdFile, outFile) => {
        const body = md2html(mdFile, program);
        fs.writeFileSync(outFile, body);
    })
    .parse(process.argv);
