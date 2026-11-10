; ==========================================
; 以太NAN文件转换器 - NSIS 自定义宏
; 无自定义页面，仅在安装/卸载时执行额外逻辑
; ==========================================

; ---------- 引入依赖 ----------
!include "LogicLib.nsh"

; ==========================================
; 安装完成后：注册表 + 自启动 + 开始菜单卸载入口
; ==========================================
!macro customInstall
  ; ---------- 写入应用信息到注册表 ----------
  WriteRegStr HKCU "Software\EtherNANConverter" "InstallPath" "$INSTDIR"
  WriteRegStr HKCU "Software\EtherNANConverter" "DisplayName" "以太NAN文件转换器"
  WriteRegStr HKCU "Software\EtherNANConverter" "Version" "2.3.0"
  WriteRegStr HKCU "Software\EtherNANConverter" "Publisher" "以太工作室"

  ; ---------- 默认开机自启动 ----------
  WriteRegStr HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "EtherNANConverter" '"$INSTDIR\${APP_EXECUTABLE_FILENAME}"'

  ; ---------- 开始菜单添加卸载入口 ----------
  CreateDirectory "$SMPROGRAMS\以太NAN文件转换器"
  CreateShortCut "$SMPROGRAMS\以太NAN文件转换器\卸载以太NAN文件转换器.lnk" "$INSTDIR\${UNINSTALL_FILENAME}"
!macroend

; ==========================================
; 卸载：清理注册表、自启动、开始菜单
; ==========================================
!macro customUnInstall
  ; ---------- 删除自启动注册表项 ----------
  DeleteRegValue HKCU "Software\Microsoft\Windows\CurrentVersion\Run" "EtherNANConverter"

  ; ---------- 删除应用注册表项 ----------
  DeleteRegKey HKCU "Software\EtherNANConverter"

  ; ---------- 删除 AppData 缓存和设置 ----------
  RMDir /r "$APPDATA\以太NAN文件转换器"
  RMDir /r "$LOCALAPPDATA\以太NAN文件转换器"
  RMDir /r "$APPDATA\file-converter"
  RMDir /r "$LOCALAPPDATA\file-converter"

  ; ---------- 删除开始菜单文件夹 ----------
  RMDir /r "$SMPROGRAMS\以太NAN文件转换器"
!macroend
