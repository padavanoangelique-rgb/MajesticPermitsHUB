import type { LeadBrand } from "@/lib/brands";

export type NotionLeadInput = {
  hubId: string;
  name: string;
  phone: string;
  email: string;
  propertyAddress: string;
  projectType: string;
  brand: LeadBrand | string;
  source: string;
  status?: string;
  createdAt?: string;
};

type NotionPropertySchema = { name: string; type: string };

const FIELD_NAMES: Record<string, keyof NotionLeadInput | "status" | "createdAt"> = {
  Name: "name",
  Phone: "phone",
  Email: "email",
  "Property address": "propertyAddress",
  "Project type": "projectType",
  Brand: "brand",
  Source: "source",
  Status: "status",
  Created: "createdAt",
  "Hub record id": "hubId",
};

function notionConfigured() {
  return Boolean(process.env.NOTION_TOKEN && process.env.NOTION_LEADS_DATABASE_ID);
}

async function notionFetch(path: string, init?: RequestInit) {
  const token = process.env.NOTION_TOKEN;
  const res = await fetch(`https://api.notion.com/v1${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      "Notion-Version": "2022-06-28",
      "Content-Type": "application/json",
      ...(init?.headers || {}),
    },
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    const message = json?.message || `Notion request failed (${res.status})`;
    throw new Error(message);
  }
  return json;
}

function propertyValue(type: string, value: string) {
  const text = value.slice(0, 2000);
  switch (type) {
    case "title":
      return { title: [{ type: "text", text: { content: text } }] };
    case "rich_text":
      return { rich_text: [{ type: "text", text: { content: text } }] };
    case "email":
      return { email: text };
    case "phone_number":
      return { phone_number: text };
    case "url":
      return { url: text };
    case "select":
      return { select: { name: text } };
    case "status":
      return { status: { name: text } };
    case "multi_select":
      return { multi_select: [{ name: text }] };
    case "date":
      return { date: { start: text } };
    default:
      return null;
  }
}

function readField(input: NotionLeadInput, key: string) {
  if (key === "status") return input.status || "New";
  if (key === "createdAt") return input.createdAt || new Date().toISOString();
  const field = FIELD_NAMES[key];
  if (!field || field === "status" || field === "createdAt") return "";
  return String(input[field] ?? "");
}

function buildProperties(
  schema: NotionPropertySchema[],
  input: NotionLeadInput
) {
  const properties: Record<string, unknown> = {};
  for (const prop of schema) {
    const key = Object.keys(FIELD_NAMES).find(
      (name) => name.toLowerCase() === prop.name.toLowerCase()
    );
    if (!key) continue;
    const raw = readField(input, key);
    if (!raw) continue;
    const value = propertyValue(prop.type, raw);
    if (value) properties[prop.name] = value;
  }
  return properties;
}

async function databaseSchema(databaseId: string): Promise<NotionPropertySchema[]> {
  const db = await notionFetch(`/databases/${databaseId}`);
  const props = db?.properties || {};
  return Object.values(props).map((prop: any) => ({
    name: String(prop.name),
    type: String(prop.type),
  }));
}

function hubIdFilter(schema: NotionPropertySchema[], hubId: string) {
  const prop = schema.find((item) => item.name.toLowerCase() === "hub record id");
  if (!prop) return null;
  if (prop.type === "title") return { property: prop.name, title: { equals: hubId } };
  if (prop.type === "rich_text") {
    return { property: prop.name, rich_text: { equals: hubId } };
  }
  return null;
}

/**
 * Upsert one row in the single Notion leads database.
 * Missing env, a missing property, or a Notion error is logged and swallowed.
 * The Hub save must still succeed.
 */
export async function upsertNotionLead(input: NotionLeadInput) {
  if (!notionConfigured()) {
    console.warn(
      "Notion lead sync skipped: NOTION_TOKEN or NOTION_LEADS_DATABASE_ID is not set"
    );
    return { ok: false, skipped: true };
  }

  const databaseId = process.env.NOTION_LEADS_DATABASE_ID!.trim();

  try {
    const schema = await databaseSchema(databaseId);
    const properties = buildProperties(schema, input);
    const filter = hubIdFilter(schema, input.hubId);

    if (filter) {
      const found = await notionFetch(`/databases/${databaseId}/query`, {
        method: "POST",
        body: JSON.stringify({ filter, page_size: 1 }),
      });
      const existingId = found?.results?.[0]?.id;
      if (existingId) {
        await notionFetch(`/pages/${existingId}`, {
          method: "PATCH",
          body: JSON.stringify({ properties }),
        });
        return { ok: true, skipped: false };
      }
    }

    await notionFetch("/pages", {
      method: "POST",
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties,
      }),
    });
    return { ok: true, skipped: false };
  } catch (err) {
    console.error("Notion lead sync failed", err);
    return { ok: false, skipped: false };
  }
}
