const { program } = require("commander");
const fs = require("fs");
const hljs = require("highlight.js");
const nunjucks = require("nunjucks");
const marked = require("marked");
const frontmatter = require("front-matter");

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

function md2html(mdFile, { css, template }) {
    const md = frontmatter(fs.readFileSync(mdFile, { encoding: "utf-8" }));
    const cssBody = fs.readFileSync(css, { encoding: "utf-8" });
    const templateHtml = fs.readFileSync(template, { encoding: "utf-8" });
    let bodyHtml = marked(md.body);
    bodyHtml = bodyHtml.replace(/<img /g, "<figure><img ");
    bodyHtml = bodyHtml.replace(/alt="([^"]+)">/g, "alt=\"$1\"><figcaption>$1</figcaption></figure>");
    const renderer = new nunjucks.Environment();
    return renderer.renderString(templateHtml, {
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
