#!/bin/bash

# 火山云节点容器验证脚本
# 用于验证容器中的火山云节点是否正确部署

set -e

echo "🔍 火山云节点容器验证脚本"
echo "================================"

# 配置变量
CONTAINER_NAME="n8n-volcengine"
N8N_URL="http://localhost:5678"
TIMEOUT=60

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 打印函数
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_info() {
    echo -e "ℹ️  $1"
}

# 检查Docker是否安装
check_docker() {
    print_info "检查Docker环境..."
    
    if ! command -v docker &> /dev/null; then
        print_error "Docker未安装"
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        print_error "Docker服务未运行"
        exit 1
    fi
    
    print_success "Docker环境正常"
}

# 查找n8n容器
find_container() {
    print_info "查找n8n容器..."
    
    # 尝试查找指定名称的容器
    if docker ps --filter "name=$CONTAINER_NAME" --format "{{.Names}}" | grep -q "$CONTAINER_NAME"; then
        FOUND_CONTAINER="$CONTAINER_NAME"
        print_success "找到容器: $FOUND_CONTAINER"
        return 0
    fi
    
    # 查找任何n8n容器
    FOUND_CONTAINER=$(docker ps --filter "ancestor=n8nio/n8n" --format "{{.Names}}" | head -1)
    
    if [ -z "$FOUND_CONTAINER" ]; then
        # 查找自定义镜像的容器
        FOUND_CONTAINER=$(docker ps --filter "ancestor=n8n-volcengine" --format "{{.Names}}" | head -1)
    fi
    
    if [ -z "$FOUND_CONTAINER" ]; then
        print_error "未找到运行中的n8n容器"
        print_info "请先启动n8n容器，例如："
        print_info "docker run -d --name n8n-volcengine -p 5678:5678 n8nio/n8n:latest"
        exit 1
    fi
    
    print_success "找到容器: $FOUND_CONTAINER"
}

# 检查容器状态
check_container_status() {
    print_info "检查容器状态..."
    
    local status=$(docker inspect --format='{{.State.Status}}' "$FOUND_CONTAINER")
    
    if [ "$status" != "running" ]; then
        print_error "容器状态异常: $status"
        exit 1
    fi
    
    print_success "容器运行正常"
}

# 检查n8n服务
check_n8n_service() {
    print_info "检查n8n服务..."
    
    local count=0
    while [ $count -lt $TIMEOUT ]; do
        if curl -s -o /dev/null -w "%{http_code}" "$N8N_URL" | grep -q "200\|401\|302"; then
            print_success "n8n服务正常运行"
            return 0
        fi
        
        print_info "等待n8n服务启动... ($count/$TIMEOUT)"
        sleep 1
        ((count++))
    done
    
    print_error "n8n服务启动超时"
    print_info "请检查容器日志: docker logs $FOUND_CONTAINER"
    exit 1
}

# 检查自定义节点目录
check_custom_nodes() {
    print_info "检查自定义节点目录..."
    
    # 检查自定义节点目录是否存在
    if docker exec "$FOUND_CONTAINER" test -d "/home/node/.n8n/custom"; then
        print_success "自定义节点目录存在"
        
        # 列出自定义节点文件
        print_info "自定义节点文件列表:"
        docker exec "$FOUND_CONTAINER" find /home/node/.n8n/custom -name "*.js" -o -name "*.json" | head -10
    else
        print_warning "自定义节点目录不存在"
        print_info "这可能是正常的，如果使用npm包安装方式"
    fi
}

