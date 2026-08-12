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
      language: {
        title: '言語',
        description: 'インターフェースの言語を選択します。',
        enUS: 'English',
        jaJP: '日本語',
        zhCN: '简体中文',
      },
    },
  },
} as const;

export default jaJP;
