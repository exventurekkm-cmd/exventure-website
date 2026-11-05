import { test } from "node:test";
import assert from "node:assert/strict";
import { prepareInquiryEmail, createStartupNote } from "../src/lib/public-tools.ts";

test("email draft preserves Korean, line breaks and URL characters without adding mail headers", () => {
  const draft = prepareInquiryEmail("기관 협업", "교육 문의\r\nbcc=other@example.invalid", "일정: 11월\nA&B + C?", "exven@example.invalid");
  const query = new URL(draft.href).searchParams;
  assert.equal(query.get("subject"), "[엑스벤처 · 기관 협업] 교육 문의  bcc=other@example.invalid");
  assert.equal(query.get("bcc"), null);
  assert.equal(query.get("body"), draft.body);
  assert.match(draft.body, /일정: 11월\nA&B \+ C\?/);
  assert.equal(draft.includesBody, true);
});

test("long draft stays complete for copying and keeps the email URI short", () => {
  const message = "가나다라마바사 ".repeat(300).trim();
  const draft = prepareInquiryEmail("기타 문의", "긴 문의", message, "exven@example.invalid");
  assert.equal(draft.includesBody, false);
  assert.ok(draft.href.length < 1800);
  assert.equal(new URL(draft.href).searchParams.has("body"), false);
  assert.ok(draft.body.endsWith(message));
});

test("destination cannot add a recipient or query parameter", () => {
  assert.throws(() => prepareInquiryEmail("기타 문의", "제목", "내용", "company@example.invalid?bcc=x@example.invalid"));
});

test("each worksheet includes only its own questions and the user's answers", () => {
  const answers = { customer: " 지역 창업자 ", problem: "시장 검증의 어려움", solution: "소규모 인터뷰", next: "5명 인터뷰", question: "구매 상황", audience: "첫 구매 고객", sources: "직접 인터뷰", decision: "다음 실험 결정", unknown: "외부 값" };
  const plan = createStartupNote("plan", answers);
  const research = createStartupNote("research", answers);
  assert.match(plan, /1\. 핵심 고객\n지역 창업자/);
  assert.match(plan, /4\. 다음 실행\n5명 인터뷰/);
  assert.doesNotMatch(plan, /구매 상황|외부 값/);
  assert.match(research, /1\. 확인할 질문\n구매 상황/);
  assert.match(research, /4\. 결과 활용\n다음 실험 결정/);
  assert.doesNotMatch(research, /지역 창업자|외부 값/);
});
