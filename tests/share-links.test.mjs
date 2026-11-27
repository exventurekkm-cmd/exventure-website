import { strict as assert } from "node:assert";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import { workEntries, workEntry } from "../src/lib/work-entries.ts";
import { pageMetadata, shortOrigin } from "../src/lib/share-metadata.ts";

const destinations = {
  work: "https://workspace.exventure.co.kr/",
  roadmap: "https://workspace.exventure.co.kr/roadmap",
  research: "https://workspace.exventure.co.kr/research",
  respond: "https://workspace.exventure.co.kr/respond",
  consulting: "https://workspace.exventure.co.kr/consulting",
  mentoring: "https://workspace.exventure.co.kr/mentoring",
  assignments: "https://workspace.exventure.co.kr/assignments",
  companies: "https://workspace.exventure.co.kr/companies",
  account: "https://accounts.exventure.co.kr/account",
  accounts: "https://accounts.exventure.co.kr/accounts/manage",
};

test("each short link has one fixed destination and a public, branded preview", () => {
  assert.deepEqual(Object.fromEntries(workEntries.map(entry => [entry.slug, entry.destination])), destinations);
  assert.equal(workEntry("unknown"), undefined);
  for (const entry of workEntries) {
    const url = shortOrigin + "/" + entry.slug;
    const meta = pageMetadata(entry.title, entry.description, url, entry.slug);
    assert.equal(meta.openGraph.url, url);
    assert.equal(meta.alternates.canonical, url);
    assert.equal(meta.openGraph.title, entry.title + " | 엑스벤처");
    assert.deepEqual(meta.twitter.images, meta.openGraph.images);
    const image = new URL(meta.openGraph.images[0].url);
    assert.equal(image.hostname, "exventure.co.kr");
    const jpeg = readFileSync(new URL("../public" + image.pathname, import.meta.url));
    assert.equal(jpeg.readUInt16BE(0), 0xffd8);
  }
});

test("different public destinations retain their own canonical title and path", () => {
  const meta = pageMetadata("사업 분야", "사업 분야 소개", "/business");
  assert.equal(meta.alternates.canonical, "https://exventure.co.kr/business");
  assert.equal(meta.openGraph.title, "사업 분야 | 엑스벤처");
});
