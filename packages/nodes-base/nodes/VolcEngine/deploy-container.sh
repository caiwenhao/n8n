#!/bin/bash

# 火山云节点容器部署脚本
# 用于快速部署火山云自定义节点到Docker容器中

set -e

echo "🔥 火山云节点容器部署脚本"
echo "================================"

# 配置变量
PACKAGE_NAME="n8n-nodes-volcengine"
PACKAGE_VERSION="1.0.0"
DOCKER_IMAGE_NAME="n8n-volcengine"
CONTAINER_NAME="n8n-volcengine"
N8N_PORT="5678"

# 检查Docker是否安装
if ! command -v docker &> /dev/null; then
    echo "❌ Docker未安装，请先安装Docker"
    exit 1
fi

echo "✅ Docker已安装"

# 选择部署方式
echo ""
echo "请选择部署方式："
echo "1. 自定义Docker镜像（推荐）"
echo "2. Docker Compose + Volume挂载"
echo "3. 运行时安装到现有容器"
echo ""
read -p "请输入选择 (1-3): " DEPLOY_METHOD

case $DEPLOY_METHOD in
    1)
        echo "🐳 开始创建自定义Docker镜像..."
        deploy_custom_image
        ;;
    2)
        echo "📦 开始Docker Compose部署..."
        deploy_docker_compose
        ;;
    3)
        echo "⚡ 开始运行时安装..."
        deploy_runtime_install
        ;;
    *)
        echo "❌ 无效选择"
        exit 1
        ;;
esac

# 自定义Docker镜像部署
deploy_custom_image() {
    echo "📁 创建节点包目录..."
    
    # 创建临时目录
    TEMP_DIR=$(mktemp -d)
    cd "$TEMP_DIR"
    
    echo "📦 创建package.json..."
    cat > package.json << EOF
{
  "name": "$PACKAGE_NAME",
  "version": "$PACKAGE_VERSION",
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
  "files": ["dist"],
  "devDependencies": {
    "n8n-workflow": "*",
    "typescript": "^4.8.4",
    "copyfiles": "^2.4.1"
  }
}
EOF

    echo "📄 创建tsconfig.json..."
    cat > tsconfig.json << EOF
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

    echo "📂 复制节点文件..."
    mkdir -p nodes/VolcEngine/ECS
    mkdir -p credentials
    
    # 复制文件（需要用户提供源路径）
    echo "请确保以下文件存在于源目录中："
    echo "- /root/code/n8n/packages/nodes-base/nodes/VolcEngine/"
    echo "- /root/code/n8n/packages/nodes-base/credentials/VolcEngineApi.credentials.ts"
    
    if [ -d "/root/code/n8n/packages/nodes-base/nodes/VolcEngine" ]; then
        cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/types.ts nodes/VolcEngine/
        cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/GenericFunctions.ts nodes/VolcEngine/
        cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/volcengine.svg nodes/VolcEngine/
        cp /root/code/n8n/packages/nodes-base/nodes/VolcEngine/ECS/* nodes/VolcEngine/ECS/
        cp /root/code/n8n/packages/nodes-base/credentials/VolcEngineApi.credentials.ts credentials/
        echo "✅ 文件复制完成"
    else
        echo "❌ 源文件不存在，请先确保火山云节点已创建"
        exit 1
    fi
    
    echo "🔨 构建节点包..."
    npm install
    npm run build
    
    echo "🐳 创建Dockerfile..."
    cat > Dockerfile << EOF
FROM n8nio/n8n:latest

USER root

COPY . /tmp/$PACKAGE_NAME

RUN cd /tmp/$PACKAGE_NAME && \\
    npm pack && \\
    npm install -g $PACKAGE_NAME-$PACKAGE_VERSION.tgz && \\
    rm -rf /tmp/$PACKAGE_NAME

USER node

ENV N8N_CUSTOM_EXTENSIONS=/usr/local/lib/node_modules/$PACKAGE_NAME
EOF

    echo "🏗 构建Docker镜像..."
    docker build -t $DOCKER_IMAGE_NAME:latest .
    
    echo "🚀 启动容器..."
    docker run -d \
        --name $CONTAINER_NAME \
        -p $N8N_PORT:5678 \
        -v ~/.n8n:/home/node/.n8n \
        $DOCKER_IMAGE_NAME:latest
    
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://localhost:$N8N_PORT"
    
    # 清理临时目录
    cd /
    rm -rf "$TEMP_DIR"
}

# Docker Compose部署
deploy_docker_compose() {
    echo "📁 创建部署目录..."
    mkdir -p ./n8n-volcengine-deploy
    cd ./n8n-volcengine-deploy
    
    echo "📄 创建docker-compose.yml..."
    cat > docker-compose.yml << EOF
version: '3.8'

services:
  n8n:
    image: n8nio/n8n:latest
    container_name: $CONTAINER_NAME
    restart: unless-stopped
    ports:
      - "$N8N_PORT:5678"
    environment:
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=password
      - N8N_HOST=localhost
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://localhost:$N8N_PORT/
      - N8N_CUSTOM_EXTENSIONS=/home/node/.n8n/custom
    volumes:
      - ~/.n8n:/home/node/.n8n
      - ./custom-nodes:/home/node/.n8n/custom
    command: n8n start
EOF

    echo "📂 准备自定义节点..."
    mkdir -p ./custom-nodes
    
    # 这里需要用户手动复制构建好的文件
    echo "⚠️  请手动复制构建好的节点文件到 ./custom-nodes/ 目录"
    echo "或者运行以下命令（如果源文件存在）："
    echo "cp -r /path/to/built/nodes/* ./custom-nodes/"
    
    echo "🚀 启动服务..."
    docker-compose up -d
    
    echo "✅ 部署完成！"
    echo "🌐 访问地址: http://localhost:$N8N_PORT"
    echo "👤 用户名: admin"
    echo "🔑 密码: password"
}

# 运行时安装
deploy_runtime_install() {
    echo "🔍 查找运行中的n8n容器..."
    
    EXISTING_CONTAINER=$(docker ps --filter "ancestor=n8nio/n8n" --format "{{.Names}}" | head -1)
    
    if [ -z "$EXISTING_CONTAINER" ]; then
        echo "❌ 未找到运行中的n8n容器"
        echo "请先启动一个n8n容器，例如："
        echo "docker run -d --name n8n -p 5678:5678 n8nio/n8n:latest"
        exit 1
    fi
    
    echo "✅ 找到容器: $EXISTING_CONTAINER"
    
    echo "📦 在容器中安装节点包..."
    # 这里需要先将包发布到npm或者复制到容器中
    echo "⚠️  此方法需要节点包已发布到npm"
    echo "或者手动将包文件复制到容器中"
    
    # 示例安装命令
    docker exec -it "$EXISTING_CONTAINER" sh -c "npm install -g $PACKAGE_NAME"
    
    echo "🔄 重启容器..."
    docker restart "$EXISTING_CONTAINER"
    
    echo "✅ 安装完成！"
}

echo ""
echo "🎉 部署脚本执行完成！"
echo ""
echo "📋 后续步骤："
echo "1. 访问 n8n 界面"
echo "2. 搜索'火山云'或'VolcEngine'节点"
echo "3. 配置火山云API凭据"
echo "4. 创建工作流测试功能"
echo ""
echo "📚 更多信息请查看 USAGE_GUIDE.md"
