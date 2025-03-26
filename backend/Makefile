.PHONY: build-image

build-image: 
	@docker build --platform=linux/amd64 -t m4nusha/large-project:latest .

push-image:
	@docker push m4nusha/large-project:latest

pull-image:
	@docker pull m4nusha/large-project:latest

run-image:
	@docker run m4nusha/large-project
