#!/bin/sh
set -ex
rm -rf public
mkdir -p public

cp *.html *.css *.jpg public
cp -r images public
cp -r resea public
cp -r nsh public

#
#  Posts
#
mkdir -p build
sass post.scss build/post.css
for adoc in *.adoc; do
    asciidoctor -a stylesheet=build/post.css -o "public/${adoc%.*}.html" "$adoc"
    sed -i .bak "s#</head># \
        <script async src=\"https://www.googletagmanager.com/gtag/js?id=UA-145819933-1\"></script> \
        <script> \
          window.dataLayer = window.dataLayer || []; \
          function gtag(){dataLayer.push(arguments);} \
          gtag('js', new Date()); \
          gtag('config', 'UA-145819933-1'); \
        </script></head>#" "public/${adoc%.*}.html"
    rm "public/${adoc%.*}.html.bak"
done
