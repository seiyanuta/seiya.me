# Default values for build system.
export V ?=

# The default build target.
.PHONY: default
default: all

# Disable builtin implicit rules and variables.
MAKEFLAGS += --no-builtin-rules --no-builtin-variables
.SUFFIXES:

# Enable verbose output if $(V) is set.
ifeq ($(V),)
.SILENT:
endif

PROGRESS := printf "  \\033[1;96m%8s\\033[0m  \\033[1;m%s\\033[0m\\n"

all: \
	dist/blog.html \
	$(patsubst pub/%,dist/%,$(wildcard pub/*)) \
	$(patsubst images/%,dist/%,$(wildcard images/*)) \
	$(patsubst videos/%,dist/%,$(wildcard videos/*)) \
	$(patsubst blog/%.md,dist/%.html,$(wildcard blog/*.md)) \

.PHONY: clean
clean:
	rm -rf dist tmp

.PHONY: dev
dev:
	mkdir -p dist
	yarn concurrently -n build,server \
		"nodemon -e 'html js scss md' --ignore 'dist/*' --ignore 'tmp/*' --exec 'make -j8 || exit 1'" \
		"cd dist; python3 -m http.server --bind localhost 8000"

dist/%: pub/%
	$(PROGRESS) "CP" $<
	mkdir -p $(@D)
	cp $< $@

dist/%.png: images/%.png
	$(PROGRESS) "CP" $<
	mkdir -p $(@D)
	cp $< $@

dist/%.mp4: videos/%.mp4
	$(PROGRESS) "CP" $<
	mkdir -p $(@D)
	cp $< $@

dist/%.jpg: images/%.jpg
	$(PROGRESS) "OPTIMIZE" $<
	jpegtran -copy none -optimize -progressive -outfile $@ $<

tmp/%.css: %.scss Makefile
	$(PROGRESS) "SASS" $<
	yarn node-sass $< $@.tmp
	$(PROGRESS) "POSTCSS" $<
	yarn postcss --no-map --use cssnano -o $@ $@.tmp

dist/blog.html: bloglist.js blog.html tmp/blog.css $(wildcard blog/*.md)
	mkdir -p tmp dist tmp/dist
	$(PROGRESS) "BLOGLIST" $@
	node bloglist.js --md tmp/blog.md --feed dist/atom.xml $(wildcard blog/*.md)
	$(PROGRESS) "MD2HTML" $<
	node md2html.js --template blog.html --css tmp/blog.css tmp/blog.md $@

dist/%.html: blog/%.md md2html.js blog.html tmp/blog.css
	$(PROGRESS) "MD2HTML" $<
	mkdir -p dist tmp/dist
	node md2html.js --template blog.html --css tmp/blog.css $< $@

