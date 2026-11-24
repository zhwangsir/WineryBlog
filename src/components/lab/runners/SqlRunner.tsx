import React, { useCallback, useEffect, useRef, useState } from 'react';
import { AlertTriangle, ArrowLeft, Database as DatabaseIcon, RotateCcw } from 'lucide-react';
import initSqlJs, { type Database, type SqlJsStatic } from 'sql.js';
import sqlWasmUrl from 'sql.js/dist/sql-wasm.wasm?url';
import { cn } from '../../../utils/cn';
import type { RunnerProps } from '../types';

interface Resultset { columns: string[]; values: unknown[][] }
interface TableInfo { name: string; count: number; sql: string }

// sql.js 只初始化一次，所有实验共用
let engine: Promise<SqlJsStatic> | null = null;
const loadEngine = () => (engine ??= initSqlJs({ locateFile: () => sqlWasmUrl }).catch((e) => { engine = null; throw e; }));

const MAX_ROWS = 200;

interface Props extends RunnerProps {
  /** 建表与数据（实验专用的，或环境默认的练习库） */
  seed: string;
  /** 每次点「重置数据」加一 */
  resetId: number;
}

const cellText = (v: unknown) => (v === null || v === undefined ? null : typeof v === 'object' ? JSON.stringify(v) : String(v));

