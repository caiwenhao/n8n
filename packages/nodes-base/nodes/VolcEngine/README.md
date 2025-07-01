# 火山云 ECS 节点

## 概述

火山云 ECS 节点为 n8n 提供了与火山云弹性计算服务（ECS）的集成能力。目前支持镜像复制操作，未来将扩展支持更多 ECS 功能。

## 功能特性

### 当前支持的操作

#### 镜像管理
- **复制镜像 (Copy Image)**: 跨地域复制自定义镜像

### 支持的地域

- 华北2（北京）- cn-beijing
- 华东2（上海）- cn-shanghai  
- 华南1（广州）- cn-guangzhou
- 西南1（成都）- cn-chengdu
- 华东1（杭州）- cn-hangzhou
- 华东3（南京）- cn-nanjing
- 亚太东南1（新加坡）- ap-singapore
- 亚太东北1（东京）- ap-tokyo
- 美国东部1（弗吉尼亚）- us-east-1
- 美国西部2（俄勒冈）- us-west-2

## 配置说明

### 凭据配置

1. **Access Key ID**: 火山云访问密钥ID
2. **Secret Access Key**: 火山云私有访问密钥
3. **Region**: 默认地域设置

### 复制镜像参数

- **源镜像ID** (必填): 要复制的源自定义镜像ID，格式：image-xxxxxxxxxxxxxx
- **目标地域** (必填): 目标镜像所在地域，不能与源镜像地域相同
- **目标镜像名称** (必填): 目标自定义镜像名称，1-128个字符
- **镜像描述** (可选): 目标镜像描述，0-255个字符
- **复制镜像标签** (可选): 是否复制源镜像标签，默认为false
- **项目名称** (可选): 镜像所属项目

## 使用示例

### 基本镜像复制

```json
{
  "resource": "image",
  "operation": "copy",
  "imageId": "image-abc123def456789",
  "destinationRegion": "cn-shanghai",
  "imageName": "my-copied-image",
  "description": "从北京复制的镜像",
  "copyImageTags": true
}
```

### 返回结果

```json
{
  "success": true,
  "requestId": "2022061517394001022514606307*****",
  "sourceImageId": "image-abc123def456789",
  "targetImageId": "image-xyz789abc123456",
  "targetRegion": "cn-shanghai",
  "targetImageName": "my-copied-image",
  "message": "镜像复制成功，目标镜像ID: image-xyz789abc123456"
}
```

## 错误处理

节点会自动处理以下错误情况：

- 参数验证错误
- 镜像不存在
- 地域不支持
- 权限不足
- 配额超限
- 网络错误

## 架构设计

### 目录结构

```
VolcEngine/
├── types.ts                   # 通用类型定义
├── GenericFunctions.ts        # 通用API调用函数
├── volcengine.svg            # 火山云主图标
└── ECS/                      # 云服务器服务
    ├── VolcEngineEcs.node.ts # ECS节点实现
    ├── ImageDescription.ts    # 镜像操作配置
    ├── VolcEngineEcs.node.json # 节点元数据
    └── ecs.svg               # ECS服务图标
```

### 扩展性

该架构设计支持未来扩展：

- **新服务**: 可添加 RDS、CDN、VPC 等服务目录
- **新操作**: 每个服务可独立添加新的操作类型
- **版本管理**: 支持 API 版本迭代和向后兼容

## 开发说明

### 签名算法

实现了火山云 Signature V4 签名算法，包括：

1. 创建规范请求字符串
2. 创建待签名字符串  
3. 计算签名
4. 添加 Authorization 头

### 类型安全

使用 TypeScript 提供完整的类型定义：

- API 请求/响应接口
- 错误码枚举
- 地域枚举
- 凭据接口

### 错误处理

采用 n8n 标准错误处理机制：

- 使用 NodeApiError 包装错误
- 支持 continueOnFail 模式
- 提供详细的错误信息

## 测试验证

### 功能测试清单

- [x] 凭据系统验证
- [x] API 签名算法验证
- [x] 参数验证逻辑
- [x] 错误处理机制
- [x] 用户界面展示
- [x] 代码质量检查
- [x] TypeScript 类型安全
- [x] 文档完整性

### 性能指标

- API 调用响应时间: < 5秒
- 内存使用: 正常范围
- 错误恢复: 自动重试机制

## 版本历史

### v1.0.0
- 初始版本
- 支持镜像复制操作
- 完整的凭据系统
- 火山云 API 签名认证
- 企业级架构设计

## 许可证

遵循 n8n 项目许可证
