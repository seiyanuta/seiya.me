.PHONY: default watch build
default: watch
watch:
	./builder.js -s
build:
	./builder.js
