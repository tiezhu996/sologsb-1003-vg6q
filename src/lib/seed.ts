import type { Discussion, GlossaryTerm, HistoryEntry, LocalizationDocument, Segment, TranslationConflict, TranslationMemoryEntry } from './types'

export const seedSegments: Segment[] = [
  { id: 'seg-01', index: 1, kind: 'heading', sourceText: '# Deployment Guide', targetText: '# 部署指南', status: 'confirmed', protectedTokens: [], note: '保留 Markdown 标题层级。' },
  { id: 'seg-02', index: 2, kind: 'paragraph', sourceText: 'This guide explains how to deploy {{project_name}} version {{version}} to a Kubernetes cluster.', targetText: '本指南介绍如何将 {{project_name}} {{version}} 版部署到 Kubernetes 集群。', status: 'draft', protectedTokens: ['{{project_name}}', '{{version}}'], note: '项目名和版本号保留占位符。' },
  { id: 'seg-03', index: 3, kind: 'heading', sourceText: '## Prerequisites', targetText: '## 前置条件', status: 'confirmed', protectedTokens: [], note: '' },
  { id: 'seg-04', index: 4, kind: 'link', sourceText: 'Before you begin, review the [configuration reference](https://docs.example.com/config) and install `kubectl`.', targetText: '开始前，请阅读 [配置参考](https://docs.example.com/config)，并安装 `kubectl`。', status: 'draft', protectedTokens: ['https://docs.example.com/config'], note: '' },
  { id: 'seg-05', index: 5, kind: 'paragraph', sourceText: 'The operator requires cluster-admin privileges during installation. Production environments should use a dedicated service account.', targetText: '安装 operator 时需要集群管理员权限。生产环境建议使用专用的服务账号。', status: 'needs-work', protectedTokens: [], note: 'operator 的术语待 unified。' },
  { id: 'seg-06', index: 6, kind: 'code', sourceText: '```bash\nhelm upgrade --install {{release_name}} oci://registry.example.com/operator --version {{version}}\n```', targetText: '```bash\nhelm upgrade --install {{release_name}} oci://registry.example.com/operator --version {{version}}\n```', status: 'confirmed', protectedTokens: ['{{release_name}}', '{{version}}'], note: '命令保持原样。' },
  { id: 'seg-07', index: 7, kind: 'variable', sourceText: 'Set `replicaCount` to `{replica_count}` in your values file.', targetText: '在 values 文件中将 `replicaCount` 设置为 `{replica_count}`。', status: 'draft', protectedTokens: ['{replica_count}'], note: '' },
  { id: 'seg-08', index: 8, kind: 'paragraph', sourceText: 'If the controller cannot reach the API server, check the network policy and then restart the pod.', targetText: '如果控制器无法连接 API 服务器，请检查网络策略，然后重启 Pod。', status: 'draft', protectedTokens: [], note: '' },
  { id: 'seg-09', index: 9, kind: 'link', sourceText: 'See [Troubleshooting](https://docs.example.com/troubleshooting#connectivity) for detailed diagnostics.', targetText: '详细诊断请参阅 [故障排查](https://docs.example.com/troubleshooting)。', status: 'returned', protectedTokens: ['https://docs.example.com/troubleshooting#connectivity'], note: '锚点链接丢失，需要修复。' },
  { id: 'seg-10', index: 10, kind: 'heading', sourceText: '## Upgrade Notes', targetText: '', status: 'draft', protectedTokens: [], note: '漏译示例。' },
  {
    id: 'seg-11', index: 11, kind: 'paragraph',
    sourceText: 'The operator now validates admission webhooks before applying changes to the cluster.',
    targetText: 'Operator 现在会在应用变更前校验准入 webhook。',
    status: 'draft', protectedTokens: [],
    note: '源文已更新（补充了 webhook 校验），此前采用的记忆译文与当前源文对不上。',
    adoptedMemories: [
      { memoryId: 'mem-10', sourceAtAdoption: 'The operator validates changes before applying them to the cluster.', appliedAt: Date.now() - 5400000 },
    ],
  },
]

export const seedGlossary: GlossaryTerm[] = [
  { id: 'term-01', source: 'operator', target: 'Operator', caseSensitive: false, note: 'Kubernetes 扩展概念，保留首字母大写。' },
  { id: 'term-02', source: 'service account', target: '服务账号', caseSensitive: false, note: '统一使用“服务账号”。' },
  { id: 'term-03', source: 'network policy', target: '网络策略', caseSensitive: false, note: 'Kubernetes 资源名称。' },
  { id: 'term-04', source: 'pod', target: 'Pod', caseSensitive: false, note: '资源对象名称保持 Pod。' },
]

export const seedDiscussions: Discussion[] = [
  { id: 'disc-01', segmentId: 'seg-05', author: '译者 · 李然', body: '这里的 operator 指本项目控制器还是通用 Kubernetes Operator？会影响是否保留英文。', resolved: false, createdAt: Date.now() - 4200000 },
  { id: 'disc-02', segmentId: 'seg-09', author: '审校 · Maya', body: '源链接包含 connectivity 锚点，请勿省略。', resolved: false, createdAt: Date.now() - 2600000 },
  { id: 'disc-03', segmentId: 'seg-02', author: '术语负责人 · Chen', body: '占位符里的变量名不能翻译。', resolved: true, createdAt: Date.now() - 9600000 },
]

