#!/bin/sh
set -uex
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

if [[ "$POSTS_ONLY" != "" ]]; then
  exit 0
fi

mkdir -p repos
#
#  resea
#
if [[ ! -d repos/resea ]]; then
    git clone https://github.com/seiyanuta/resea repos/resea
fi
pushd repos/resea
git pull
pip3 install -r tools/requirements.txt
make docs
cp -r build/docs ../../public/resea/docs
