// The web app has no tools, so replies carry files in the chat. Ask the model to label each file so the app can save it or zip a folder.
const FENCE = String.fromCharCode(96).repeat(3);
const HINT = '(Reply note: you cannot run commands here, but the user can save files and download folders straight from the chat. When you write code or a project, put every file in its own code block with its path after the language, for example ' + FENCE + 'python src/main.py. Keep one file per block. Never say you cannot create files or folders. For a Windows program, write the code and say it can be turned into an exe with the build-exe.bat that comes in the downloaded folder.)';
export function withFileHint(msgs: any[], isDesktop: boolean): any[] {
  if (isDesktop || !msgs.length) return msgs;
  const out = msgs.slice();
  const last = out[out.length - 1];
  if (!last || last.role !== 'user') return msgs;
  if (typeof last.content === 'string') out[out.length - 1] = { ...last, content: last.content + '\n\n' + HINT };
  else if (Array.isArray(last.content)) out[out.length - 1] = { ...last, content: [...last.content, { type: 'text', text: HINT }] };
  return out;
}
