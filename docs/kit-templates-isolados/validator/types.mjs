export const templateLimits = { zipBytes: 20_000_000, expandedBytes: 40_000_000, persistedBytes: 3_700_000, workingBytes: 58_000_000, files: 80, items: 40, htmlBytes: 150_000, cssBytes: 150_000 };
export function assetUrl(pack, path) { const asset = pack.assets.find(a => a.path === path); if (!asset)
    throw Error('Mídia ausente: ' + path); return asset.url || `data:${asset.mime};base64,${asset.data}`; }
export function mediaUrl(pack, value) { return value.startsWith('assets/') ? assetUrl(pack, value) : value; }
export const fieldId = /^[a-z][a-z0-9_-]{0,49}$/;
export function safeTemplateLink(value) { if (/^#[a-zA-Z][\w-]*$/.test(value))
    return true; try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password && !/^(localhost|127\.|10\.|192\.168\.|\[|0\.)/i.test(u.hostname);
}
catch {
    return false;
} }
export function fieldLink(field, value, values) { if (field.type === 'whatsapp') {
    const digits = value.replace(/\D/g, '');
    const message = (field.message || '').replace(/\{\{([a-z][a-z0-9_-]*)\}\}/g, (_, id) => values[id] || '');
    return 'https://wa.me/' + digits + (message ? '?text=' + encodeURIComponent(message) : '');
} return value; }
