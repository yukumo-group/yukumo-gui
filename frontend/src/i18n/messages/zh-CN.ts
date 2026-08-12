const zhCN = {
  nav: {
    generate: '生成',
    profiles: '角色配置',
    utilities: '工具',
    help: '帮助',
    settings: '设置',
    mainAriaLabel: '主导航',
  },
  pages: {
    generate: {
      title: '生成',
      description: '在此工作区中创建并运行 Yukumo 脚本。',
      editorAriaLabel: '脚本编辑器',
      editorLoading: '正在加载编辑器…',
      editorLoadFailed: '编辑器加载失败。',
    },
    profiles: {
      title: '配置文件',
      description: '浏览并管理可用于脚本生成的配置文件。',
    },
    utilities: {
      title: '工具',
      description: '访问工作区的辅助工具与维护实用程序。',
    },
    help: {
      title: '帮助',
      description: '了解如何使用 Yukumo Script，并查找常见问题的解答。',
    },
    settings: {
      title: '设置',
      description: '配置应用程序偏好设置与工作区选项。',
      appearance: {
        title: '外观',
        description: '在 MD3 浅色、深色或跟随设备之间切换。',
        light: '浅色',
        dark: '深色',
        system: '系统',
      },
      accentColor: {
        title: '强调色',
        description: '为 Material You 浅色与深色主题选择色相。',
        ariaLabel: '强调色色相',
        toggleSlider: '显示或隐藏强调色滑块',
      },
      language: {
        title: '语言',
        description: '选择界面语言，或跟随设备。',
        system: '系统',
        enUS: 'English',
        jaJP: '日本語',
        zhCN: '简体中文',
      },
      reset: {
        title: '重置设置',
        description: '将所有设置恢复为默认值。',
        action: '重置',
        confirmTitle: '重置所有设置？',
        confirmMessage: '所有设置将被重置。此操作无法撤销。',
        confirm: '重置',
        cancel: '取消',
      },
    },
  },
} as const;

export default zhCN;
