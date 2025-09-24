# Due Date Debug Guide

## 如何使用调试信息排查duedate显示问题

### 1. 打开开发者控制台
- 在Obsidian中，按 `Ctrl+Shift+I` (Windows/Linux) 或 `Cmd+Option+I` (Mac) 打开开发者工具
- 切换到 "Console" 标签页

### 2. 重现问题
- 创建一个包含duedate的卡片
- 设置duedate（通过右键点击timer按钮选择"添加截止日期"）
- 观察focused time line是否显示duedate

### 3. 查看调试信息
在控制台中查找以下调试信息：

#### DueDate组件调试
```
DueDate component - Debug Info: {
  itemId: "...",
  hasDuedate: true/false,
  duedate: moment对象,
  duetime: moment对象,
  duedateStr: "原始字符串",
  duetimeStr: "原始字符串",
  dateDisplayFormat: "格式",
  timeFormat: "格式"
}
```

#### Item组件调试
```
Item.tsx - Focused time line debug: {
  itemId: "...",
  totalMs: 数字,
  hasFocusedTime: true/false,
  hasDueDate: true/false,
  duedate: moment对象,
  duetime: moment对象
}
```

#### 解析器调试
```
parseMarkdown.ts - Parsing duedate: { text: "日期字符串", nodeType: "节点类型" }
parseMarkdown.ts - Parsing duetime: { text: "时间字符串", nodeType: "节点类型" }
```

#### 列表处理调试
```
list.ts - Processing duedate node: {
  nodeType: "duedate",
  dateValue: "日期字符串",
  hasDate: true/false,
  nodeKeys: ["属性列表"]
}
list.ts - Processing duetime node: {
  nodeType: "duetime", 
  timeValue: "时间字符串",
  hasTime: true/false,
  nodeKeys: ["属性列表"]
}
```

#### 数据水合调试
```
hydrateBoard.ts - Due date hydration debug: {
  itemId: "...",
  duedateStr: "日期字符串",
  duetimeStr: "时间字符串",
  dateFormat: "日期格式",
  timeFormat: "时间格式"
}
```

### 4. 常见问题排查

#### 问题1: duedate不显示
检查以下信息：
- `hasDuedate` 是否为 `true`
- `duedate` 对象是否存在且有效
- `duedateStr` 是否包含正确的日期字符串

#### 问题2: 解析失败
检查以下信息：
- `parseMarkdown.ts` 是否输出了duedate解析信息
- `list.ts` 是否输出了duedate节点处理信息
- `hydrateBoard.ts` 中的解析过程是否成功
- 日期格式是否与设置匹配

#### 问题2.1: 数据映射问题（已修复）
如果看到以下情况：
- `parseMarkdown.ts` 显示duedate被解析
- 但 `list.ts` 显示 `hasDate: false` 或 `dateValue: undefined`
- 且 `hydrateBoard.ts` 显示 `duedateStr: undefined`

这表示数据映射问题，已在最新版本中修复。修复方法是在parseMarkdown阶段将duedate数据同时存储在`node.duedate`和`node.date`属性中。

#### 问题2.2: Due Time数据映射问题（已修复）
如果看到以下情况：
- `parseMarkdown.ts` 显示duetime被解析
- 但 `list.ts` 显示 `hasTime: false` 或 `timeValue: undefined`
- 且 `hydrateBoard.ts` 显示 `duetimeStr: undefined`

这表示duetime的数据映射问题，已在最新版本中修复。修复方法是在parseMarkdown阶段将duetime数据同时存储在`node.duetime`和`node.time`属性中。

#### 问题3: 显示格式问题
检查以下信息：
- `dateDisplayFormat` 和 `timeFormat` 设置
- `finalDisplay` 字符串是否正确格式化（现在应该包含 "! Due: " 前缀）

**新的显示格式**：
- 只有duedate：显示 "! Due: 2025-09-26"
- 有duedate和duetime：显示 "! Due: 2025-09-26 00:30"
- 右边有8px的padding用于视觉分离

### 5. 调试信息清理
调试完成后，可以移除调试代码：
- 删除所有 `console.log` 语句
- 或者将调试信息注释掉以便将来使用

### 6. 报告问题
如果问题仍然存在，请提供：
- 完整的控制台调试输出
- 卡片的markdown内容
- 相关的设置配置
- 重现步骤
