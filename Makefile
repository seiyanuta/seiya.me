.PHONY: default watch build optimize
default: watch
watch:
	./mdsite -s
build:
	./mdsite
	./mdbook
optimize:
	optipng images/*.png
	find images -name "*.jpg" -type f -exec \
		jpegtran -copy none -optimize  -progressive \
		-outfile {} {} \;
