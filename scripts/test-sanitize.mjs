import { sanitize } from './lib/md-sanitize.mjs';
const cases = [
  '- *https://draw.io*',
  '可以看到返回的 http://DB_ADDRESS_TEST`` 是不一样的！',
  '通过 http://192.168.59.100/hello`` 可以看到资源已经更新。',
  '详细说明可以查看：https://redis.io/topics/distlock 。',
];
for (const c of cases) {
  console.log('IN :', c);
  console.log('OUT:', sanitize(c));
  console.log('---');
}
