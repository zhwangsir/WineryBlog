// sql.js 没有自带类型声明，这里只声明实验室用到的部分
declare module 'sql.js' {
  export interface QueryExecResult {
    columns: string[];
    values: unknown[][];
  }
  export interface Database {
    /** 执行一条或多条语句；SELECT 返回结果集，其它语句返回空数组；出错时抛异常 */
    exec(sql: string, params?: unknown[]): QueryExecResult[];
    run(sql: string, params?: unknown[]): void;
    getRowsModified(): number;
    close(): void;
  }
  export interface SqlJsStatic {
    Database: new (data?: ArrayLike<number>) => Database;
  }
  export default function initSqlJs(config?: { locateFile?: (file: string) => string }): Promise<SqlJsStatic>;
}
