# 世说新语 · 魏晋风流人物谱系图 —— Railway / 任意容器平台部署
# 纯静态站点，用轻量 nginx 托管
FROM nginx:alpine

# 只拷贝网页资源（不含 .github / Dockerfile / README）
COPY index.html landscape.html data.js renderer.js style.css /usr/share/nginx/html/
COPY downloads/ /usr/share/nginx/html/downloads/

# 中文文件名不会影响 nginx 静态托管；默认 index.html 即竖版首页
EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
