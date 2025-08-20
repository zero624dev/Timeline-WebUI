# Use Bun official image
FROM oven/bun:latest

WORKDIR /app
# copy package manifest first for caching (if 있음)
COPY package.json ./
# install deps (bun will create bun.lockb inside the image)
RUN bun install

# copy rest of project
COPY . .

# 빌드(필요하면)
# RUN bun run build

# 포트와 실행 커맨드 (환경변수 PORT 사용)
EXPOSE 5000
# start should run at container runtime (CMD), not at build time (RUN)
CMD ["bun", "dist/index.js"]


