const workspace = "https://workspace.exventure.co.kr";
const accounts = "https://accounts.exventure.co.kr";

export const workEntries = [
  { slug: "work", title: "업무 공간", description: "회사 계정으로 내게 배정된 업무를 확인하세요.", destination: workspace + "/" },
  { slug: "roadmap", title: "기업 진단·로드맵", description: "기업별 진단과 분기별 실행 계획을 확인하세요.", destination: workspace + "/roadmap" },
  { slug: "research", title: "소비자 반응조사", description: "조사 자료 수집부터 응답 분석과 결과보고서까지 관리합니다.", destination: workspace + "/research" },
  { slug: "respond", title: "조사 참여", description: "초대받은 이메일로 본인에게 배정된 조사를 확인하고 응답합니다.", destination: workspace + "/respond" },
  { slug: "consulting", title: "컨설팅 일지", description: "상담 자료와 회차별 컨설팅 기록을 확인하세요.", destination: workspace + "/consulting" },
  { slug: "modoo", title: "모두의 창업 지원서", description: "작성자와 저장된 지원서 초안을 확인합니다.", destination: workspace + "/modoo" },
  { slug: "mentoring", title: "컨설팅 사업관리", description: "참여기업, 멘토 배정, 회차 일정과 보고서를 관리합니다.", destination: workspace + "/mentoring" },
  { slug: "assignments", title: "내 담당 업무", description: "회사 계정에 배정된 업무와 결과물을 확인하세요.", destination: workspace + "/assignments" },
  { slug: "companies", title: "사내 회사정보", description: "회사 기본정보와 증빙 자료를 관리합니다.", destination: workspace + "/companies" },
  { slug: "account", title: "내 계정", description: "회사 계정의 프로필과 로그인 설정을 확인하세요.", destination: accounts + "/account" },
  { slug: "accounts", title: "계정·권한 관리", description: "회사 구성원의 계정과 업무별 접근 권한을 관리합니다.", destination: accounts + "/accounts/manage" },
] as const;

export function workEntry(slug: string) {
  return workEntries.find(entry => entry.slug === slug);
}
