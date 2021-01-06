const { program } = require("commander");
const path = require("path");
const fs = require("fs");
const nunjucks = require("nunjucks");
const frontmatter = require("front-matter");

MD_TEMPLATE = `
# Articles
**[Go back to the profile page](/)**

<br>
{% for link in links %}
- {{ link.date }} - **[{{ link.title }}]({{ link.href }})**
{% endfor %}
`

ATOM_TEMPLATE = `\
<?xml version="1.0" encoding="utf-8"?>
<feed xmlns="http://www.w3.org/2005/Atom">
    <title>seiya.me</title>
    <link href="https://seiya.me/atom.xml" rel="self" />
    <link href="https://seiya.me/" />
    <id>https://seiya.me</id>
    <updated>{{ now }}</updated>
    <author>
        <name>Seiya Nuta</name>
    </author>
    {% for file in files %}
	<entry>
		<title>{{ file.attributes.title }}</title>
		<link href="https://seiya.me/{{ file.basename }}" />
		<id>https://seiya.me/{{ file.basename }}</id>
		<updated>{{ file.isoDate }}</updated>
    </entry>
    {% endfor %}
</feed>
`

function generateMarkdown(files) {
    const links = [];
    for (const { attributes, basename } of files) {
        links.push({ 
            title: attributes.title,
            date: attributes.date,
            href: `/${basename}`,
        });
    }

    const renderer = new nunjucks.Environment();
    return renderer.renderString(MD_TEMPLATE, { links });
}

function generateFeed(files) {
    const now = new Date(Date.now()).toISOString();
    const renderer = new nunjucks.Environment();
    return renderer.renderString(ATOM_TEMPLATE, { files, now });
}

program
    .arguments("[mdFiles...]")
    .option("--md <file>")
    .option("--feed <file>")
    .action((mdFiles, { md, feed }) => {
        let files = [];
        for (const mdFile of mdFiles) {           
            const basename = `${path.basename(mdFile).replace('.md', '')}`;
            if (["blog", "lorem"].includes(basename)) {
                continue;
            }

            const md = frontmatter(fs.readFileSync(mdFile, { encoding: "utf-8" }));
            files.push({ 
                basename,
                date: new Date(Date.parse(md.attributes.date)),
                isoDate: new Date(Date.parse(md.attributes.date)).toISOString(),
                attributes: md.attributes,
            });
        }

        files.sort((a, b) => b.date - a.date);
    
        fs.writeFileSync(md, generateMarkdown(files));
        fs.writeFileSync(feed, generateFeed(files));
    })
    .parse(process.argv);
