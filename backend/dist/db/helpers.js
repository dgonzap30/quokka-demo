import { text } from "drizzle-orm/sqlite-core";
import { randomUUID } from "crypto";
export function uuidColumn(name) {
    return text(name).notNull().primaryKey().$defaultFn(() => randomUUID());
}
export function uuidRefNotNull(name) {
    return text(name).notNull();
}
export function uuidRef(name) {
    return text(name);
}
export function generateUuid() {
    return randomUUID();
}
export function isValidUuid(value) {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    return uuidRegex.test(value);
}
//# sourceMappingURL=helpers.js.map