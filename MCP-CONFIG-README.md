# MCP 服务器配置模板

这是一个包含8个常用MCP（Model Context Protocol）服务器的配置模板，适用于Continue IDE扩展。

## 📋 包含的MCP服务器

### 1. Figma AI Bridge
- **功能**: Figma设计工具集成
- **命令**: `figma-developer-mcp`
- **环境变量**: 需要 `FIGMA_API_KEY`

### 2. GitHub
- **功能**: GitHub仓库操作和管理
- **命令**: `@modelcontextprotocol/server-github`
- **环境变量**: 需要 `GITHUB_PERSONAL_ACCESS_TOKEN`

### 3. Git
- **功能**: 本地Git仓库操作
- **命令**: `mcp-server-git`
- **参数**: 需要指定仓库路径

### 4. Docker
- **功能**: Docker容器管理
- **命令**: `docker-mcp`
- **环境变量**: 无需额外配置

### 5. Puppeteer
- **功能**: 浏览器自动化和网页操作
- **命令**: `@modelcontextprotocol/server-puppeteer`
- **环境变量**: 无需额外配置

### 6. mult-fetch-mcp-server
- **功能**: 多种网络请求和数据获取
- **命令**: `@lmcc-dev/mult-fetch-mcp-server`
- **环境变量**: 可选设置 `MCP_LANG`

### 7. hyperbrowser
- **功能**: 高级浏览器操作和自动化
- **命令**: `hyperbrowser-mcp`
- **环境变量**: 需要 `HYPERBROWSER_API_KEY`

### 8. desktop-commander
- **功能**: 桌面应用程序控制
- **命令**: `@wonderwhy-er/desktop-commander`
- **环境变量**: 无需额外配置

## 🚀 使用方法

### 1. 复制配置文件
将 `mcp-config-template.json` 复制到你的Continue配置目录：
```
~/.continue/models/mcp.json  # Linux/Mac
%USERPROFILE%\.continue\models\mcp.json  # Windows
```

### 2. 配置环境变量
根据需要设置以下环境变量：

```bash
# Figma API密钥
export FIGMA_API_KEY="your_figma_api_key_here"

# GitHub个人访问令牌
export GITHUB_PERSONAL_ACCESS_TOKEN="your_github_token_here"

# Hyperbrowser API密钥（如果使用）
export HYPERBROWSER_API_KEY="your_hyperbrowser_api_key_here"
```

### 3. 修改路径配置
在配置文件中，将 `YOUR_REPOSITORY_PATH_HERE` 替换为你的实际仓库路径。

### 4. 重启Continue扩展
修改配置后，重启你的IDE中的Continue扩展以加载新配置。

## 🔐 安全注意事项

⚠️ **重要**: 永远不要将包含真实API密钥的配置文件提交到公共仓库！

- 使用环境变量存储敏感信息
- 将包含真实密钥的文件添加到 `.gitignore`
- 定期轮换API密钥
- 只授予必要的权限

## 📝 获取API密钥

### Figma API密钥
1. 访问 [Figma开发者设置](https://www.figma.com/developers/api#access-tokens)
2. 生成个人访问令牌

### GitHub个人访问令牌
1. 访问 [GitHub设置 > 开发者设置 > 个人访问令牌](https://github.com/settings/tokens)
2. 生成新的经典令牌
3. 选择适当的权限范围

### Hyperbrowser API密钥
请参考Hyperbrowser的官方文档获取API密钥。

## 🛠️ 故障排除

### 常见问题
1. **MCP服务器无法启动**: 检查命令和参数是否正确
2. **权限错误**: 确保API密钥有足够的权限
3. **路径错误**: 验证仓库路径是否存在且可访问

### 调试技巧
- 查看Continue扩展的日志输出
- 逐个启用MCP服务器进行测试
- 验证环境变量是否正确设置

## 📄 许可证

本配置模板基于MIT许可证发布。各个MCP服务器可能有不同的许可证，请查看相应的项目文档。

## 🤝 贡献

欢迎提交问题报告和改进建议！如果你有新的有用MCP服务器推荐，请创建Issue或Pull Request。

---

**最后更新**: 2024年
**兼容性**: Continue IDE扩展
**维护者**: [你的用户名]