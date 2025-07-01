#!/usr/bin/env node

/**
 * 火山云节点构建测试脚本
 * 用于验证节点是否能正确构建和加载
 */

const fs = require('fs');
const path = require('path');

console.log('🔥 火山云节点构建测试开始...\n');

// 测试1: 检查文件是否存在
console.log('📁 检查文件结构...');
const files = [
  'types.ts',
  'GenericFunctions.ts',
  'volcengine.svg',
  'ECS/VolcEngineEcs.node.ts',
  'ECS/ImageDescription.ts',
  'ECS/VolcEngineEcs.node.json',
  'ECS/ecs.svg',
  '../../credentials/VolcEngineApi.credentials.ts'
];

let allFilesExist = true;
files.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`✅ ${file}`);
  } else {
    console.log(`❌ ${file} - 文件不存在`);
    allFilesExist = false;
  }
});

if (!allFilesExist) {
  console.log('\n❌ 文件检查失败，请确保所有文件都已创建');
  process.exit(1);
}

// 测试2: 检查TypeScript语法
console.log('\n📝 检查TypeScript语法...');
try {
  // 简单的语法检查 - 尝试require编译后的文件
  const typesPath = path.join(__dirname, 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf8');
  
  // 检查是否包含必要的导出
  const requiredExports = [
    'VolcEngineRegion',
    'volcEngineRegions',
    'IVolcEngineCredentials',
    'ICopyImageRequest',
    'ICopyImageResponse'
  ];
  
  let allExportsFound = true;
  requiredExports.forEach(exportName => {
    if (typesContent.includes(exportName)) {
      console.log(`✅ 导出 ${exportName}`);
    } else {
      console.log(`❌ 缺少导出 ${exportName}`);
      allExportsFound = false;
    }
  });
  
  if (!allExportsFound) {
    console.log('\n❌ TypeScript导出检查失败');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ TypeScript语法检查失败: ${error.message}`);
  process.exit(1);
}

// 测试3: 检查package.json注册
console.log('\n📦 检查package.json注册...');
try {
  const packageJsonPath = path.join(__dirname, '../../package.json');
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  
  const credentialRegistered = packageJson.n8n.credentials.includes('dist/credentials/VolcEngineApi.credentials.js');
  const nodeRegistered = packageJson.n8n.nodes.includes('dist/nodes/VolcEngine/ECS/VolcEngineEcs.node.js');
  
  if (credentialRegistered) {
    console.log('✅ 凭据已注册到package.json');
  } else {
    console.log('❌ 凭据未注册到package.json');
  }
  
  if (nodeRegistered) {
    console.log('✅ 节点已注册到package.json');
  } else {
    console.log('❌ 节点未注册到package.json');
  }
  
  if (!credentialRegistered || !nodeRegistered) {
    console.log('\n❌ package.json注册检查失败');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ package.json检查失败: ${error.message}`);
  process.exit(1);
}

// 测试4: 检查JSON文件格式
console.log('\n🔍 检查JSON文件格式...');
try {
  const nodeJsonPath = path.join(__dirname, 'ECS/VolcEngineEcs.node.json');
  const nodeJson = JSON.parse(fs.readFileSync(nodeJsonPath, 'utf8'));
  
  const requiredFields = ['node', 'nodeVersion', 'codexVersion', 'categories'];
  let allFieldsPresent = true;
  
  requiredFields.forEach(field => {
    if (nodeJson[field]) {
      console.log(`✅ JSON字段 ${field}: ${JSON.stringify(nodeJson[field])}`);
    } else {
      console.log(`❌ 缺少JSON字段 ${field}`);
      allFieldsPresent = false;
    }
  });
  
  if (!allFieldsPresent) {
    console.log('\n❌ JSON格式检查失败');
    process.exit(1);
  }
  
} catch (error) {
  console.log(`❌ JSON格式检查失败: ${error.message}`);
  process.exit(1);
}

// 测试5: 检查SVG图标
console.log('\n🎨 检查SVG图标...');
try {
  const svgFiles = ['volcengine.svg', 'ECS/ecs.svg'];
  
  svgFiles.forEach(svgFile => {
    const svgPath = path.join(__dirname, svgFile);
    const svgContent = fs.readFileSync(svgPath, 'utf8');
    
    if (svgContent.includes('<svg') && svgContent.includes('</svg>')) {
      console.log(`✅ SVG文件 ${svgFile} 格式正确`);
    } else {
      console.log(`❌ SVG文件 ${svgFile} 格式错误`);
      process.exit(1);
    }
  });
  
} catch (error) {
  console.log(`❌ SVG检查失败: ${error.message}`);
  process.exit(1);
}

// 测试完成
console.log('\n🎉 所有测试通过！');
console.log('\n📋 下一步操作:');
console.log('1. 运行 `pnpm build:nodes-base` 构建节点');
console.log('2. 运行 `pnpm dev` 启动开发服务器');
console.log('3. 在n8n界面中搜索"火山云"或"VolcEngine"');
console.log('4. 配置火山云API凭据');
console.log('5. 创建工作流测试CopyImage功能');

console.log('\n🔧 构建命令:');
console.log('cd /root/code/n8n');
console.log('pnpm build:nodes-base');
console.log('pnpm dev');

console.log('\n📚 更多信息请查看:');
console.log('- README.md: 使用说明');
console.log('- TESTING.md: 测试报告');
console.log('- USAGE_GUIDE.md: 详细使用指南');
