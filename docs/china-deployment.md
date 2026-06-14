# 村超 H5 国内访问部署方案

## 目标

让测试用户在中国大陆不依赖 VPN 打开 H5 测试版。

当前 Vercel 地址适合作为海外备用测试地址，但大陆访问稳定性不可控。国内测试建议使用国内云厂商的静态网站托管和 CDN。

## 推荐路径

### 短期：香港节点

适合不想等备案、希望尽快给朋友测试的阶段。

- 阿里云香港 ECS/Nginx 或 OSS 香港地域
- 腾讯云香港 COS 静态网站托管
- Cloudflare Pages 作为备选，但大陆网络稳定性仍不可完全保证

优点：可以较快上线，不一定需要 ICP 备案。

限制：香港节点仍不等于大陆 CDN，部分地区或运营商可能仍有波动。

### 稳定测试/正式上线：大陆 OSS/COS + CDN

推荐二选一：

- 阿里云 OSS 静态网站托管 + CDN
- 腾讯云 COS 静态网站托管 + CDN

需要准备：

- 一个已备案域名
- OSS/COS 存储桶
- CDN 加速域名
- HTTPS 证书

优点：大陆访问稳定，适合后续公开测试和正式上线。

## 当前可上传产物

已生成：

```bash
release/cunchao-h5-dist.zip
```

源目录：

```bash
apps/web/dist
```

## 阿里云 OSS 手动部署步骤

1. 创建 OSS Bucket，建议地域先选香港；正式版选华南/华东等大陆地域。
2. 开启静态网站托管。
3. 上传 `apps/web/dist` 内所有文件到 Bucket 根目录。
4. 设置默认首页为 `index.html`。
5. 设置 404 页面为 `index.html`，以支持 H5 前端路由。
6. 绑定自定义域名并开启 HTTPS。
7. 若使用大陆地域或大陆 CDN，域名需要 ICP 备案。

## 阿里云 OSS CLI 部署

安装并配置 `ossutil` 后：

```bash
export CUNCHAO_OSS_BUCKET=oss://your-bucket-name
export CUNCHAO_OSS_ENDPOINT=oss-cn-hongkong.aliyuncs.com
bash scripts/deploy-aliyun-oss.sh
```

## 腾讯云 COS 手动部署步骤

1. 创建 COS Bucket，建议先选中国香港地域。
2. 开启静态网站功能。
3. 上传 `apps/web/dist` 内所有文件到 Bucket 根目录。
4. 设置索引文档为 `index.html`。
5. 配置错误文档为 `index.html`。
6. 绑定自定义域名和 HTTPS。
7. 若使用大陆地域或大陆 CDN，域名需要 ICP 备案。

## 后端部署建议

H5 首版可以先用前端 mock 数据测试产品体验。后续正式数据源接入后，建议后端单独部署：

- 短期：香港云服务器或云函数
- 正式：国内云服务器、Serverless 或容器服务
- 数据库：PostgreSQL / MySQL，按后续数据源和账号体系确定

