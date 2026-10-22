!define MDQ_FILE_PROGID "com.mdquicklook.desktop.Markdown"
!define MDQ_CAPABILITIES "Software\com.mdquicklook.desktop\Capabilities"

!macro NSIS_HOOK_POSTINSTALL
  ; Cover both a document ProgID and the executable-based Open With entry.
  WriteRegStr SHCTX "Software\Classes\${MDQ_FILE_PROGID}\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "FriendlyAppName" "AI 文档快看"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".md" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\SupportedTypes" ".markdown" ""
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell" "" "open"
  WriteRegStr SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  DeleteRegValue SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe" "NoOpenWith"
  WriteRegStr SHCTX "Software\Classes\.md\OpenWithProgids" "${MDQ_FILE_PROGID}" ""
  WriteRegStr SHCTX "Software\Classes\.markdown\OpenWithProgids" "${MDQ_FILE_PROGID}" ""
  WriteRegStr SHCTX "${MDQ_CAPABILITIES}" "ApplicationName" "AI 文档快看"
  WriteRegStr SHCTX "${MDQ_CAPABILITIES}" "ApplicationDescription" "Markdown 阅读、编辑与导出工具"
  WriteRegStr SHCTX "${MDQ_CAPABILITIES}\FileAssociations" ".md" "${MDQ_FILE_PROGID}"
  WriteRegStr SHCTX "${MDQ_CAPABILITIES}\FileAssociations" ".markdown" "${MDQ_FILE_PROGID}"
  WriteRegStr SHCTX "Software\RegisteredApplications" "AI 文档快看" "${MDQ_CAPABILITIES}"

  ; Old installs used the generic Markdown ProgID. Repair it only if it still
  ; points to our executable; never replace another application's command.
  ReadRegStr $R0 SHCTX "Software\Classes\Markdown\shell\open\command" ""
  ${StrLoc} $R1 $R0 "${MAINBINARYNAME}.exe" ">"
  ${If} $R1 != ""
    WriteRegStr SHCTX "Software\Classes\Markdown\shell\open\command" "" '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
  ${EndIf}
  !insertmacro UPDATEFILEASSOC
!macroend

!macro NSIS_HOOK_POSTUNINSTALL
  ReadRegStr $R0 SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe\shell\open\command" ""
  ${If} $R0 == '"$INSTDIR\${MAINBINARYNAME}.exe" "%1"'
    DeleteRegKey SHCTX "Software\Classes\Applications\${MAINBINARYNAME}.exe"
    DeleteRegValue SHCTX "Software\Classes\.md\OpenWithProgids" "${MDQ_FILE_PROGID}"
    DeleteRegValue SHCTX "Software\Classes\.markdown\OpenWithProgids" "${MDQ_FILE_PROGID}"
    DeleteRegKey SHCTX "${MDQ_CAPABILITIES}"
    DeleteRegValue SHCTX "Software\RegisteredApplications" "AI 文档快看"
  ${EndIf}
  !insertmacro UPDATEFILEASSOC
!macroend
