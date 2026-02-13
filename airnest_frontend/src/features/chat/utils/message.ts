import type { Message } from '@chat/types/types';

// 用 Map 做一个唯一消息集合，以 id 或 clientId 去重，新的字段覆盖旧的；最后按 created_at 排序
export function dedupMerge(oldList: Message[], incoming: Message[]): Message[] {
  const map = new Map<string, Message>();

  const put = (message: Message) => {
    const idKey = message.id ?? '';
    const clientKey = message.clientId ?? '';
    const existed =
      (idKey && map.get(idKey)) ||
      (clientKey && map.get(clientKey));

    if (existed) {
      const merged = { ...existed, ...message };
      const finalKey = merged.id ?? merged.clientId!;
      if (merged.id && merged.clientId && merged.id !== merged.clientId) {
        map.delete(merged.clientId);
      }
      map.set(finalKey, merged);
      return;
    }

    map.set(idKey || clientKey, { ...message });
  };

  oldList.forEach(put);
  incoming.forEach(put);//覆盖旧状态

  return Array.from(map.values()).sort((a, b) => {
    const ta = a.created_at ? Date.parse(a.created_at) : 0;
    const tb = b.created_at ? Date.parse(b.created_at) : 0;
    return ta - tb;
  });
}

export function isNearBottom(el: HTMLElement | null, threshold = 80): boolean {
  if (!el) return true;
  const dist = el.scrollHeight - el.scrollTop - el.clientHeight;
  return dist <= threshold;
}
