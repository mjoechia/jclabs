FROM nginx:alpine
COPY . /usr/share/nginx/html
RUN sed -i 's/listen       80;/listen       80;\n    client_max_body_size 100M;/' /etc/nginx/conf.d/default.conf && \
    sed -i 's|root   /usr/share/nginx/html;|root   /usr/share/nginx/html;\n    try_files $uri $uri/ /index.html;|' /etc/nginx/conf.d/default.conf
CMD ["nginx", "-g", "daemon off;"]
