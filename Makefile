.PHONY: default watch build optimize
default: watch
watch:
	./builder.js -s
build:
	./builder.js
optimize:
	optipng images/*.png
	find images -name "*.jpg" -type f -exec \
		jpegtran -copy none -optimize  -progressive \
		-outfile {} {} \;
