# Company server option: a small nginx image that serves the static site (no internet needed at run time)
FROM nginx:1.27-alpine
COPY server/nginx/default.conf /etc/nginx/conf.d/default.conf
COPY public/ /usr/share/nginx/html/
RUN rm -f /usr/share/nginx/html/_headers
EXPOSE 80
