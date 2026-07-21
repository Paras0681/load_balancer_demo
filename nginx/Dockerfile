FROM nginx:alpine
COPY nginx.conf /etc/nginx/nginx.conf
COPY strategies/ /etc/nginx/strategies_default/
COPY strategies/round_robin.conf /etc/nginx/active_upstream.conf