import type { Program } from "./explore";
import type { PublicActivity } from "./public-activities";

export type FieldPhoto = {
  large: string;
  small: string;
  width: number;
  height: number;
  alt: string;
};

export const homePhotos = {
  education: {
    large: "/photos/home/education-1440.webp",
    small: "/photos/home/education-720.webp",
    width: 1440, height: 810,
    alt: "주황색 부스에 둘러앉아 자료를 들고 대화하는 시군청년혁신가 워크숍 참가자들",
  },
  product: {
    large: "/photos/home/product-1600.webp",
    small: "/photos/home/product-800.webp",
    width: 1600, height: 900,
    alt: "수원대 WoW! 창업축제 모의투자 부스에서 참가자가 안내를 받으며 자료를 살펴보는 모습",
  },
  global: {
    large: "/photos/home/global-1600.webp",
    small: "/photos/home/global-800.webp",
    width: 1600, height: 900,
    alt: "대만 TASS 박람회에서 기술 전시 부스를 둘러보는 관람객들",
  },
} satisfies Record<Program["field"], FieldPhoto>;

export const programPhotos = {
  teamwork: {
    large: "/photos/programs/teamwork-1400.webp",
    small: "/photos/programs/teamwork-700.webp",
    width: 1400, height: 933,
    alt: "수원대 모두의창업 교육에서 화면을 가리키며 발표하는 참가자와 테이블에 둘러앉은 청중",
  },
  workshop: {
    large: "/photos/programs/workshop-1440.webp",
    small: "/photos/programs/workshop-720.webp",
    width: 1440, height: 960,
    alt: "한경국립대 창업 스케일업 멘토링에서 테이블에 마주 앉아 작은 물건을 보며 대화하는 두 사람",
  },
  planning: {
    large: "/photos/programs/planning-1440.webp",
    small: "/photos/programs/planning-720.webp",
    width: 1440, height: 1080,
    alt: "수원대 로컬콘텐츠 해커톤에서 노트북을 가운데 두고 의견을 나누는 팀원들",
  },
  prototype: {
    large: "/photos/programs/prototype-1440.webp",
    small: "/photos/programs/prototype-720.webp",
    width: 1440, height: 960,
    alt: "필드 다이브 참가자들이 시연 장비 앞에 모여 로봇의 작동을 살펴보는 모습",
  },
  presentation: {
    large: "/photos/programs/presentation-1400.webp",
    small: "/photos/programs/presentation-700.webp",
    width: 1400, height: 933,
    alt: "수원대 WoW! 스타트업 페스타에서 무대의 우수기업 사례 발표를 듣는 청중",
  },
  global: {
    large: "/photos/programs/global-1500.webp",
    small: "/photos/programs/global-750.webp",
    width: 1500, height: 1000,
    alt: "대만 TASS 박람회 중앙대학교 전시 부스에서 방문객에게 진열된 제품을 소개하는 모습",
  },
} satisfies Record<Program["photo"], FieldPhoto>;

type ActivityPhoto = FieldPhoto & { caption: string };

