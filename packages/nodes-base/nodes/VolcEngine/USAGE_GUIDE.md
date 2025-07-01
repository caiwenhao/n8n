# 🚀 火山云节点使用和验证指南

## 📋 目录
1. [节点注册和加载](#节点注册和加载)
2. [开发环境验证](#开发环境验证)
3. [生产环境部署](#生产环境部署)
4. [功能测试验证](#功能测试验证)
5. [常见问题排查](#常见问题排查)

## 🔧 节点注册和加载

### 第一步：注册节点到package.json

需要将我们的节点添加到 `packages/nodes-base/package.json` 的 `n8n` 配置中：

```json
{
  "n8n": {
    "credentials": [
      // ... 其他凭据
      "dist/credentials/VolcEngineApi.credentials.js"
    ],
    "nodes": [
      // ... 其他节点
      "dist/nodes/VolcEngine/ECS/VolcEngineEcs.node.js"
    ]
  }
}
```

### 第二步：构建节点

```bash
# 在项目根目录执行
cd /root/code/n8n

# 构建nodes-base包
pnpm build:nodes-base

# 或者只构建我们的节点
pnpm --filter n8n-nodes-base build
```

## 🛠 开发环境验证

### 方法一：使用n8n-node-dev工具（推荐）

```bash
# 安装n8n-node-dev
npm install -g n8n-node-dev

# 在VolcEngine目录中构建和监听
cd packages/nodes-base/nodes/VolcEngine
n8n-node-dev build --watch

# 启动n8n开发服务器
cd /root/code/n8n
pnpm dev
```

### 方法二：直接构建和启动

```bash
# 构建整个项目
cd /root/code/n8n
pnpm build

# 启动n8n
pnpm start
```

### 验证节点是否加载成功

1. **检查控制台日志**：
```bash
# 查看n8n启动日志，应该看到类似信息：
# "Loaded all credentials and nodes from n8n-nodes-base"
# "credentials: XXX, nodes: XXX"
```

2. **检查节点列表**：
```bash
# 在n8n界面中，点击"+"添加节点
# 搜索"火山云"或"VolcEngine"
# 应该能看到"火山云 ECS"节点
```

## 🌐 生产环境部署

### 🐳 容器部署方案（推荐）

#### 方法一：自定义Docker镜像

1. **创建自定义节点包**：
```bash
# 创建节点包目录
mkdir n8n-nodes-volcengine
cd n8n-nodes-volcengine

# 创建package.json
cat > package.json << 'EOF'
{
  "name": "n8n-nodes-volcengine",
  "version": "1.0.0",
  "description": "n8n nodes for VolcEngine services",
  "main": "index.js",
  "keywords": ["n8n-community-node-package"],
  "license": "MIT",
  "n8n": {
    "n8nNodesApiVersion": 1,
    "credentials": [
      "dist/credentials/VolcEngineApi.credentials.js"
    ],
    "nodes": [
      "dist/nodes/VolcEngine/ECS/VolcEngineEcs.node.js"
    ]
  },
  "scripts": {
    "build": "tsc && npm run copy:icons",
    "copy:icons": "copyfiles -u 1 \"nodes/**/*.{png,svg}\" dist/"
  },
  "files": [
    "dist"
  ],
  "devDependencies": {
    "n8n-workflow": "*",
    "typescript": "^4.8.4",
    "copyfiles": "^2.4.1"
  }
}
EOF
```

2. **复制节点文件**：
```bash
# 创建目录结构
mkdir -p nodes/VolcEngine/ECS
mkdir -p credentials

# 复制文件（从你的开发环境）
cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/types.ts nodes/VolcEngine/
cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/GenericFunctions.ts nodes/VolcEngine/
cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/volcengine.svg nodes/VolcEngine/
cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/ECS/* nodes/VolcEngine/ECS/
cp /root/code/n8n/packages/nodes-base/credentials/VolcEngineApi.credentials.ts credentials/

# 创建tsconfig.json
cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "module": "commonjs",
    "target": "es2019",
    "lib": ["es2019"],
    "declaration": true,
    "outDir": "./dist",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["nodes/**/*", "credentials/**/*"],
  "exclude": ["dist/**/*", "node_modules/**/*"]
}
EOF

# 构建包
npm install
npm run build
```

3. **创建自定义Dockerfile**：
```dockerfile
# Dockerfile
FROM n8nio/n8n:latest

# 切换到root用户安装包
USER root

# 复制自定义节点包
COPY n8n-nodes-volcengine /tmp/n8n-nodes-volcengine

# 安装自定义节点
RUN cd /tmp/n8n-nodes-volcengine && \
    npm pack && \
    npm install -g n8n-nodes-volcengine-1.0.0.tgz && \
    rm -rf /tmp/n8n-nodes-volcengine

# 切换回n8n用户
USER node

# 设置环境变量（可选）
ENV N8N_CUSTOM_EXTENSIONS=/usr/local/lib/node_modules/n8n-nodes-volcengine
```

4. **构建和运行自定义镜像**：
```bash
# 构建镜像
docker build -t n8n-volcengine:latest .

# 运行容器
docker run -it --rm \
  --name n8n-volcengine \
  -p 5678:5678 \
  -v ~/.n8n:/home/node/.n8n \
  n8n-volcengine:latest
```

#### 方法二：Docker Compose + Volume挂载

1. **创建docker-compose.yml**：
```yaml
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: n8n-volcengine
    restart: unless-stopped
    ports:
      - "5678:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:5678/
      # 启用自定义节点
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./custom-nodes:/home/node/.n8n/custom
    command: n8n start
```

2. **准备自定义节点目录**：
```bash
# 创建自定义节点目录
mkdir -p ./custom-nodes

# 复制构建好的节点文件
cp -r n8n-nodes-volcengine/dist/* ./custom-nodes/

# 启动服务
docker-compose up -d
```

#### 方法三：运行时安装（推荐用于测试）

1. **进入运行中的容器**：
```bash
# 找到容器ID
docker ps | grep n8n

# 进入容器
docker exec -it <container_id> /bin/sh
```

2. **在容器内安装节点包**：
```bash
# 切换到root用户（如果需要）
# 安装自定义节点包
npm install -g n8n-nodes-volcengine

# 重启n8n服务
# 退出容器，重启容器
exit
docker restart <container_id>
```

### 🏢 传统部署方案

#### 方法一：修改源码部署

1. **更新package.json**：
```bash
# 编辑 packages/nodes-base/package.json
# 添加我们的凭据和节点路径
```

2. **重新构建和部署**：
```bash
pnpm build
pnpm start
```

#### 方法二：npm包安装

```bash
# 发布到npm（如果是公开包）
npm publish n8n-nodes-volcengine

# 在n8n实例中安装
npm install -g n8n-nodes-volcengine
```

## ✅ 功能测试验证

### 第一步：配置凭据

1. **获取火山云凭据**：
   - 登录火山云控制台
   - 进入"访问控制" > "访问密钥"
   - 创建或获取AccessKeyId和SecretAccessKey

2. **在n8n中配置凭据**：
   - 点击"凭据" > "添加凭据"
   - 选择"火山云 API"
   - 填入AccessKeyId、SecretAccessKey和Region

### 第二步：创建测试工作流

```json
{
  "name": "火山云镜像复制测试",
  "nodes": [
    {
      "parameters": {},
      "name": "开始",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [240, 300]
    },
    {
      "parameters": {
        "resource": "image",
        "operation": "copy",
        "imageId": "image-abc123def456789",
        "destinationRegion": "cn-shanghai",
        "imageName": "test-copied-image",
        "description": "测试复制的镜像",
        "copyImageTags": true
      },
      "name": "火山云 ECS",
      "type": "n8n-nodes-base.volcEngineEcs",
      "credentials": {
        "volcEngineApi": "your-credential-id"
      },
      "position": [460, 300]
    }
  ],
  "connections": {
    "开始": {
      "main": [
        [
          {
            "node": "火山云 ECS",
            "type": "main",
            "index": 0
          }
        ]
      ]
    }
  }
}
```

### 第三步：执行测试

1. **基本功能测试**：
   - 手动触发工作流
   - 检查执行结果
   - 验证返回数据格式

2. **参数验证测试**：
   - 测试无效的镜像ID格式
   - 测试相同源和目标地域
   - 测试超长的镜像名称

3. **错误处理测试**：
   - 使用无效凭据
   - 使用不存在的镜像ID
   - 测试网络超时情况

## 🔍 验证检查清单

### ✅ 节点加载验证
- [ ] 节点出现在n8n节点列表中
- [ ] 节点图标正确显示
- [ ] 节点描述信息完整

### ✅ 凭据系统验证
- [ ] 凭据类型正确注册
- [ ] 凭据字段显示正常
- [ ] 凭据验证功能工作

### ✅ 用户界面验证
- [ ] 参数字段正确显示
- [ ] 下拉选项列表完整
- [ ] 参数验证规则生效
- [ ] 错误提示信息清晰

### ✅ 功能逻辑验证
- [ ] API调用成功执行
- [ ] 返回数据格式正确
- [ ] 错误处理机制正常
- [ ] 日志记录完整

## 🐛 常见问题排查

### 🐳 容器环境问题排查

#### 问题1：容器中节点不显示

**可能原因**：
- 自定义节点包未正确安装
- 环境变量配置错误
- 权限问题

**解决方案**：
```bash
# 检查容器中的节点安装
docker exec -it <container_id> /bin/sh
ls -la /usr/local/lib/node_modules/ | grep volcengine

# 检查n8n日志
docker logs <container_id> | grep -i volcengine

# 检查环境变量
docker exec -it <container_id> env | grep N8N

# 重启容器
docker restart <container_id>
```

#### 问题2：自定义镜像构建失败

**可能原因**：
- Dockerfile语法错误
- 文件路径问题
- 权限问题

**解决方案**：
```bash
# 检查构建日志
docker build -t n8n-volcengine:latest . --no-cache

# 分步骤构建验证
docker run -it --rm n8nio/n8n:latest /bin/sh

# 手动测试安装步骤
```

#### 问题3：Volume挂载问题

**可能原因**：
- 挂载路径错误
- 文件权限问题
- SELinux限制

**解决方案**：
```bash
# 检查挂载点
docker exec -it <container_id> ls -la /home/node/.n8n/custom

# 修复权限
sudo chown -R 1000:1000 ./custom-nodes

# 检查SELinux（如果适用）
ls -Z ./custom-nodes
```

### 🖥 传统环境问题排查

#### 问题1：节点不显示在列表中

**可能原因**：
- package.json未正确配置
- 构建失败
- 文件路径错误

**解决方案**：
```bash
# 检查构建日志
pnpm build:nodes-base 2>&1 | grep -i error

# 检查文件是否存在
ls -la packages/nodes-base/dist/nodes/VolcEngine/ECS/
ls -la packages/nodes-base/dist/credentials/

# 重新构建
pnpm clean && pnpm build
```

### 问题2：凭据验证失败

**可能原因**：
- 签名算法错误
- 时间戳格式问题
- 网络连接问题

**解决方案**：
```bash
# 检查网络连接
curl -I https://open.volcengineapi.com

# 检查时间同步
date

# 启用调试日志
DEBUG=* pnpm start
```

### 问题3：API调用失败

**可能原因**：
- 参数格式错误
- 权限不足
- 地域限制

**解决方案**：
```bash
# 检查API文档
# 验证参数格式
# 确认账户权限
# 测试不同地域
```

## 📊 性能监控

### 监控指标

1. **响应时间**：API调用应在5秒内完成
2. **成功率**：正常情况下应达到99%以上
3. **错误率**：网络错误应有重试机制
4. **内存使用**：节点执行不应导致内存泄漏

### 监控方法

```bash
# 查看n8n进程状态
ps aux | grep n8n

# 监控内存使用
top -p $(pgrep -f n8n)

# 查看API调用日志
tail -f ~/.n8n/logs/n8n.log | grep volcengine
```

## 🎯 最佳实践

1. **开发环境**：使用watch模式进行实时开发
2. **测试环境**：创建完整的测试用例覆盖所有场景
3. **生产环境**：使用独立的节点包进行部署
4. **监控告警**：设置API调用失败的告警机制
5. **文档维护**：及时更新使用文档和API变更

## 📞 技术支持

如果遇到问题，可以：
1. 查看详细的错误日志
2. 参考火山云API官方文档
3. 检查网络连接和权限配置
4. 验证参数格式和取值范围
