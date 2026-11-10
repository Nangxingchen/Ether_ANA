// 国际化模块：支持简体中文 / 繁體中文 / English / 日本語 / 한국어
// 通过 data-i18n 属性自动替换文本；data-i18n-chars 属性拆分为单字动画（转换按钮）
// 语言切换时淡出旧语言 → 替换文本 → 淡入新语言

const STORAGE_KEY = 'app-lang';
const DEFAULT_LANG = 'zh-CN';

// 翻译字典
const translations = {
  // ---------- 简体中文 ----------
  'zh-CN': {
    'app.title': '以太NAN文件转换器',
    'app.brand': 'NAN',
    'theme.toggle': '切换主题',
    'win.minimize': '最小化',
    'win.maximize': '最大化',
    'win.restore': '还原',
    'win.close': '关闭',
    'nav.home': '首页',
    'nav.tools': '工具',
    'nav.about': '关于',
    'nav.settings': '设置',
    'home.description': '一款现代化高效的文件转换集合工具，及时动画，及时启动，及时转换，保护隐私无云端风险，专注高效使用体验',
    'home.tag.focused': '专注',
    'home.tag.professional': '专业',
    'home.tag.simple': '简约',
    'home.title.replay': '点击重新播放开场动画',
    'tools.title': '文件转换',
    'tools.subtitle': '拖拽或点击导入文件，自动识别格式并给出转换选项',
    'tools.dropzone.title': '拖拽文件到此处',
    'tools.dropzone.hint': '或点击选择 · 支持视频 / 文档 / 图书 / 图片 / 音频',
    'tools.dropzone.error': '不支持的文件格式，请选择视频/文档/图书/图片/音频',
    'tools.convertTo': '转换为',
    'tools.convert': '开始转换',
    'tools.fileClear': '移除文件',
    'filecat.video': '视频',
    'filecat.document': '文档',
    'filecat.ebook': '图书',
    'filecat.image': '图片',
    'filecat.audio': '音频',
    'about.title': '关于',
    'about.subtitle': '了解这款应用',
    'about.appName': '应用名称',
    'about.version': '版本',
    'about.framework': '开发作者',
    'about.theme': '支持平台',
    'about.footer': '版权所有 © 以太科技工作室与作者所有',
    'about.author': '作者',
    'about.author.bio': '一个平平无奇的社区开发者',
    'about.studio': '工作室',
    'about.studio.name': '以太工作室',
    'about.studio.bio': '无公害工作室',
    'about.friends': '友链',
    'about.friends.empty': '暂无',
    'settings.title': '设置',
    'settings.subtitle': '个性化你的应用',
    'settings.darkTheme': '深色主题',
    'settings.darkTheme.desc': '切换深色 / 亮色界面',
    'settings.frostedBg': '磨砂背景',
    'settings.frostedBg.desc': '开启后窗口背景变为磨砂玻璃效果',
    'settings.opacity': '透明度',
    'settings.customBg': '自定义背景',
    'settings.customBg.desc': '选择图片或视频作为背景（视频≤30秒 / 1080p）',
    'settings.select': '选择',
    'settings.noFile': '未选择',
    'settings.clearBg': '清除背景',
    'settings.autostart': '开机自启动',
    'settings.autostart.desc': '登录系统时自动启动应用',
    'settings.autoUpdate': '自动检查更新',
    'settings.autoUpdate.desc': '有新版本时提醒我',
    'settings.language': '界面语言',
    'settings.language.desc': '当前界面显示语言',
    'settings.savePath': '保存位置',
    'settings.savePath.desc': '文件转换后的默认保存目录',
    'settings.saveDefault': '系统文档目录',
    'settings.saveCustom': '自定义',
    'settings.selectPath': '选择',
    'toast.convertSoon': '转换功能即将上线，敬请期待',
    'toast.convertStart': '开始转换 {file}',
    'toast.convertDone': '转换完成：{path}',
    'toast.convertError': '转换失败：{msg}',
    'toast.savePathSet': '保存位置已设置',
    'settings.followSystem': '跟随系统',
    'settings.restore': '恢复默认设置',
    'settings.restore.desc': '将所有设置恢复为初始状态',
    'settings.clearCache': '清理缓存',
    'settings.clearCache.desc': '清除应用缓存数据',
    'settings.tray': '系统托盘',
    'settings.tray.desc': '在系统托盘显示图标，关闭后不显示',
    'toast.settingsSaved': '设置已自动保存',
    'toast.settingsRestored': '已恢复默认设置',
    'toast.cacheCleared': '缓存已清理',
    'toast.cacheClearError': '清理失败：{msg}',
    'toast.bgSetImage': '背景已设置为图片',
    'toast.bgSetVideo': '背景已设置为视频',
    'toast.bgValidating': '正在验证视频…',
    'toast.bgCleared': '已清除自定义背景',
    'toast.bgUnsupport': '不支持的文件格式',
    'toast.bgUnavailable': '背景选择功能不可用',
    'toast.bgImageError': '背景图片加载失败，文件可能已被移动',
    'toast.bgVideoError': '背景视频加载失败，文件可能已被移动',
    'toast.videoTooLong': '视频时长 {duration} 秒，不能超过 30 秒',
    'toast.videoTooLarge': '视频分辨率 {w}×{h}，不能超过 1080p',
    'toast.videoUnreadable': '无法读取视频文件',
  },

  // ---------- 繁體中文 ----------
  'zh-TW': {
    'app.title': '以太NAN檔案轉換器',
    'app.brand': 'NAN',
    'theme.toggle': '切換主題',
    'win.minimize': '最小化',
    'win.maximize': '最大化',
    'win.restore': '還原',
    'win.close': '關閉',
    'nav.home': '首頁',
    'nav.tools': '工具',
    'nav.about': '關於',
    'nav.settings': '設定',
    'home.description': '一款現代化高效的檔案轉換集合工具，及時動畫，及時啟動，及時轉換，保護隱私無雲端風險，專注高效使用體驗',
    'home.tag.focused': '專注',
    'home.tag.professional': '專業',
    'home.tag.simple': '簡約',
    'home.title.replay': '點擊重新播放開場動畫',
    'tools.title': '檔案轉換',
    'tools.subtitle': '拖曳或點擊匯入檔案，自動辨識格式並給出轉換選項',
    'tools.dropzone.title': '拖曳檔案到此處',
    'tools.dropzone.hint': '或點擊選擇 · 支援視訊 / 文件 / 圖書 / 圖片 / 音訊',
    'tools.dropzone.error': '不支援的檔案格式，請選擇視訊/文件/圖書/圖片/音訊',
    'tools.convertTo': '轉換為',
    'tools.convert': '開始轉換',
    'tools.fileClear': '移除檔案',
    'filecat.video': '視訊',
    'filecat.document': '文件',
    'filecat.ebook': '圖書',
    'filecat.image': '圖片',
    'filecat.audio': '音訊',
    'about.title': '關於',
    'about.subtitle': '了解這款應用',
    'about.appName': '應用名稱',
    'about.version': '版本',
    'about.framework': '開發作者',
    'about.theme': '支援平台',
    'about.footer': '版權所有 © 以太科技工作室與作者所有',
    'about.author': '作者',
    'about.author.bio': '一個平平無奇的社群開發者',
    'about.studio': '工作室',
    'about.studio.name': '以太工作室',
    'about.studio.bio': '無公害工作室',
    'about.friends': '友鏈',
    'about.friends.empty': '暫無',
    'settings.title': '設定',
    'settings.subtitle': '個性化你的應用',
    'settings.darkTheme': '深色主題',
    'settings.darkTheme.desc': '切換深色 / 亮色界面',
    'settings.frostedBg': '磨砂背景',
    'settings.frostedBg.desc': '開啟後視窗背景變為磨砂玻璃效果',
    'settings.opacity': '透明度',
    'settings.customBg': '自訂背景',
    'settings.customBg.desc': '選擇圖片或影片作為背景（影片≤30秒 / 1080p）',
    'settings.select': '選擇',
    'settings.noFile': '未選擇',
    'settings.clearBg': '清除背景',
    'settings.autostart': '開機自動啟動',
    'settings.autostart.desc': '登入系統時自動啟動應用',
    'settings.autoUpdate': '自動檢查更新',
    'settings.autoUpdate.desc': '有新版本時提醒我',
    'settings.language': '界面語言',
    'settings.language.desc': '當前界面顯示語言',
    'settings.savePath': '保存位置',
    'settings.savePath.desc': '檔案轉換後的預設保存目錄',
    'settings.saveDefault': '系統文件目錄',
    'settings.saveCustom': '自訂義',
    'settings.selectPath': '選擇',
    'toast.convertSoon': '轉換功能即將上線，敬請期待',
    'toast.convertStart': '開始轉換 {file}',
    'toast.convertDone': '轉換完成：{path}',
    'toast.convertError': '轉換失敗：{msg}',
    'toast.savePathSet': '保存位置已設定',
    'settings.followSystem': '跟隨系統',
    'settings.restore': '恢復預設設定',
    'settings.restore.desc': '將所有設定恢復為初始狀態',
    'settings.clearCache': '清理快取',
    'settings.clearCache.desc': '清除應用快取資料',
    'settings.tray': '系統匣',
    'settings.tray.desc': '在系統匣顯示圖示，關閉後不顯示',
    'toast.settingsSaved': '設定已自動保存',
    'toast.settingsRestored': '已恢復預設設定',
    'toast.cacheCleared': '快取已清理',
    'toast.cacheClearError': '清理失敗：{msg}',
    'toast.bgSetImage': '背景已設定為圖片',
    'toast.bgSetVideo': '背景已設定為影片',
    'toast.bgValidating': '正在驗證影片…',
    'toast.bgCleared': '已清除自訂背景',
    'toast.bgUnsupport': '不支援的檔案格式',
    'toast.bgUnavailable': '背景選擇功能不可用',
    'toast.bgImageError': '背景圖片載入失敗，檔案可能已被移動',
    'toast.bgVideoError': '背景影片載入失敗，檔案可能已被移動',
    'toast.videoTooLong': '影片時長 {duration} 秒，不能超過 30 秒',
    'toast.videoTooLarge': '影片解析度 {w}×{h}，不能超過 1080p',
    'toast.videoUnreadable': '無法讀取影片檔案',
  },

  // ---------- English ----------
  'en': {
    'app.title': 'Ether NAN File Converter',
    'app.brand': 'NAN',
    'theme.toggle': 'Toggle Theme',
    'win.minimize': 'Minimize',
    'win.maximize': 'Maximize',
    'win.restore': 'Restore',
    'win.close': 'Close',
    'nav.home': 'Home',
    'nav.tools': 'Tools',
    'nav.about': 'About',
    'nav.settings': 'Settings',
    'home.description': 'A modern, efficient file conversion suite. Instant animations, instant startup, instant conversion. Privacy-protected, no cloud risks. Focused on a high-efficiency experience.',
    'home.tag.focused': 'Focused',
    'home.tag.professional': 'Professional',
    'home.tag.simple': 'Simple',
    'home.title.replay': 'Click to replay intro animation',
    'tools.title': 'File Conversion',
    'tools.subtitle': 'Drag or click to import files, auto-detect format and show conversion options',
    'tools.dropzone.title': 'Drag files here',
    'tools.dropzone.hint': 'or click to select · Video / Document / Ebook / Image / Audio',
    'tools.dropzone.error': 'Unsupported file format, please select video/document/ebook/image/audio',
    'tools.convertTo': 'Convert to',
    'tools.convert': 'Convert',
    'tools.fileClear': 'Remove file',
    'filecat.video': 'Video',
    'filecat.document': 'Document',
    'filecat.ebook': 'Ebook',
    'filecat.image': 'Image',
    'filecat.audio': 'Audio',
    'about.title': 'About',
    'about.subtitle': 'About this app',
    'about.appName': 'App Name',
    'about.version': 'Version',
    'about.framework': 'Developer',
    'about.theme': 'Platforms',
    'about.footer': 'Copyright © Aether Tech Studio & Author. All rights reserved.',
    'about.author': 'Author',
    'about.author.bio': 'An ordinary community developer',
    'about.studio': 'Studio',
    'about.studio.name': 'Ether Studio',
    'about.studio.bio': 'Harmless Studio',
    'about.friends': 'Friends',
    'about.friends.empty': 'None yet',
    'settings.title': 'Settings',
    'settings.subtitle': 'Personalize your app',
    'settings.darkTheme': 'Dark Theme',
    'settings.darkTheme.desc': 'Switch dark / light interface',
    'settings.frostedBg': 'Frosted Background',
    'settings.frostedBg.desc': 'Window background becomes frosted glass effect',
    'settings.opacity': 'Opacity',
    'settings.customBg': 'Custom Background',
    'settings.customBg.desc': 'Select image or video as background (video ≤30s / 1080p)',
    'settings.select': 'Select',
    'settings.noFile': 'None',
    'settings.clearBg': 'Clear background',
    'settings.autostart': 'Auto Start',
    'settings.autostart.desc': 'Launch app on system login',
    'settings.autoUpdate': 'Auto Update',
    'settings.autoUpdate.desc': 'Notify me when a new version is available',
    'settings.language': 'Language',
    'settings.language.desc': 'Current interface language',
    'settings.savePath': 'Save Location',
    'settings.savePath.desc': 'Default directory for converted files',
    'settings.saveDefault': 'Documents folder',
    'settings.saveCustom': 'Custom',
    'settings.selectPath': 'Select',
    'toast.convertSoon': 'Conversion feature coming soon',
    'toast.convertStart': 'Converting {file}',
    'toast.convertDone': 'Done: {path}',
    'toast.convertError': 'Failed: {msg}',
    'toast.savePathSet': 'Save location set',
    'settings.followSystem': 'Follow System',
    'settings.restore': 'Restore Defaults',
    'settings.restore.desc': 'Reset all settings to initial state',
    'settings.clearCache': 'Clear Cache',
    'settings.clearCache.desc': 'Clear application cache data',
    'settings.tray': 'System Tray',
    'settings.tray.desc': 'Show icon in system tray',
    'toast.settingsSaved': 'Settings saved automatically',
    'toast.settingsRestored': 'Settings restored to defaults',
    'toast.cacheCleared': 'Cache cleared',
    'toast.cacheClearError': 'Clear failed: {msg}',
    'toast.bgSetImage': 'Background set to image',
    'toast.bgSetVideo': 'Background set to video',
    'toast.bgValidating': 'Validating video…',
    'toast.bgCleared': 'Custom background cleared',
    'toast.bgUnsupport': 'Unsupported file format',
    'toast.bgUnavailable': 'Background selection unavailable',
    'toast.bgImageError': 'Failed to load background image, file may have been moved',
    'toast.bgVideoError': 'Failed to load background video, file may have been moved',
    'toast.videoTooLong': 'Video duration {duration}s, cannot exceed 30s',
    'toast.videoTooLarge': 'Video resolution {w}×{h}, cannot exceed 1080p',
    'toast.videoUnreadable': 'Unable to read video file',
  },

  // ---------- 日本語 ----------
  'ja': {
    'app.title': 'イーサNANファイルコンバータ',
    'app.brand': 'NAN',
    'theme.toggle': 'テーマ切替',
    'win.minimize': '最小化',
    'win.maximize': '最大化',
    'win.restore': '元に戻す',
    'win.close': '閉じる',
    'nav.home': 'ホーム',
    'nav.tools': 'ツール',
    'nav.about': 'について',
    'nav.settings': '設定',
    'home.description': '現代的で効率的なファイル変換スイート。即時アニメーション、即時起動、即時変換。プライバシー保護、クラウドリスクなし。効率的な体験に集中。',
    'home.tag.focused': '集中',
    'home.tag.professional': 'プロフェッショナル',
    'home.tag.simple': 'シンプル',
    'home.title.replay': 'クリックでオープニングアニメーション再生',
    'tools.title': 'ファイル変換',
    'tools.subtitle': 'ドラッグまたはクリックでファイルをインポート、形式を自動認識して変換オプションを表示',
    'tools.dropzone.title': 'ここにファイルをドラッグ',
    'tools.dropzone.hint': 'またはクリックして選択 · 動画 / ドキュメント / 電子書籍 / 画像 / 音声',
    'tools.dropzone.error': 'サポートされていない形式です。動画/ドキュメント/電子書籍/画像/音声を選択してください',
    'tools.convertTo': '変換先',
    'tools.convert': '変換開始',
    'tools.fileClear': 'ファイル削除',
    'filecat.video': '動画',
    'filecat.document': 'ドキュメント',
    'filecat.ebook': '電子書籍',
    'filecat.image': '画像',
    'filecat.audio': '音声',
    'about.title': 'について',
    'about.subtitle': 'このアプリについて',
    'about.appName': 'アプリ名',
    'about.version': 'バージョン',
    'about.framework': '開発者',
    'about.theme': '対応プラットフォーム',
    'about.footer': '著作権 © エーテル科技スタジオおよび作者すべての権利を保有',
    'about.author': '作者',
    'about.author.bio': 'ごく普通のコミュニティ開発者',
    'about.studio': 'スタジオ',
    'about.studio.name': 'イーサスタジオ',
    'about.studio.bio': '無害スタジオ',
    'about.friends': 'フレンドリンク',
    'about.friends.empty': 'まだありません',
    'settings.title': '設定',
    'settings.subtitle': 'アプリをカスタマイズ',
    'settings.darkTheme': 'ダークテーマ',
    'settings.darkTheme.desc': 'ダーク / ライト界面の切替',
    'settings.frostedBg': 'マット背景',
    'settings.frostedBg.desc': 'ウィンドウ背景をすりガラス効果に',
    'settings.opacity': '不透明度',
    'settings.customBg': 'カスタム背景',
    'settings.customBg.desc': '画像または動画を背景に選択（動画≤30秒 / 1080p）',
    'settings.select': '選択',
    'settings.noFile': '未選択',
    'settings.clearBg': '背景クリア',
    'settings.autostart': '自動起動',
    'settings.autostart.desc': 'システムログイン時にアプリを起動',
    'settings.autoUpdate': '自動更新確認',
    'settings.autoUpdate.desc': '新バージョンがある場合に通知',
    'settings.language': '言語',
    'settings.language.desc': '現在の界面言語',
    'settings.savePath': '保存先',
    'settings.savePath.desc': '変換ファイルのデフォルト保存先',
    'settings.saveDefault': 'ドキュメントフォルダ',
    'settings.saveCustom': 'カスタム',
    'settings.selectPath': '選択',
    'toast.convertSoon': '変換機能は近日公開予定',
    'toast.convertStart': '{file} を変換中',
    'toast.convertDone': '完了：{path}',
    'toast.convertError': '失敗：{msg}',
    'toast.savePathSet': '保存先を設定しました',
    'settings.followSystem': 'システムに従う',
    'settings.restore': '初期設定に戻す',
    'settings.restore.desc': 'すべての設定を初期状態にリセット',
    'settings.clearCache': 'キャッシュクリア',
    'settings.clearCache.desc': 'アプリのキャッシュデータを削除',
    'settings.tray': 'システムトレイ',
    'settings.tray.desc': 'システムトレイにアイコンを表示',
    'toast.settingsSaved': '設定を自動保存しました',
    'toast.settingsRestored': '初期設定に戻しました',
    'toast.cacheCleared': 'キャッシュをクリアしました',
    'toast.cacheClearError': 'クリア失敗：{msg}',
    'toast.bgSetImage': '背景を画像に設定しました',
    'toast.bgSetVideo': '背景を動画に設定しました',
    'toast.bgValidating': '動画を検証中…',
    'toast.bgCleared': 'カスタム背景をクリアしました',
    'toast.bgUnsupport': 'サポートされていない形式',
    'toast.bgUnavailable': '背景選択機能は利用できません',
    'toast.bgImageError': '背景画像の読み込みに失敗、ファイルが移動された可能性',
    'toast.bgVideoError': '背景動画の読み込みに失敗、ファイルが移動された可能性',
    'toast.videoTooLong': '動画の長さ {duration}秒、30秒を超えることはできません',
    'toast.videoTooLarge': '動画解像度 {w}×{h}、1080pを超えることはできません',
    'toast.videoUnreadable': '動画ファイルを読み取れません',
  },

  // ---------- 한국어 ----------
  'ko': {
    'app.title': '이더 NAN 파일 변환기',
    'app.brand': 'NAN',
    'theme.toggle': '테마 전환',
    'win.minimize': '최소화',
    'win.maximize': '최대화',
    'win.restore': '복원',
    'win.close': '닫기',
    'nav.home': '홈',
    'nav.tools': '도구',
    'nav.about': '정보',
    'nav.settings': '설정',
    'home.description': '현대적이고 효율적인 파일 변환 모음. 즉시 애니메이션, 즉시 시작, 즉시 변환. 개인정보 보호, 클라우드 위험 없음. 효율적인 경험에 집중.',
    'home.tag.focused': '집중',
    'home.tag.professional': '프로페셔널',
    'home.tag.simple': '심플',
    'home.title.replay': '클릭해서 오프닝 애니메이션 재생',
    'tools.title': '파일 변환',
    'tools.subtitle': '드래그 또는 클릭으로 파일 가져오기, 형식 자동 인식 후 변환 옵션 표시',
    'tools.dropzone.title': '여기에 파일을 드래그',
    'tools.dropzone.hint': '또는 클릭하여 선택 · 비디오 / 문서 / 전자책 / 이미지 / 오디오',
    'tools.dropzone.error': '지원하지 않는 형식입니다. 비디오/문서/전자책/이미지/오디오를 선택하세요',
    'tools.convertTo': '변환 대상',
    'tools.convert': '변환 시작',
    'tools.fileClear': '파일 제거',
    'filecat.video': '비디오',
    'filecat.document': '문서',
    'filecat.ebook': '전자책',
    'filecat.image': '이미지',
    'filecat.audio': '오디오',
    'about.title': '정보',
    'about.subtitle': '이 앱에 대해',
    'about.appName': '앱 이름',
    'about.version': '버전',
    'about.framework': '개발자',
    'about.theme': '지원 플랫폼',
    'about.footer': '저작권 © 에테르 테크 스튜디오 및 작성자 모든 권리 보유',
    'about.author': '저자',
    'about.author.bio': '평범한 커뮤니티 개발자',
    'about.studio': '스튜디오',
    'about.studio.name': '이더 스튜디오',
    'about.studio.bio': '무해 스튜디오',
    'about.friends': '친구 링크',
    'about.friends.empty': '아직 없습니다',
    'settings.title': '설정',
    'settings.subtitle': '앱 맞춤 설정',
    'settings.darkTheme': '다크 테마',
    'settings.darkTheme.desc': '다크 / 라이트 인터페이스 전환',
    'settings.frostedBg': '서리 효과 배경',
    'settings.frostedBg.desc': '창 배경을 서리 유리 효과로 설정',
    'settings.opacity': '불투명도',
    'settings.customBg': '사용자 지정 배경',
    'settings.customBg.desc': '이미지 또는 동영상을 배경으로 선택 (동영상 ≤30초 / 1080p)',
    'settings.select': '선택',
    'settings.noFile': '없음',
    'settings.clearBg': '배경 지우기',
    'settings.autostart': '자동 시작',
    'settings.autostart.desc': '시스템 로그인 시 앱 자동 실행',
    'settings.autoUpdate': '자동 업데이트 확인',
    'settings.autoUpdate.desc': '새 버전이 있을 때 알림',
    'settings.language': '언어',
    'settings.language.desc': '현재 인터페이스 언어',
    'settings.savePath': '저장 위치',
    'settings.savePath.desc': '변환된 파일의 기본 저장 디렉토리',
    'settings.saveDefault': '문서 폴더',
    'settings.saveCustom': '사용자 지정',
    'settings.selectPath': '선택',
    'toast.convertSoon': '변환 기능이 곧 출시됩니다',
    'toast.convertStart': '{file} 변환 중',
    'toast.convertDone': '완료: {path}',
    'toast.convertError': '실패: {msg}',
    'toast.savePathSet': '저장 위치가 설정되었습니다',
    'settings.followSystem': '시스템 따르기',
    'settings.restore': '기본 설정 복원',
    'settings.restore.desc': '모든 설정을 초기 상태로 되돌립니다',
    'settings.clearCache': '캐시 정리',
    'settings.clearCache.desc': '앱 캐시 데이터를 삭제합니다',
    'settings.tray': '시스템 트레이',
    'settings.tray.desc': '시스템 트레이에 아이콘 표시',
    'toast.settingsSaved': '설정이 자동 저장되었습니다',
    'toast.settingsRestored': '기본 설정으로 복원되었습니다',
    'toast.cacheCleared': '캐시가 정리되었습니다',
    'toast.cacheClearError': '정리 실패: {msg}',
    'toast.bgSetImage': '배경을 이미지로 설정했습니다',
    'toast.bgSetVideo': '배경을 동영상으로 설정했습니다',
    'toast.bgValidating': '동영상 검증 중…',
    'toast.bgCleared': '사용자 지정 배경을 지웠습니다',
    'toast.bgUnsupport': '지원하지 않는 형식',
    'toast.bgUnavailable': '배경 선택 기능을 사용할 수 없습니다',
    'toast.bgImageError': '배경 이미지 로드 실패, 파일이 이동되었을 수 있습니다',
    'toast.bgVideoError': '배경 동영상 로드 실패, 파일이 이동되었을 수 있습니다',
    'toast.videoTooLong': '동영상 길이 {duration}초, 30초를 초과할 수 없습니다',
    'toast.videoTooLarge': '동영상 해상도 {w}×{h}, 1080p를 초과할 수 없습니다',
    'toast.videoUnreadable': '동영상 파일을 읽을 수 없습니다',
  },
};

