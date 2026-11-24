import React, { useEffect, useRef } from 'react';
import { Compartment, EditorState, Transaction, type Extension } from '@codemirror/state';
import {
  EditorView, keymap, lineNumbers, highlightActiveLine, highlightActiveLineGutter, drawSelection, dropCursor,
  rectangularSelection, crosshairCursor, highlightSpecialChars,
} from '@codemirror/view';
import { defaultKeymap, history, historyKeymap, indentWithTab } from '@codemirror/commands';
import { bracketMatching, foldGutter, indentOnInput, syntaxHighlighting, defaultHighlightStyle, indentUnit } from '@codemirror/language';
import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete';
import { oneDark } from '@codemirror/theme-one-dark';
import type { LabLang } from '../../lib/labs';

// 各语言的解析器按需加载：写前端实验的人不用下载 Python、Java 的语法包
const LOADERS: Partial<Record<LabLang, () => Promise<Extension>>> = {
  html: () => import('@codemirror/lang-html').then((m) => m.html()),
  css: () => import('@codemirror/lang-css').then((m) => m.css()),
  javascript: () => import('@codemirror/lang-javascript').then((m) => m.javascript()),
  typescript: () => import('@codemirror/lang-javascript').then((m) => m.javascript({ jsx: true, typescript: true })),
  python: () => import('@codemirror/lang-python').then((m) => m.python()),
  sql: () => import('@codemirror/lang-sql').then((m) => m.sql()),
  java: () => import('@codemirror/lang-java').then((m) => m.java()),
  kotlin: () => import('@codemirror/lang-java').then((m) => m.java()),   // CodeMirror 没有 Kotlin 模式，先按 Java 高亮
  markdown: () => import('@codemirror/lang-markdown').then((m) => m.markdown()),
};

/** 编辑器固定为深色（像 IDE），不随站点主题切换 */
const chrome = EditorView.theme({
  '&': { height: '100%', backgroundColor: '#0d1117', color: '#d6dee8', fontSize: '13px' },
  '.cm-scroller': { fontFamily: '"JetBrains Mono Variable", ui-monospace, Consolas, "Microsoft YaHei", monospace', lineHeight: '1.65', overflow: 'auto' },
  '.cm-content': { padding: '12px 0', caretColor: '#f27d26' },
  '.cm-gutters': { backgroundColor: '#0d1117', color: '#5b6676', border: 'none', paddingLeft: '4px' },
  '.cm-activeLineGutter': { backgroundColor: '#151b24', color: '#9aa6b6' },
  '.cm-activeLine': { backgroundColor: '#121822' },
  '&.cm-focused .cm-cursor': { borderLeftColor: '#f27d26' },
  '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: '#264f78 !important' },
  '.cm-tooltip': { backgroundColor: '#161c26', border: '1px solid #2a3442', borderRadius: '8px', overflow: 'hidden' },
  '.cm-tooltip-autocomplete ul li[aria-selected]': { backgroundColor: '#264f78', color: '#fff' },
  '.cm-panels': { backgroundColor: '#161c26', color: '#c9d4df' },
  '.cm-panels.cm-panels-top': { borderBottom: '1px solid #2a3442' },
  '.cm-searchMatch': { backgroundColor: '#5a4a1a', outline: '1px solid #8a7530' },
  '.cm-foldPlaceholder': { backgroundColor: '#2a3442', border: 'none', color: '#9aa6b6' },
}, { dark: true });

interface Props {
  value: string;
  onChange?: (value: string) => void;
  lang: LabLang;
  name?: string;
  readOnly?: boolean;
}

/**
 * 实验室的代码编辑器（CodeMirror 6）。
 * 值由外部控制：props.value 与编辑器内容不一致时（载入参考答案、重置、切换文件）才整体替换，
 * 读者自己的输入不会触发这次替换。
 */
export const CodeEditor: React.FC<Props> = ({ value, onChange, lang, name = '', readOnly = false }) => {
  const hostRef = useRef<HTMLDivElement | null>(null);
  const viewRef = useRef<EditorView | null>(null);
  const langComp = useRef(new Compartment());
  const readOnlyComp = useRef(new Compartment());
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  // 只创建一次
  useEffect(() => {
    if (!hostRef.current) return;
    const view = new EditorView({
      state: EditorState.create({
        doc: value,
        extensions: [
          lineNumbers(), foldGutter(), highlightActiveLineGutter(), highlightSpecialChars(), history(), drawSelection(),
          dropCursor(), rectangularSelection(), crosshairCursor(), highlightActiveLine(),
          indentOnInput(), bracketMatching(), closeBrackets(), autocompletion(), indentUnit.of('  '),
          syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
          keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...historyKeymap, ...completionKeymap, indentWithTab]),
          EditorView.lineWrapping,
          EditorView.contentAttributes.of({ spellcheck: 'false' }),
          langComp.current.of([]),
          readOnlyComp.current.of(EditorState.readOnly.of(readOnly)),
          oneDark, chrome,
          EditorView.updateListener.of((u) => { if (u.docChanged) onChangeRef.current?.(u.state.doc.toString()); }),
        ],
      }),
      parent: hostRef.current,
    });
    viewRef.current = view;
    return () => { view.destroy(); viewRef.current = null; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 语法高亮随当前文件的语言变化：解析器是按需下载的，加载完成前先不高亮
  useEffect(() => {
    let dead = false;
    const view = viewRef.current;
    if (!view) return;
    view.dispatch({ effects: langComp.current.reconfigure([]) });
    LOADERS[lang]?.().then((ext) => {
      if (!dead) viewRef.current?.dispatch({ effects: langComp.current.reconfigure(ext) });
    }).catch(() => { /* 解析器下载失败就保持不高亮 */ });
    return () => { dead = true; };
  }, [lang]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const cur = view.state.doc.toString();
    if (cur === value) return;
    view.dispatch({
      changes: { from: 0, to: cur.length, insert: value },
      // 外部整体替换不算进撤销历史
      annotations: Transaction.addToHistory.of(false),
    });
  }, [value]);

  useEffect(() => {
    viewRef.current?.dispatch({ effects: readOnlyComp.current.reconfigure(EditorState.readOnly.of(readOnly)) });
  }, [readOnly]);

  return <div ref={hostRef} className="h-full w-full overflow-hidden" />;
};

export default CodeEditor;
