OUT_DIR ?= public
MDBOOKS := resea/docs
STATIC_FILES := \
	$(wildcard *.html) $(wildcard *.jpg) \
	$(wildcard images/*) $(wildcard resea/*) $(wildcard nsh/*)

PROGRESS := printf "  \\033[1;35m%8s  \\033[1;m%s\\033[m\\n"
MAKEFLAGS += --no-builtin-rules --no-builtin-variables
.SUFFIXES:
ifeq ($(V),)
.SILENT:
endif

post_htmls := $(patsubst %.adoc, %.html, $(wildcard *.adoc))
project_files := $(foreach proj, $(PROJECTS), $(wildcard $(proj)/*))

all: $(OUT_DIR)/project.css $(OUT_DIR)/post.css \
	$(addprefix $(OUT_DIR)/, $(post_htmls) $(STATIC_FILES)) \
	$(OUT_DIR)/resea/docs

.PHONY: clean
clean:
	rm -rf $(OUT_DIR)

$(OUT_DIR)/%.css: %.scss
	$(PROGRESS) "SASS" $<
	mkdir -p $(@D)
	sass $< $@

$(OUT_DIR)/%.html: %.adoc $(OUT_DIR)/post.css
	$(PROGRESS) "ASIIDOC" $<
	mkdir -p $(@D)
	asciidoctor -a stylesheet=$(OUT_DIR)/post.css -o $@ $<
	sed -i .bak "s#</head># \
	    <script async src=\"https://www.googletagmanager.com/gtag/js?id=UA-145819933-1\"></script> \
	    <script> \
	      window.dataLayer = window.dataLayer || []; \
	      function gtag(){dataLayer.push(arguments);} \
	      gtag('js', new Date()); \
	      gtag('config', 'UA-145819933-1'); \
	    </script></head>#" "$@"
	rm $@.bak

$(OUT_DIR)/%: %
	$(PROGRESS) "COPY" $<
	mkdir -p $(@D)
	cp $< $@

tmp/resea:
	$(PROGRESS) "CLONE" seiyanuta/resea
	mkdir -p $(@D)
	git clone https://github.com/nuta/resea tmp/resea
	pip3 install -r tmp/resea/tools/requirements.txt

$(OUT_DIR)/resea/docs: tmp/resea
	$(PROGRESS) "MAKE" resea/docs
	cd tmp/resea && make docs
	rm -rf $@
	cp -r tmp/resea/build/docs $@