export const seedHistory: HistoryEntry[] = [
  { id: 'h-01', segmentId: 'seg-05', author: '译者 · 李然', action: 'edit', before: '', after: '安装 operator 时需要集群管理员权限。生产环境建议使用专用的服务账号。', createdAt: Date.now() - 5200000 },
  { id: 'h-02', segmentId: 'seg-09', author: '译者 · 李然', action: 'edit', before: '', after: '详细诊断请参阅 [故障排查](https://docs.example.com/troubleshooting)。', createdAt: Date.now() - 4000000 },
  { id: 'h-03', segmentId: 'seg-01', author: '审校 · Maya', action: 'confirm', before: '# 部署指南', after: '# 部署指南', createdAt: Date.now() - 3200000 },
  { id: 'h-04', segmentId: 'seg-11', author: '译者 · 李然', action: 'memory-apply', memoryId: 'mem-10', before: '', after: 'Operator 会在将变更应用到集群前进行校验。', createdAt: Date.now() - 5400000 },
  { id: 'h-05', segmentId: 'seg-11', author: '译者 · 李然', action: 'edit', before: 'Operator 会在将变更应用到集群前进行校验。', after: 'Operator 现在会在应用变更前校验准入 webhook。', createdAt: Date.now() - 5000000 },
]

export const seedMemory: TranslationMemoryEntry[] = [
  { id: 'mem-01', sourceText: 'The operator requires cluster-admin privileges during installation.', targetText: '安装 Operator 时需要集群管理员权限。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 3, createdAt: Date.now() - 86400000 * 6, updatedAt: Date.now() - 86400000 * 2 },
  { id: 'mem-02', sourceText: 'This guide explains how to deploy the operator to a Kubernetes cluster.', targetText: '本指南介绍如何将 Operator 部署到 Kubernetes 集群。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 5, createdAt: Date.now() - 86400000 * 9, updatedAt: Date.now() - 86400000 * 3 },
  { id: 'mem-03', sourceText: '## Upgrade Notes', targetText: '## 升级说明', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 1, createdAt: Date.now() - 86400000 * 4, updatedAt: Date.now() - 86400000 * 4 },
  { id: 'mem-04', sourceText: 'Production environments should use a dedicated service account.', targetText: '生产环境应使用专用服务账号。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 2, createdAt: Date.now() - 86400000 * 7, updatedAt: Date.now() - 86400000 * 1 },
  { id: 'mem-05', sourceText: 'Before you begin, review the configuration reference.', targetText: '开始前，请阅读配置参考。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 4, createdAt: Date.now() - 86400000 * 11, updatedAt: Date.now() - 86400000 * 5 },
  { id: 'mem-06', sourceText: 'Run helm upgrade --install to apply the new chart version.', targetText: '运行 helm upgrade --install 应用新的 chart 版本。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 2, createdAt: Date.now() - 86400000 * 8, updatedAt: Date.now() - 86400000 * 2 },
  { id: 'mem-07', sourceText: 'Restart the pod to pick up the new configuration.', targetText: '重新启动 Pod 以加载新配置。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: false, useCount: 1, createdAt: Date.now() - 86400000 * 12, updatedAt: Date.now() - 86400000 * 6 },
  { id: 'mem-08', sourceText: 'The quick brown fox jumps over the lazy dog.', targetText: '敏捷的棕色狐狸跳过懒狗。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 0, createdAt: Date.now() - 86400000 * 20, updatedAt: Date.now() - 86400000 * 20 },
  { id: 'mem-09', sourceText: 'The operator validates admission webhooks before applying changes.', targetText: 'Operator 会在应用变更前校验准入 webhook。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 1, createdAt: Date.now() - 86400000 * 3, updatedAt: Date.now() - 86400000 * 1 },
  { id: 'mem-10', sourceText: 'The operator validates changes before applying them to the cluster.', targetText: 'Operator 会在将变更应用到集群前进行校验。', sourceLanguage: 'English', targetLanguage: '简体中文', enabled: true, useCount: 2, createdAt: Date.now() - 86400000 * 10, updatedAt: Date.now() - 86400000 * 2 },
]

export const seedConflicts: TranslationConflict[] = [
  { id: 'cf-01', segmentId: 'seg-05', localText: '安装 operator 时需要集群管理员权限。生产环境建议使用专用的服务账号。', remoteText: '安装 Operator 时需要集群管理员权限。生产环境应使用专用服务账号。', remoteAuthor: '远端协作者 · Alex', createdAt: Date.now() - 1200000 },
  { id: 'cf-02', segmentId: 'seg-09', localText: '详细诊断请参阅 [故障排查](https://docs.example.com/troubleshooting)。', remoteText: '详细诊断请参阅 [故障排查](https://docs.example.com/troubleshooting#connectivity)。', remoteAuthor: 'MSW 模拟审校者', createdAt: Date.now() - 900000 },
]

export const seedDocument: LocalizationDocument = {
  id: 'doc-k8s-operator',
  title: 'Kubernetes Operator Developer Guide',
  sourceFile: 'docs/deployment.md',
  sourceLanguage: 'English',
  targetLanguage: '简体中文',
  updatedAt: Date.now(),
  segments: seedSegments,
  glossary: seedGlossary,
  discussions: seedDiscussions,
}