/** 数据库环境：浏览器里真实的 SQLite（sql.js），先灌入练习库再执行编辑器里的 SQL */
const SqlRunner: React.FC<Props> = ({ files, runId, resetId, seed, onOutput }) => {
  const [db, setDb] = useState<Database | null>(null);
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [results, setResults] = useState<Resultset[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [ms, setMs] = useState(0);
  const [peek, setPeek] = useState<string | null>(null);
  const dbRef = useRef<Database | null>(null);
  const filesRef = useRef(files);
  filesRef.current = files;
  const seedRef = useRef(seed);
  seedRef.current = seed;
  const onOutputRef = useRef(onOutput);
  onOutputRef.current = onOutput;

  const readTables = useCallback((d: Database) => {
    const meta = d.exec("SELECT name, sql FROM sqlite_master WHERE type = 'table' AND name NOT LIKE 'sqlite_%' ORDER BY name")[0];
    setTables((meta?.values ?? []).map((r) => {
      const name = String(r[0]);
      const n = d.exec(`SELECT COUNT(*) FROM "${name.replace(/"/g, '""')}"`)[0];
      return { name, count: Number(n?.values?.[0]?.[0] ?? 0), sql: String(r[1] || '') };
    }));
  }, []);

  /** 新建一个内存库并灌入数据 */
  const reseed = useCallback(async () => {
    const SQL = await loadEngine();
    dbRef.current?.close();
    const d = new SQL.Database();
    dbRef.current = d;
    d.run(seedRef.current);
    setDb(d);
    readTables(d);
    setPeek(null);
  }, [readTables]);

  const execute = useCallback((d: Database, sql: string) => {
    const t0 = performance.now();
    try {
      const res = d.exec(sql);
      setResults(res);
      setError(null);
      setMs(Math.round(performance.now() - t0));
      onOutputRef.current(res.map((r, i) => `结果 ${i + 1}：${r.values.length} 行`).join('\n') || '语句执行成功，没有返回结果集');
    } catch (e) {
      const msg = (e as Error).message;
      setResults([]);
      setError(msg);
      onOutputRef.current(`SQL 报错：${msg}`);
    }
  }, []);

  useEffect(() => {
    reseed().catch((e: Error) => setError(`SQLite 引擎加载失败：${e.message}`));
    return () => { dbRef.current?.close(); dbRef.current = null; };
  }, [reseed]);

  useEffect(() => {
    if (resetId > 0) reseed().catch(() => {});
  }, [resetId]);   // eslint-disable-line react-hooks/exhaustive-deps

  // 每次建好新库（打开实验、重置数据）都先执行一次当前的查询
  useEffect(() => {
    if (db) execute(db, filesRef.current['query.sql'] ?? Object.values(filesRef.current)[0] ?? '');
  }, [db]);   // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (runId > 0 && dbRef.current) {
      setPeek(null);
      execute(dbRef.current, filesRef.current['query.sql'] ?? Object.values(filesRef.current)[0] ?? '');
    }
  }, [runId]);   // eslint-disable-line react-hooks/exhaustive-deps

  const shown: Resultset[] = peek && dbRef.current
    ? (dbRef.current.exec(`SELECT * FROM "${peek.replace(/"/g, '""')}" LIMIT ${MAX_ROWS}`))
    : results;

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#0a0e13]">
      <div className="flex h-10 shrink-0 items-center gap-2 border-b border-[#1c2430] px-3">
          <DatabaseIcon className="h-3.5 w-3.5 text-[#2bbfae]" />
        <span className="text-[11px] font-semibold tracking-wide text-[#8b96a6]">{peek ? `数据表 · ${peek}` : '查询结果'}</span>
        {!error && !peek && results.length > 0 && <span className="text-[11px] text-[#5b6676]">{results.length} 个结果集 · {ms} ms</span>}
        {peek && (
          <button type="button" onClick={() => setPeek(null)} className="flex items-center gap-1 text-[11px] text-[#7d8899] transition-colors hover:text-[#d6dee8]">
            <ArrowLeft className="h-3 w-3" /> 回到查询结果
          </button>
        )}
        <button
          type="button"
          onClick={() => reseed().catch(() => {})}
          title="删掉当前数据，重新灌入练习库"
          className="ml-auto flex items-center gap-1 rounded-md px-2 py-1 text-[11px] text-[#7d8899] transition-colors hover:bg-[#1a212c] hover:text-[#d6dee8]"
        >
          <RotateCcw className="h-3 w-3" /> 重置数据
        </button>
      </div>

      <div className="flex min-h-0 flex-1">
        <div className="custom-scrollbar min-w-0 flex-1 space-y-4 overflow-auto p-3">
          {error && (
            <div className="flex items-start gap-2 rounded-lg border border-[#ff7b72]/40 bg-[#ff7b72]/10 px-3 py-2 text-[12.5px] leading-relaxed text-[#ffb4ad]">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-[#ff7b72]" />
              <div>
                <p className="font-semibold text-[#ff8f87]">SQL 执行出错</p>
                <p className="font-mono">{error}</p>
                <p className="mt-1 text-[11px] text-[#c98f8a]">编辑器里的全部 SQL 会按顺序执行，遇到第一条出错的语句就会停下。</p>
              </div>
            </div>
          )}
          {!error && shown.length === 0 && (
            <p className="select-none px-1 py-6 text-center text-[12.5px] text-[#5b6676]">
              {!db ? '正在加载 SQLite…' : results.length === 0 && !peek ? '语句执行成功，没有返回结果集（只有 SELECT 会返回表格）' : '查询结果为空'}
            </p>
          )}
          {shown.map((r, i) => (
            <div key={`${peek || 'q'}-${i}`} className="overflow-hidden rounded-lg border border-[#1c2430]">
              <div className="flex items-center gap-2 border-b border-[#1c2430] bg-[#0f141b] px-2.5 py-1 text-[11px] text-[#7d8899]">
                <span>{peek ? `${peek}（最多显示 ${MAX_ROWS} 行）` : `结果 ${i + 1}`}</span>
                <span className="rounded bg-[#1a212c] px-1.5 py-0.5 font-mono text-[#9aa6b6]">{r.values.length} 行 · {r.columns.length} 列</span>
              </div>
              {r.values.length === 0 ? (
                <p className="px-3 py-3 text-[12px] text-[#5b6676]">空结果集</p>
              ) : (
                <div className="custom-scrollbar overflow-auto">
                  <table className="w-full border-collapse font-mono text-[12px]">
                    <thead>
                      <tr>{r.columns.map((c, j) => <th key={j} className="sticky top-0 whitespace-nowrap bg-[#121822] px-3 py-1.5 text-left font-semibold text-[#9aa6b6]">{c}</th>)}</tr>
                    </thead>
                    <tbody>
                      {r.values.slice(0, MAX_ROWS).map((row, ri) => (
                        <tr key={ri} className="odd:bg-[#0a0e13] even:bg-[#0d1219] hover:bg-[#121b26]">
                          {row.map((v, ci) => {
                            const text = cellText(v);
                            return (
                              <td key={ci} className={cn('whitespace-nowrap px-3 py-1 text-[#c9d4df]', typeof v === 'number' && 'text-right tabular-nums')}>
                                {text === null ? <span className="italic text-[#5b6676]">NULL</span> : text}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {r.values.length > MAX_ROWS && <p className="border-t border-[#1c2430] px-3 py-1.5 text-[11px] text-[#7d8899]">只显示前 {MAX_ROWS} 行，共 {r.values.length} 行</p>}
                </div>
              )}
            </div>
          ))}
        </div>

        <aside className="flex w-48 shrink-0 flex-col border-l border-[#1c2430]">
          <p className="px-3 pt-2.5 pb-1.5 text-[11px] font-semibold tracking-wide text-[#8b96a6]">练习库 · {tables.length} 张表</p>
          <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-1.5 pb-2">
            {tables.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setPeek(t.name)}
                title={t.sql}
                className={cn('flex w-full items-center justify-between rounded-md px-2 py-1.5 text-left text-[12px] transition-colors', peek === t.name ? 'bg-[#26415f] text-[#d6dee8]' : 'text-[#9aa6b6] hover:bg-[#161d27] hover:text-[#d6dee8]')}
              >
                <span className="truncate font-mono">{t.name}</span>
                <span className="ml-2 shrink-0 text-[11px] tabular-nums text-[#5b6676]">{t.count}</span>
              </button>
            ))}
          </div>
          <p className="border-t border-[#1c2430] px-3 py-2 text-[11px] leading-relaxed text-[#5b6676]">点表名查看数据。这里的修改只存在于内存里，点「重置数据」即可还原。</p>
        </aside>
      </div>
    </div>
  );
};

export default SqlRunner;
