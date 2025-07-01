#!/bin/bash

# npm发布脚本 - 火山云节点包
# 用于自动化发布流程

set -e

echo "📦 n8n-nodes-volcengine npm发布脚本"
echo "=================================="

# 配置变量
PACKAGE_NAME="n8n-nodes-volcengine"
CURRENT_VERSION=$(node -p "require('./package.json').version")
NPM_REGISTRY="https://registry.npmjs.org/"

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# 检查环境
check_environment() {
    print_info "检查发布环境..."
    
    # 检查Node.js版本
    if ! command -v node &> /dev/null; then
        print_error "Node.js未安装"
        exit 1
    fi
    
    local node_version=$(node --version | cut -d'v' -f2)
    print_info "Node.js版本: $node_version"
    
    # 检查npm
    if ! command -v npm &> /dev/null; then
        print_error "npm未安装"
        exit 1
    fi
    
    local npm_version=$(npm --version)
    print_info "npm版本: $npm_version"
    
    # 检查npm登录状态
    if ! npm whoami &> /dev/null; then
        print_error "未登录npm，请先运行: npm login"
        exit 1
    fi
    
    local npm_user=$(npm whoami)
    print_success "npm用户: $npm_user"
}

# 检查包是否已存在
check_package_exists() {
    print_info "检查包是否已存在..."
    
    if npm view $PACKAGE_NAME@$CURRENT_VERSION &> /dev/null; then
        print_error "版本 $CURRENT_VERSION 已存在于npm"
        print_info "请更新package.json中的版本号"
        exit 1
    fi
    
    print_success "版本 $CURRENT_VERSION 可以发布"
}

# 复制源文件
copy_source_files() {
    print_info "复制源文件..."
    
    # 创建目录结构
    mkdir -p nodes/VolcEngine/ECS
    mkdir -p credentials
    
    # 复制文件
    local source_dir="../"
    
    if [ ! -d "$source_dir" ]; then
        print_error "源文件目录不存在: $source_dir"
        exit 1
    fi
    
    # 复制节点文件
    cp "$source_dir/types.ts" nodes/VolcEngine/
    cp "$source_dir/GenericFunctions.ts" nodes/VolcEngine/
    cp "$source_dir/volcengine.svg" nodes/VolcEngine/
    cp "$source_dir/ECS/"* nodes/VolcEngine/ECS/
    
    # 复制凭据文件
    cp "$source_dir/../../credentials/VolcEngineApi.credentials.ts" credentials/
    
    print_success "源文件复制完成"
}

# 运行测试
run_tests() {
    print_info "运行测试..."
    
    # 安装依赖
    npm install
    
    # 运行linting
    if npm run lint; then
        print_success "代码检查通过"
    else
        print_error "代码检查失败"
        exit 1
    fi
    
    # 运行构建
    if npm run build; then
        print_success "构建成功"
    else
        print_error "构建失败"
        exit 1
    fi
    
    # 检查构建输出
    if [ ! -d "dist" ]; then
        print_error "构建输出目录不存在"
        exit 1
    fi
    
    print_success "所有测试通过"
}

# 生成发布信息
generate_release_info() {
    print_info "生成发布信息..."
    
    echo ""
    echo "📋 发布信息"
    echo "============"
    echo "包名: $PACKAGE_NAME"
    echo "版本: $CURRENT_VERSION"
    echo "注册表: $NPM_REGISTRY"
    echo "发布时间: $(date)"
    echo ""
    
    # 显示包内容
    echo "📁 包内容:"
    npm pack --dry-run | grep -E "^\s*[0-9]" | head -20
    echo ""
}

# 确认发布
confirm_publish() {
    print_warning "即将发布到npm"
    echo ""
    read -p "确认发布 $PACKAGE_NAME@$CURRENT_VERSION 吗? (y/N): " confirm
    
    if [[ ! $confirm =~ ^[Yy]$ ]]; then
        print_info "发布已取消"
        exit 0
    fi
}

# 发布到npm
publish_to_npm() {
    print_info "发布到npm..."
    
    # 发布包
    if npm publish --access public; then
        print_success "发布成功！"
    else
        print_error "发布失败"
        exit 1
    fi
    
    # 验证发布
    sleep 5
    if npm view $PACKAGE_NAME@$CURRENT_VERSION &> /dev/null; then
        print_success "发布验证成功"
    else
        print_warning "发布验证失败，可能需要等待几分钟"
    fi
}

# 生成安装说明
generate_install_instructions() {
    print_info "生成安装说明..."
    
    echo ""
    echo "🎉 发布完成！"
    echo "=============="
    echo ""
    echo "📦 npm包信息:"
    echo "   包名: $PACKAGE_NAME"
    echo "   版本: $CURRENT_VERSION"
    echo "   链接: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo ""
    echo "🚀 安装方法:"
    echo ""
    echo "1. 社区节点安装（推荐）:"
    echo "   - 在n8n中进入 Settings > Community Nodes"
    echo "   - 点击 Install"
    echo "   - 输入包名: $PACKAGE_NAME"
    echo "   - 点击 Install"
    echo ""
    echo "2. 手动安装:"
    echo "   npm install $PACKAGE_NAME"
    echo ""
    echo "3. Docker安装:"
    echo "   RUN cd /usr/local/lib/node_modules/n8n && npm install $PACKAGE_NAME"
    echo ""
    echo "📚 使用说明:"
    echo "   - 在n8n中搜索'火山云'或'VolcEngine'"
    echo "   - 配置火山云API凭据"
    echo "   - 开始使用ECS镜像复制功能"
    echo ""
    echo "🔗 相关链接:"
    echo "   - npm包: https://www.npmjs.com/package/$PACKAGE_NAME"
    echo "   - GitHub: https://github.com/your-username/n8n-nodes-volcengine"
    echo "   - 文档: https://github.com/your-username/n8n-nodes-volcengine#readme"
}

# 清理临时文件
cleanup() {
    print_info "清理临时文件..."
    
    # 保留重要文件，清理其他
    if [ -d "node_modules" ]; then
        rm -rf node_modules
    fi
    
    print_success "清理完成"
}

# 主函数
main() {
    echo "开始发布流程..."
    echo ""
    
    check_environment
    check_package_exists
    copy_source_files
    run_tests
    generate_release_info
    confirm_publish
    publish_to_npm
    generate_install_instructions
    cleanup
    
    echo ""
    print_success "🎉 npm发布流程完成！"
}

# 错误处理
trap 'print_error "发布过程中出现错误"; cleanup; exit 1' ERR

# 运行主函数
main "$@"
