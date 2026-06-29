FROM nginx:alpine
COPY . /usr/share/nginx/html
RUN sed -i 's/listen       80;/listen       ${PORT:-8080};/' /etc/nginx/conf.d/default.conf
EXPOSE 8080
CMD ["nginx", "-g", "daemon off;"]
