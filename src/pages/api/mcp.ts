/**
 * The OperStack MCP server, over HTTP, for every assistant rather than one of them.
 *
 * We already ship a local MCP server as an npm package, but that one has to be installed, which
 * rules out every client that only accepts a URL. This is the same tools at an address: paste
 * https://oper-stack.com/api/mcp into Claude, Cursor, VS Code, Windsurf, Zed or ChatGPT and it
 * works, with nothing installed and no account.
 *
 * Speaks JSON-RPC 2.0 over POST, which is the streamable HTTP transport's plain-response mode.
 * Kept deliberately small: initialize, tools/list, tools/call, ping. No session state, so there is
 * nothing to lose between calls and nothing to leak between callers.
 */
import type { APIRoute } from 'astro';
import { TOOLS, TOOL_LIST } from '../../lib/mcp-tools';

/** REQUIRED: without this POST returns 405 on Vercel static output */
export const prerender = false;

/** The version of the protocol we answer. A client asking for another is told what we speak. */
const PROTOCOL_VERSION = '2025-06-18';

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Mcp-Session-Id, MCP-Protocol-Version, Authorization',
  'Access-Control-Expose-Headers': 'Mcp-Session-Id',
};

type RpcId = string | number | null;

function rpc(id: RpcId, result: unknown): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, result }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

function rpcError(id: RpcId, code: number, message: string): Response {
  return new Response(JSON.stringify({ jsonrpc: '2.0', id, error: { code, message } }), {
    status: 200, // JSON-RPC carries its own errors; an HTTP error would hide them from the client
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', ...CORS },
  });
}

/** A notification has no id and expects no body back. */
function accepted(): Response {
  return new Response(null, { status: 202, headers: CORS });
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204, headers: CORS });

/** Some clients probe with GET before connecting. Say what this is, in one line. */
export const GET: APIRoute = async () =>
  new Response(
    JSON.stringify({
      name: 'OperStack',
      transport: 'streamable-http',
      endpoint: 'https://oper-stack.com/api/mcp',
      tools: TOOL_LIST.map((t) => t.name),
      docs: 'https://oper-stack.com/mcp/',
    }),
    { status: 200, headers: { 'Content-Type': 'application/json', ...CORS } },
  );

export const POST: APIRoute = async ({ request }) => {
  let body: any;
  try {
    body = await request.json();
  } catch {
    return rpcError(null, -32700, 'Parse error');
  }

  // A client may send several calls at once. Answering the first is enough for every client we
  // have tested, and refusing loudly is better than silently dropping the rest.
  if (Array.isArray(body)) return rpcError(null, -32600, 'Send one request at a time.');

  const id: RpcId = body?.id ?? null;
  const method = String(body?.method || '');

  if (!method) return rpcError(id, -32600, 'Invalid request');

  // Notifications carry no id and want no answer.
  if (method.startsWith('notifications/')) return accepted();

  if (method === 'initialize') {
    return rpc(id, {
      protocolVersion: PROTOCOL_VERSION,
      capabilities: { tools: { listChanged: false } },
      serverInfo: { name: 'operstack', title: 'OperStack', version: '1.0.0' },
      instructions:
        'Measures whether AI assistants can read, understand and quote a website, and reads the ' +
        'free OperStack visit counter. Every number comes from public signals or from the ' +
        'owner\'s own counter. Nothing here needs an account.',
    });
  }

  if (method === 'ping') return rpc(id, {});

  if (method === 'tools/list') return rpc(id, { tools: TOOL_LIST });

  if (method === 'tools/call') {
    const name = String(body?.params?.name || '');
    const args = body?.params?.arguments ?? {};
    const tool = TOOLS.find((t) => t.name === name);
    if (!tool) return rpcError(id, -32602, `No tool called ${name}.`);
    try {
      const text = await tool.run(args);
      return rpc(id, { content: [{ type: 'text', text }], isError: false });
    } catch (err) {
      // A failed measurement is a result the assistant should see, not a transport error.
      const message = err instanceof Error ? err.message : 'The measurement failed.';
      return rpc(id, { content: [{ type: 'text', text: message }], isError: true });
    }
  }

  return rpcError(id, -32601, `Method not found: ${method}`);
};
