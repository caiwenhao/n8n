# 🐳 火山云节点容器部署指南

## 🚀 快速开始

### 方法一：一键部署脚本（推荐）

```bash
# 下载并运行部署脚本
chmod +x deploy-container.sh
./deploy-container.sh
```

### 方法二：Docker Compose部署

```bash
# 1. 准备节点文件
mkdir volcengine-nodes
# 复制构建好的节点文件到 volcengine-nodes/ 目录

# 2. 启动服务
docker-compose -f docker-compose.volcengine.yml up -d

# 3. 访问n8n
# 地址：http://localhost:5678
# 用户名：admin
# 密码：volcengine123
```

## 📋 详细部署步骤

### 步骤1：准备节点文件

首先需要构建火山云节点包：

```bash
# 在开发环境中构建节点
cd /root/code/n8n
pnpm build:nodes-base

# 创建节点包目录
mkdir -p volcengine-nodes/nodes/VolcEngine/ECS
mkdir -p volcengine-nodes/credentials

# 复制构建好的文件
cp packages/nodes-base/dist/nodes/VolcEngine/ECS/* volcengine-nodes/nodes/VolcEngine/ECS/
cp packages/nodes-base/dist/credentials/VolcEngineApi.credentials.js volcengine-nodes/credentials/
cp packages/nodes-base/nodes/VolcEngine/ECS/ecs.svg volcengine-nodes/nodes/VolcEngine/ECS/
cp packages/nodes-base/nodes/VolcEngine/volcengine.svg volcengine-nodes/
```

### 步骤2：选择部署方式

#### 🎯 方式A：自定义Docker镜像

```bash
# 1. 创建Dockerfile
cat > Dockerfile << 'EOF'
FROM n8nio/n8n:latest

USER root

# 复制自定义节点
COPY volcengine-nodes /home/node/.n8n/custom

# 修复权限
RUN chown -R node:node /home/node/.n8n/custom

USER node

# 设置环境变量
ENV N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
EOF

# 2. 构建镜像
docker build -t n8n-volcengine:latest .

# 3. 运行容器
docker run -d \
  --name n8n-volcengine \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8n-volcengine:latest
```

#### 🎯 方式B：Volume挂载

```bash
# 1. 启动n8n容器
docker run -d \
  --name n8n-volcengine \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  -v $(pwd)/volcengine-nodes:/home/node/.n8n/custom:ro \
  -e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom \
  n8nio/n8n:latest

# 2. 检查挂载
docker exec -it n8n-volcengine ls -la /home/node/.n8n/custom
```

#### 🎯 方式C：运行时安装

```bash
# 1. 进入运行中的容器
docker exec -it <existing_container> /bin/sh

# 2. 创建自定义目录
mkdir -p /home/node/.n8n/custom

# 3. 复制节点文件（需要先将文件复制到容器中）
# docker cp volcengine-nodes/ <container_id>:/home/node/.n8n/custom/

# 4. 重启容器
docker restart <container_id>
```

### 步骤3：验证部署

```bash
# 1. 检查容器状态
docker ps | grep n8n

# 2. 查看日志
docker logs n8n-volcengine

# 3. 检查节点文件
docker exec -it n8n-volcengine ls -la /home/node/.n8n/custom

# 4. 访问n8n界面
curl -I http://localhost:5678
```

## 🔧 配置选项

### 环境变量配置

```bash
# 基础配置
-e N8N_BASIC_AUTH_ACTIVE=true
-e N8N_BASIC_AUTH_USER=admin
-e N8N_BASIC_AUTH_PASSWORD=your_password

# 自定义节点配置
-e N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom

# 数据库配置（可选）
-e DB_TYPE=postgresdb
-e DB_POSTGRESDB_HOST=postgres
-e DB_POSTGRESDB_DATABASE=n8n
-e DB_POSTGRESDB_USER=n8n
-e DB_POSTGRESDB_PASSWORD=n8n_password

# 队列配置（可选）
-e QUEUE_BULL_REDIS_HOST=redis
-e EXECUTIONS_PROCESS=queue
```

### Volume挂载配置

```bash
# 数据持久化
-v ~/.n8n:/home/node/.n8n

# 自定义节点
-v $(pwd)/volcengine-nodes:/home/node/.n8n/custom:ro

# 日志文件
-v $(pwd)/logs:/home/node/.n8n/logs

# 工作流备份
-v $(pwd)/workflows:/home/node/.n8n/workflows
```

## 🐛 故障排除

### 问题1：节点不显示

```bash
# 检查文件权限
docker exec -it n8n-volcengine ls -la /home/node/.n8n/custom

# 检查环境变量
docker exec -it n8n-volcengine env | grep N8N_CUSTOM

# 重启容器
docker restart n8n-volcengine
```

### 问题2：权限错误

```bash
# 修复文件权限
sudo chown -R 1000:1000 volcengine-nodes/

# 或者在Dockerfile中修复
RUN chown -R node:node /home/node/.n8n/custom
```

### 问题3：挂载失败

```bash
# 检查SELinux（CentOS/RHEL）
ls -Z volcengine-nodes/

# 添加SELinux标签
sudo chcon -Rt svirt_sandbox_file_t volcengine-nodes/

# 或者禁用SELinux
sudo setenforce 0
```

## 📊 监控和维护

### 健康检查

```bash
# 添加健康检查
--health-cmd="wget --quiet --tries=1 --spider http://localhost:5678/healthz || exit 1" \
--health-interval=30s \
--health-timeout=10s \
--health-retries=3
```

### 日志管理

```bash
# 查看实时日志
docker logs -f n8n-volcengine

# 限制日志大小
--log-opt max-size=10m \
--log-opt max-file=3
```

### 备份和恢复

```bash
# 备份数据
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar czf /backup/n8n-backup.tar.gz /data

# 恢复数据
docker run --rm -v n8n_data:/data -v $(pwd):/backup alpine tar xzf /backup/n8n-backup.tar.gz -C /
```

## 🚀 生产环境建议

1. **使用外部数据库**：PostgreSQL或MySQL
2. **配置Redis队列**：提高性能和可靠性
3. **设置反向代理**：Nginx或Traefik
4. **启用HTTPS**：SSL证书配置
5. **监控告警**：Prometheus + Grafana
6. **定期备份**：数据和配置文件
7. **资源限制**：CPU和内存限制
8. **安全加固**：网络隔离和访问控制

## 📞 技术支持

如果遇到问题：

1. 查看容器日志：`docker logs n8n-volcengine`
2. 检查文件权限和挂载
3. 验证环境变量配置
4. 参考官方文档：https://docs.n8n.io/hosting/
5. 查看详细指南：USAGE_GUIDE.md
