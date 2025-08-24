# Use Bun official image
FROM jarredsumner/bun:latest

WORKDIR /app
# copy package manifest first for caching (if 있음)
COPY package.json bun.lockb ./
# install deps
RUN bun install

# copy rest of project
COPY . .

# 빌드(필요하면)
# RUN bun run build

# 포트와 실행 커맨드 (환경변수 PORT 사용)
EXPOSE 5000
RUN bun run start
# CMD ["bun", "server/index.ts"]