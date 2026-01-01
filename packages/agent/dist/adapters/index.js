import { transferBotAdapter } from "./transfer-bot.js";
const adapters = new Map([
    [transferBotAdapter.id, transferBotAdapter],
]);
export function getAdapter(id) {
    return adapters.get(id);
}
export function getAllAdapters() {
    return Array.from(adapters.values());
}
export function getAdapterMetadata() {
    return getAllAdapters().map(({ id, name, description, icon, version, author, requiredPermissions, }) => ({
        id,
        name,
        description,
        icon,
        version,
        author,
        requiredPermissions,
    }));
}
export * from "./types.js";
export { transferBotAdapter } from "./transfer-bot.js";
