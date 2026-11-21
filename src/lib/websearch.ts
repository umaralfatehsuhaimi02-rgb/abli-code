export interface WebResult { title: string; url: string; snippet: string }
export function withSearch(msgs: any[], results: WebResult[]): any[] {
  if (!results.length || !msgs.length) return msgs;
  const last = msgs[msgs.length - 1];
  if (!last || last.role !== 'user') return msgs;
  const lines = results.map((r, i) => '[' + (i + 1) + '] ' + r.title + ' (' + r.url + '): ' + r.snippet).join('\n');
  const note = '(Web search results for this message, fetched just now. Use them when they help and cite as [1], [2]. Ignore them if irrelevant.)\n' + lines;
  const out = msgs.slice();
  if (typeof last.content === 'string') out[out.length - 1] = { ...last, content: last.content + '\n\n' + note };
  else if (Array.isArray(last.content)) out[out.length - 1] = { ...last, content: [...last.content, { type: 'text', text: note }] };
  return out;
}
export function sourcesMd(results: WebResult[]): string {
  if (!results.length) return '';
  return '\n\n**Sources**\n' + results.map((r, i) => (i + 1) + '. [' + r.title.replace(/[\[\]]/g, '') + '](' + r.url + ')').join('\n');
}
