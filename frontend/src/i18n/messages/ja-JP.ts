const jaJP = {
  nav: {
    generate: '生成',
    profiles: 'プロファイル',
    utilities: 'ユーティリティ',
    help: 'ヘルプ',
    settings: '設定',
    mainAriaLabel: 'メインナビゲーション',
  },
  pages: {
    generate: {
      title: '生成',
      description: 'このワークスペースから Yukumo スクリプトを作成・実行します。',
    },
    profiles: {
      title: 'プロファイル',
      description: 'スクリプト生成に使えるプロファイルを閲覧・管理します。',
    },
    utilities: {
      title: 'ユーティリティ',
      description: 'ワークスペース向けの補助ツールとメンテ用ユーティリティにアクセスします。',
    },
    help: {
      title: 'ヘルプ',
      description: 'Yukumo Script の使い方とよくある質問を確認します。',
    },
    settings: {
      title: '設定',
      description: 'アプリの設定とワークスペースのオプションを構成します。',
      appearance: {
        title: '外観',
        description: 'MD3 のライト／ダーク、または端末に合わせるかを切り替えます。',
        light: 'ライト',
        dark: 'ダーク',
        system: 'システム',
      },
      accentColor: {
        title: 'アクセントカラー',
        description: 'Material You のライト／ダーク用の色相を選びます。',
        ariaLabel: 'アクセントカラーの色相',
        toggleSlider: 'アクセントカラーのスライダーを表示または非表示',
      },
      language: {
        title: '言語',
        description: 'インターフェースの言語を選ぶか、端末に合わせます。',
        system: 'システム',
        enUS: 'English',
        jaJP: '日本語',
        zhCN: '简体中文',
      },
      reset: {
        title: '設定をリセット',
        description: 'すべての設定を初期値に戻します。',
        action: 'リセット',
        confirmTitle: 'すべての設定をリセットしますか？',
        confirmMessage: 'すべての設定がリセットされます。この操作は取り消せません。',
        confirm: 'リセット',
        cancel: 'キャンセル',
      },
    },
  },
} as const;

export default jaJP;
