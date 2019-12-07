#!/bin/sh
rm -rf public
mkdir -p public

cp *.html *.css *.jpg public

#
#  resea
#
if [[ ! -d resea ]]; then
    git clone https://github.com/seiyanuta/resea
fi
cd resea
git pull
pip3 install -r tools/requirements.txt
make docs
cp -r build/docs ../public/resea