export const activityPhotos: Partial<Record<PublicActivity["slug"], ActivityPhoto[]>> = {
  "anseong-dreammaru": [
    {
      large: "/photos/activities/anseong-dreammaru/classroom-1600.webp",
      small: "/photos/activities/anseong-dreammaru/classroom-800.webp",
      width: 1600, height: 1200,
      alt: "안성시 꿈마루 강의실에서 참가자들이 화면의 도식을 보며 설명을 듣는 모습",
      caption: "창업 기초교육",
    },
    {
      large: "/photos/activities/anseong-dreammaru/online-marketing-1600.webp",
      small: "/photos/activities/anseong-dreammaru/online-marketing-800.webp",
      width: 1600, height: 1200,
      alt: "안성시 꿈마루 강사가 상품 상세페이지 제작 수업에서 화면의 예시를 가리키는 모습",
      caption: "온라인 마케팅 수업",
    },
    {
      large: "/photos/activities/anseong-dreammaru/benchmark-visit-1600.webp",
      small: "/photos/activities/anseong-dreammaru/benchmark-visit-800.webp",
      width: 1600, height: 1200,
      alt: "안성시 꿈마루 벤치마킹 방문지인 핸드아티코리아 전시장 입구",
      caption: "전시회 벤치마킹",
    },
  ],
  "suwon-wow-festival": [
    {
      large: "/photos/activities/suwon-wow-festival/festival-booth-1600.webp",
      small: "/photos/activities/suwon-wow-festival/festival-booth-800.webp",
      width: 1600, height: 1200,
      alt: "수원대 WoW! 창업축제 현수막을 따라 이어진 야외 홍보 부스",
      caption: "창업학 홍보 부스",
    },
    {
      large: "/photos/activities/suwon-wow-festival/ox-quiz-1600.webp",
      small: "/photos/activities/suwon-wow-festival/ox-quiz-800.webp",
      width: 1600, height: 1200,
      alt: "수원대 학생회관 앞 광장의 OX 퀴즈 구역에 모인 창업축제 참가자들",
      caption: "광장 OX 퀴즈",
    },
    {
      large: "/photos/activities/suwon-wow-festival/group-1600.webp",
      small: "/photos/activities/suwon-wow-festival/group-800.webp",
      width: 1600, height: 1200,
      alt: "수원대 WoW! 창업축제 참가자들이 학생회관 앞 광장에서 촬영한 단체사진",
      caption: "축제 기념사진",
    },
  ],
  "youth-innovators-workshop": [
    {
      large: "/photos/activities/youth-innovators-workshop/lecture-1600.webp",
      small: "/photos/activities/youth-innovators-workshop/lecture-800.webp",
      width: 1600, height: 1200,
      alt: "시군청년혁신가 워크숍에서 마이크를 든 강사가 화면을 가리키며 설명하는 모습",
      caption: "창업 워크숍 강의",
    },
    {
      large: "/photos/activities/youth-innovators-workshop/company-visit-1440.webp",
      small: "/photos/activities/youth-innovators-workshop/company-visit-720.webp",
      width: 1440, height: 1081,
      alt: "쿠키아를 방문한 워크숍 참가자들이 긴 테이블에 둘러앉아 전시 제품을 살펴보는 모습",
      caption: "쿠키아 기업 방문",
    },
    {
      large: "/photos/activities/youth-innovators-workshop/group-1440.webp",
      small: "/photos/activities/youth-innovators-workshop/group-720.webp",
      width: 1440, height: 1081,
      alt: "쿠키아를 방문한 참가자들이 시군청년혁신가 워크숍 현수막을 들고 선 모습",
      caption: "기업 방문 기념사진",
    },
  ],
  "local-content-hackathon": [
    {
      large: "/photos/activities/local-content-hackathon/team-discussion-1440.webp",
      small: "/photos/activities/local-content-hackathon/team-discussion-720.webp",
      width: 1440, height: 1081,
      alt: "로컬콘텐츠 해커톤에서 팀원들이 테이블에 둘러앉아 노트와 자료를 펼쳐 놓고 토론하는 모습",
      caption: "팀별 아이디어 회의",
    },
    {
      large: "/photos/activities/local-content-hackathon/team-pitch-1440.webp",
      small: "/photos/activities/local-content-hackathon/team-pitch-720.webp",
      width: 1440, height: 1081,
      alt: "로컬콘텐츠 해커톤 무대에서 참가자가 발표 자료를 띄우고 심사위원 앞에서 설명하는 모습",
      caption: "팀 발표와 심사",
    },
    {
      large: "/photos/activities/local-content-hackathon/awards-1440.webp",
      small: "/photos/activities/local-content-hackathon/awards-720.webp",
      width: 1440, height: 1081,
      alt: "수원대 로컬콘텐츠 해커톤 참가자들이 수상 표지판을 들고 촬영한 단체사진",
      caption: "해커톤 시상",
    },
  ],
};