// 支持的语言列表
export function getLanguages() {
  return [
    { code: 'zh-CN', name: '简体中文' },
    { code: 'zh-TW', name: '繁體中文' },
    { code: 'en', name: 'English' },
    { code: 'ja', name: '日本語' },
    { code: 'ko', name: '한국어' },
  ];
}

// 当前语言
let currentLang = DEFAULT_LANG;

// 获取翻译文本（支持参数替换 {key}）
export function t(key, params) {
  const dict = translations[currentLang] || translations[DEFAULT_LANG];
  let text = dict[key];
  if (text === undefined) {
    text = translations[DEFAULT_LANG][key] || key;
  }
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      text = text.replace(`{${k}}`, v);
    });
  }
  return text;
}

// 获取当前语言代码
export function getCurrentLang() {
  return currentLang;
}

// 将翻译应用到 DOM（data-i18n 属性 + data-i18n-chars 单字拆分）
// 文字级别平滑淡入淡出：先给所有元素添加 .i18n-fade-out 类 → 替换文本 → 添加 .i18n-fade-in 类
function applyToDOM(lang, doAnimation = false) {
  const dict = translations[lang] || translations[DEFAULT_LANG];
  const i18nEls = document.querySelectorAll('[data-i18n]');
  const charsEls = document.querySelectorAll('[data-i18n-chars]');

  // 所有受影响的文字元素集合
  const targets = [];
  i18nEls.forEach((el) => {
    if (el.childElementCount === 0) targets.push(el);
  });
  charsEls.forEach((el) => targets.push(el));

  // 动画阶段 1：每个元素独立淡出
  if (doAnimation) {
    targets.forEach((el, i) => {
      el.classList.remove('i18n-fade-in');
      // 递增延迟，实现丝滑逐行淡出
      el.style.transitionDelay = `${Math.min(i * 8, 160)}ms`;
      void el.offsetWidth; // reflow
      el.classList.add('i18n-fade-out');
    });
  }

  // 执行替换的闭包
  function doReplace() {
    // 普通文本元素：data-i18n
    i18nEls.forEach((el) => {
      const key = el.dataset.i18n;
      if (dict[key] === undefined) return;
      if (el.childElementCount > 0) {
        // 含图标等子元素：仅更新 title 与 aria-label，保留子元素
        if (el.hasAttribute('title')) el.title = dict[key];
        if (el.hasAttribute('aria-label')) el.setAttribute('aria-label', dict[key]);
      } else {
        el.textContent = dict[key];
      }
    });

    // 单字拆分元素：data-i18n-chars（转换按钮文字）
    charsEls.forEach((el) => {
      const key = el.dataset.i18nChars;
      const text = dict[key] || translations[DEFAULT_LANG][key] || '';
      el.innerHTML = '';
      [...text].forEach((char, i) => {
        const span = document.createElement('span');
        span.className = 'char';
        span.textContent = char;
        span.style.setProperty('--char-delay', `${0.15 + i * 0.1}s`);
        el.appendChild(span);
      });
      const isCJK = /[\u4e00-\u9fff\u3040-\u30ff\uac00-\ud7af]/.test(text);
      const charWidth = isCJK ? 16 : 10;
      el.style.setProperty('--text-width', `${[...text].length * charWidth + 8}px`);
    });

    document.documentElement.lang = lang;
  }

  if (!doAnimation) {
    // 无动画：直接替换
    doReplace();
    return;
  }

  // 动画阶段 2：待淡出完成后替换并淡入
  setTimeout(() => {
    doReplace();
    targets.forEach((el, i) => {
      el.classList.remove('i18n-fade-out');
      el.style.transitionDelay = `${Math.min(i * 8, 160)}ms`;
      void el.offsetWidth;
      el.classList.add('i18n-fade-in');
    });
    // 清理类与过渡延迟
    setTimeout(() => {
      targets.forEach((el) => {
        el.classList.remove('i18n-fade-in');
        el.style.transitionDelay = '';
      });
    }, 350);
  }, 220);
}

// 切换语言：文字级别平滑淡入淡出（非整屏淡出）
export function setLanguage(lang) {
  if (!translations[lang]) return;
  if (lang === currentLang) return;

  currentLang = lang;
  applyToDOM(lang, true);
  try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* 忽略 */ }

  // 派发语言变更事件，供其他模块响应
  document.dispatchEvent(new CustomEvent('langchange', { detail: { lang } }));
}

// 初始化：加载已保存的语言
export function initI18n() {
  let saved = DEFAULT_LANG;
  try { saved = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch (e) { /* 忽略 */ }
  currentLang = translations[saved] ? saved : DEFAULT_LANG;
  applyToDOM(currentLang);
}
