import 'fake-indexeddb/auto';
import '@testing-library/jest-dom/vitest';
import { deserialize, serialize } from 'node:v8';
if (!globalThis.structuredClone) globalThis.structuredClone = value => deserialize(serialize(value));
