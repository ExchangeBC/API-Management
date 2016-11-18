FROM alpine:3.4
MAINTAINER leo.lou@gov.bc.ca

RUN apk update \
  && apk add nodejs

RUN mkdir -p /app
  
WORKDIR /app
ADD . /app
RUN ln api-list.html index.html
RUN npm install -g serve
RUN adduser -S broker
RUN chown -R broker:0 /app && chmod -R 770 /app

USER broker
EXPOSE 3000
CMD serve -C -D -J -S --compress .
