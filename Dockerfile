FROM alpine:3.4
MAINTAINER leo.lou@gov.bc.ca

RUN apk update \
  && apk add alpine-sdk nodejs

RUN mkdir -p /app
  
WORKDIR /app
ADD . /app
RUN  npm install -g serve
RUN adduser -S broker
RUN chown -R broker:0 /app && chmod -R 770 /app
RUN apk del --purge alpine-sdk  

USER broker
EXPOSE 3000
CMD serve -C -D -J -S --compress .
