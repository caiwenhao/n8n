# 📦 火山云节点npm发布指南

## 🎯 概述

将火山云节点发布到npm是最佳的分发方式，用户可以通过n8n的社区节点功能直接安装，或者在Docker容器中通过npm命令安装。

## 🚀 快速发布

### 一键发布脚本

```bash
cd npm-package
./publish-npm.sh
```

## 📋 详细发布步骤

### 第一步：准备npm账户

1. **注册npm账户**：
   ```bash
   # 访问 https://www.npmjs.com/ 注册账户
   ```

2. **登录npm**：
   ```bash
   npm login
   # 输入用户名、密码和邮箱
   ```

3. **验证登录**：
   ```bash
   npm whoami
   # 应该显示你的用户名
   ```

### 第二步：准备包文件

1. **进入npm包目录**：
   ```bash
   cd /root/code/n8n/packages/nodes-base/nodes/VolcEngine/npm-package
   ```

2. **复制源文件**：
   ```bash
   # 创建目录结构
   mkdir -p nodes/VolcEngine/ECS
   mkdir -p credentials

   # 复制节点文件
   cp ../types.ts nodes/VolcEngine/
   cp ../GenericFunctions.ts nodes/VolcEngine/
   cp ../volcengine.svg nodes/VolcEngine/
   cp ../ECS/* nodes/VolcEngine/ECS/

   # 复制凭据文件
   cp ../../../credentials/VolcEngineApi.credentials.ts credentials/
   ```

3. **安装依赖**：
   ```bash
   npm install
   ```

### 第三步：构建和测试

1. **运行代码检查**：
   ```bash
   npm run lint
   ```

2. **构建包**：
   ```bash
   npm run build
   ```

3. **验证构建输出**：
   ```bash
   ls -la dist/
   # 应该看到编译后的.js文件
   ```

4. **测试包内容**：
   ```bash
   npm pack --dry-run
   # 查看将要发布的文件列表
   ```

### 第四步：更新版本和信息

1. **更新package.json**：
   ```json
   {
     "name": "n8n-nodes-volcengine",
     "version": "1.0.0",  // 更新版本号
     "description": "n8n community nodes for VolcEngine services",
     "homepage": "https://github.com/your-username/n8n-nodes-volcengine",
     "repository": {
       "type": "git",
       "url": "git+https://github.com/your-username/n8n-nodes-volcengine.git"
     },
     "author": {
       "name": "Your Name",
       "email": "your.email@example.com"
     }
   }
   ```

2. **更新README.md**：
   - 确保安装说明正确
   - 添加使用示例
   - 更新GitHub链接

### 第五步：发布到npm

1. **最终检查**：
   ```bash
   npm run prepublishOnly
   # 这会运行构建和代码检查
   ```

2. **发布包**：
   ```bash
   npm publish --access public
   ```

3. **验证发布**：
   ```bash
   npm view n8n-nodes-volcengine
   # 查看发布的包信息
   ```

## 🔧 配置说明

### package.json关键配置

```json
{
  "keywords": [
    "n8n-community-node-package",  // 必须包含这个关键字
    "n8n",
    "volcengine",
    "火山云"
  ],
  "n8n": {
    "n8nNodesApiVersion": 1,       // n8n API版本
    "credentials": [               // 凭据文件路径
      "dist/credentials/VolcEngineApi.credentials.js"
    ],
    "nodes": [                     // 节点文件路径
      "dist/nodes/VolcEngine/ECS/VolcEngineEcs.node.js"
    ]
  },
  "files": [                       // 发布时包含的文件
    "dist",
    "README.md",
    "LICENSE"
  ],
  "publishConfig": {
    "access": "public"             // 公开发布
  }
}
```

### 版本管理

```bash
# 补丁版本（bug修复）
npm version patch

# 次要版本（新功能）
npm version minor

# 主要版本（破坏性更改）
npm version major

# 预发布版本
npm version prerelease --preid=beta
```

## 🐳 容器中使用npm包

### 方法一：Dockerfile安装

```dockerfile
FROM n8nio/n8n:latest

USER root

# 安装火山云节点包
RUN cd /usr/local/lib/node_modules/n8n && \
    npm install n8n-nodes-volcengine

USER node
```

### 方法二：Docker Compose

```yaml
version: '3.8'
services:
  n8n:
    image: n8nio/n8n:latest
    environment:
      - N8N_CUSTOM_EXTENSIONS=/usr/local/lib/node_modules/n8n-nodes-volcengine
    volumes:
      - n8n_data:/home/node/.n8n
    command: >
      sh -c "
        npm install -g n8n-nodes-volcengine &&
        n8n start
      "
```

### 方法三：运行时安装

```bash
# 进入运行中的容器
docker exec -it n8n-container /bin/sh

# 安装包
npm install -g n8n-nodes-volcengine

# 重启容器
docker restart n8n-container
```

## 📊 发布后验证

### 1. npm包验证

```bash
# 检查包信息
npm view n8n-nodes-volcengine

# 检查包文件
npm view n8n-nodes-volcengine files

# 检查依赖
npm view n8n-nodes-volcengine dependencies
```

### 2. n8n中验证

1. **社区节点安装**：
   - 进入 Settings > Community Nodes
   - 点击 Install
   - 输入 `n8n-nodes-volcengine`
   - 点击 Install

2. **验证节点加载**：
   - 搜索"火山云"或"VolcEngine"
   - 应该能看到"火山云 ECS"节点

3. **功能测试**：
   - 配置火山云API凭据
   - 创建工作流测试CopyImage功能

## 🔄 更新发布

### 发布新版本

1. **更新代码**：
   ```bash
   # 修改源代码
   # 更新版本号
   npm version patch
   ```

2. **重新发布**：
   ```bash
   npm run build
   npm publish
   ```

3. **通知用户**：
   - 更新GitHub Release
   - 发布更新说明
   - 通知社区

### 撤销发布（24小时内）

```bash
# 撤销特定版本
npm unpublish n8n-nodes-volcengine@1.0.0

# 撤销整个包（谨慎使用）
npm unpublish n8n-nodes-volcengine --force
```

## 📈 推广和维护

### 1. 文档完善

- 详细的README文档
- 使用示例和教程
- API文档链接
- 故障排除指南

### 2. 社区推广

- 在n8n社区论坛发布
- 创建GitHub仓库
- 编写博客文章
- 制作演示视频

### 3. 持续维护

- 定期更新依赖
- 修复bug和安全问题
- 添加新功能
- 响应用户反馈

## 🆘 常见问题

### 问题1：发布权限错误

```bash
# 确保已登录
npm whoami

# 检查包名是否被占用
npm view n8n-nodes-volcengine

# 使用scoped包名
npm publish @your-username/n8n-nodes-volcengine
```

### 问题2：构建失败

```bash
# 检查TypeScript错误
npm run build

# 检查依赖
npm install

# 清理缓存
npm cache clean --force
```

### 问题3：n8n中不显示

```bash
# 检查package.json中的n8n配置
# 确保包含 "n8n-community-node-package" 关键字
# 验证文件路径正确
```

## 📞 技术支持

- [npm官方文档](https://docs.npmjs.com/)
- [n8n社区节点文档](https://docs.n8n.io/integrations/community-nodes/)
- [GitHub Issues](https://github.com/your-username/n8n-nodes-volcengine/issues)

---

**注意**：发布到npm后，包将公开可用，请确保代码质量和安全性。
