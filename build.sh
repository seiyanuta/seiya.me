#!/bin/sh
rm -rf public
mkdir -p public

cp *.html *.css *.jpg public
cp -r resea public

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