# 检查火山云节点文件
check_volcengine_files() {
    print_info "检查火山云节点文件..."
    
    local files_found=0
    
    # 检查凭据文件
    if docker exec "$FOUND_CONTAINER" test -f "/home/node/.n8n/custom/credentials/VolcEngineApi.credentials.js" 2>/dev/null; then
        print_success "找到火山云凭据文件"
        ((files_found++))
    elif docker exec "$FOUND_CONTAINER" find /usr/local/lib/node_modules -name "*volcengine*" 2>/dev/null | grep -q .; then
        print_success "找到火山云npm包"
        ((files_found++))
    fi
    
    # 检查节点文件
    if docker exec "$FOUND_CONTAINER" test -f "/home/node/.n8n/custom/nodes/VolcEngine/ECS/VolcEngineEcs.node.js" 2>/dev/null; then
        print_success "找到火山云ECS节点文件"
        ((files_found++))
    elif docker exec "$FOUND_CONTAINER" find /usr/local/lib/node_modules -name "*VolcEngineEcs*" 2>/dev/null | grep -q .; then
        print_success "找到火山云ECS节点包"
        ((files_found++))
    fi
    
    if [ $files_found -eq 0 ]; then
        print_error "未找到火山云节点文件"
        print_info "请确保已正确部署火山云节点"
        return 1
    fi
    
    print_success "火山云节点文件检查通过 ($files_found/2)"
}

# 检查环境变量
check_environment() {
    print_info "检查环境变量..."
    
    # 检查自定义扩展环境变量
    if docker exec "$FOUND_CONTAINER" env | grep -q "N8N_CUSTOM_EXTENSIONS"; then
        local custom_ext=$(docker exec "$FOUND_CONTAINER" env | grep "N8N_CUSTOM_EXTENSIONS" | cut -d'=' -f2)
        print_success "自定义扩展路径: $custom_ext"
    else
        print_warning "未设置N8N_CUSTOM_EXTENSIONS环境变量"
    fi
    
    # 检查其他重要环境变量
    local important_vars=("N8N_HOST" "N8N_PORT" "NODE_ENV")
    for var in "${important_vars[@]}"; do
        if docker exec "$FOUND_CONTAINER" env | grep -q "$var"; then
            local value=$(docker exec "$FOUND_CONTAINER" env | grep "$var" | cut -d'=' -f2)
            print_info "$var: $value"
        fi
    done
}

# 检查日志
check_logs() {
    print_info "检查容器日志..."
    
    # 获取最近的日志
    local logs=$(docker logs --tail 20 "$FOUND_CONTAINER" 2>&1)
    
    # 检查错误信息
    if echo "$logs" | grep -i "error\|failed\|exception" | grep -v "test" | head -3; then
        print_warning "发现错误日志，请检查"
    else
        print_success "日志检查正常"
    fi
    
    # 检查节点加载信息
    if echo "$logs" | grep -i "volcengine\|custom.*node"; then
        print_success "发现火山云节点相关日志"
    fi
}

# 生成报告
generate_report() {
    print_info "生成验证报告..."
    
    echo ""
    echo "================================"
    echo "🔥 火山云节点容器验证报告"
    echo "================================"
    echo "容器名称: $FOUND_CONTAINER"
    echo "n8n地址: $N8N_URL"
    echo "验证时间: $(date)"
    echo ""
    
    # 容器信息
    echo "📋 容器信息:"
    docker inspect --format='镜像: {{.Config.Image}}' "$FOUND_CONTAINER"
    docker inspect --format='状态: {{.State.Status}}' "$FOUND_CONTAINER"
    docker inspect --format='启动时间: {{.State.StartedAt}}' "$FOUND_CONTAINER"
    echo ""
    
    # 端口映射
    echo "🌐 端口映射:"
    docker port "$FOUND_CONTAINER" 2>/dev/null || echo "无端口映射"
    echo ""
    
    # 挂载信息
    echo "💾 挂载信息:"
    docker inspect --format='{{range .Mounts}}{{.Source}} -> {{.Destination}} ({{.Type}}){{"\n"}}{{end}}' "$FOUND_CONTAINER"
    echo ""
    
    echo "✅ 验证完成！"
    echo ""
    echo "📋 下一步操作:"
    echo "1. 访问 $N8N_URL"
    echo "2. 搜索'火山云'或'VolcEngine'节点"
    echo "3. 配置火山云API凭据"
    echo "4. 创建工作流测试功能"
}

# 主函数
main() {
    check_docker
    find_container
    check_container_status
    check_n8n_service
    check_custom_nodes
    check_volcengine_files
    check_environment
    check_logs
    generate_report
}

# 运行主函数
main "$@"
