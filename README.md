# E.T 공모전

> 공모전에 처음 참가하는 사람이 더 쉽게 지원할 수 있도록 돕는 서비스

2026 GDGoC 해커톤 · Team E (E.T) · 주제: **교육격차**

## 왜 만드나요

공모전에 처음 나가는 사람은 정보와 경험이 부족하고, 함께할 팀원을 구하기도 어렵습니다.
E.T 공모전은 이런 진입 장벽을 낮춰, 누구나 자신의 관심 분야와 역량에 맞는 공모전에 도전할 수 있게 합니다.

- **대상 사용자**: 공모전이 아직 익숙하지 않은 사람, 함께할 팀원이 없는 사람
- **해결 방식**: 관심 분야·역량 기반 공모전 추천, 팀원 모집 방 개설 및 기존 팀 참가

## 핵심 기능

| 기능 | 설명 |
|---|---|
| 사용자 판단 | 관심 분야와 역량을 파악하는 설문과 간단한 시험 |
| 공모전 추천 | 사용자 정보를 바탕으로 관심 분야 공모전 추천 |
| 공모전 정보 조회 | 추천된 공모전의 상세 정보 확인 |
| 팀원 모집 | 모집 방을 개설하거나 이미 만들어진 방에 참가 |
| 팀원 평가 | 팀원이 공모전에 얼마나 기여했는지 평가 |

## 사용 흐름

1. 가입할 때 관심 분야와 경험을 자유롭게 입력합니다.
   예: "학교에서 자바로 과제 좀 해봤고, 서버 쪽을 해보고 싶어요. IT 공모전은 처음이에요"
2. AI가 `IT` `백엔드` `Java` `초보` `배우고 싶음` 같은 카테고리를 붙이고, 사용자가 확인합니다.
3. 방을 검색하면 카테고리가 많이 겹치는 방부터 보입니다.
4. **참가 요청**을 누르면 AI가 쓴 메시지 초안을 확인하고 보냅니다.
5. 방장이 수락하면 팀이 확정되고, 팀원 목록과 각자의 카테고리를 확인합니다.

## AI 활용

- **관심 분야·역량 판단**: 자연어로 쓴 관심 분야를 분류하고, 사용자가 고른 역량을 검증할 문제를 만듭니다.
- **공모전 분류**: 가져온 공모전의 내용을 분석해 분류합니다.

## 이번 해커톤 범위

| 이번에 완성 | 추후 계획 |
|---|---|
| 공모전 API 연동 | 자동 매칭 |
| 사용자 설문 | 로그인 / 회원가입 |
| 공모전 참가자 평가 | 추천 공모전 알림 전송 |
| 로컬 서비스 | |

## 팀

| 이름 | 역할 |
|---|---|
| 이지호 | 팀장 |
| 이환주 | |
| 정유진 | |
| 이도훈 | UI/UX 디자인 |

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 백엔드 | Java 17 + Spring Boot 3.5.x | Gradle, 단일 애플리케이션 |
| DB 접근 | Spring Data JPA | 추천·방 목록 정렬은 `@Query(nativeQuery = true)` |
| DB | MySQL 8 (Docker) | `utf8mb4`, 로컬은 `docker compose`로 실행 |
| 프론트엔드 | React 19 + Vite + TypeScript | React Router, Tailwind CSS |
| API 문서 | springdoc-openapi (Swagger UI) | 기능 사이 API를 화면으로 맞춰 봄 |
| AI | 공통 인터페이스 `AiClient` + 대체 응답 | 제공자는 회의에서 확정 (X-3) |
| 공모전 수집 | 백엔드 안의 수집 기능 (Java `RestClient`) | 공모아뷰 MCP 호출 → 파싱 → upsert (B-1) |

### 백엔드

- **Java 17**: 팀 PC에 이미 깔려 있는 버전(Corretto 17)에 맞춥니다.
- **Spring Boot 3.5.x**: 자료와 예제가 가장 많은 3.x 마지막 버전입니다.
- 의존성: Spring Web, Spring Data JPA, MySQL Driver, Validation, Lombok, springdoc-openapi
- 사용자·방·요청·평가는 단순 CRUD라 JPA로 만들고, 겹침 점수 정렬(B-3, C-2)은 [기능 명세서](docs/feature-spec.md)의 SQL을 그대로 native query로 씁니다.
- **현재 사용자 (X-1)**: 로그인 대신 프론트가 모든 요청에 `X-User-Id` 헤더를 붙이고, 백엔드는 이 값을 현재 사용자로 씁니다. Spring Security는 넣지 않습니다.

담당자끼리 같은 파일을 덜 건드리도록 패키지는 계층이 아니라 기능으로 나눕니다.

```
backend/src/main/java/.../et/
├── common/     # X: 현재 사용자, 카테고리, AiClient, 예외 처리, 시드
├── user/       # A: 가입, 카테고리 확정, 평가, 프로필
├── contest/    # B: 수집, 분류, 추천, 상세
└── team/       # C: 방, 참가 요청, 수락·거절, 팀원 목록
```

### DB

- **MySQL 8**을 `docker compose`로 띄웁니다. 각자 PC에 MySQL을 설치하지 않아도 같은 환경이 됩니다.
- 문자셋은 `utf8mb4`입니다.
- `schema.sql`로 테이블을 만들고(JPA `ddl-auto=none`), `seed` 프로필로 실행하면 DB가 시연 시작 상태로 돌아갑니다 (X-5). 공모전 시드는 JSON 스냅샷을 읽어 수집과 **같은 upsert 코드**로 넣습니다.

### 프론트엔드

- **React + Vite + TypeScript**: 헤더 사용자 전환, 태그 빼고 더하기, AI 초안 채우기, 수락 후 모집 완료처럼 상태가 바뀌는 화면이 많아 React로 만듭니다. 태그 칩·방 카드 같은 컴포넌트는 세 사람이 같이 씁니다.
- **React Router**로 화면을 이동하고, **Tailwind CSS** 설정에 디자인의 색·간격을 한 번 넣어 같이 씁니다.
- 현재 사용자는 React Context에 두고 `localStorage`에 저장합니다. `fetch`를 감싼 `api.ts` 함수 하나에서 `X-User-Id`를 붙입니다.

## 저장소 구조

```
/
├── backend/            # Spring Boot (Gradle)
├── frontend/           # React + Vite
├── docker-compose.yml  # MySQL
└── docs/               # 기능 명세서, 시연용 데이터
```

## 실행 방법

```
docker compose up -d        # MySQL 3306
cd backend && ./gradlew bootRun   # Spring 8080
cd frontend && npm run dev        # Vite 5173, /api 요청은 8080으로 프록시
```

- Vite 프록시를 쓰므로 CORS 설정이 필요 없습니다.
- 시연 당일에는 `npm run build` 결과를 Spring의 `static/`에 넣어 8080 하나로 띄울 수도 있습니다.
