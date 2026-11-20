# E.T 공모전

공모전 초보자에게 공모전을 추천하고 팀원 모집을 돕는 서비스. 2026 GDGoC 해커톤 Team E.

## 실행

- DB: `docker compose up -d`
- 백엔드: `cd backend && ./gradlew bootRun`
- 프론트: `cd frontend && npm run dev`
- 프론트 빌드·린트: `npm run build`, `npm run lint`

## 규칙

- 백엔드 패키지는 계층이 아니라 기능별로 나눈다. 내 기능 밖의 패키지는 고치지 않는다.
- `common/`(백엔드·프론트)은 기능 명세서 X 담당자가 자기 기능 부분만 고친다: X-1 사용자 전환 A, X-2 카테고리·X-5 시드 B, X-3 AiClient·X-6 D-Day 배지 D. 그 밖의 공통 코드는 고치기 전에 팀에 알린다.
- 현재 사용자는 `X-User-Id` 헤더로 받는다. Spring Security를 넣지 않는다.
- 추천·방 목록 정렬은 docs/db-spec.md 5장의 SQL을 `@Query(nativeQuery = true)`로 그대로 쓴다.
- AI 호출은 `AiClient` 인터페이스를 거치고, 실패하면 대체 응답을 돌려준다.

## 코드 주석 금지

코드 파일(.java, .ts, .tsx, .css, .sql 등)에 주석을 쓰지 않는다.

- `//`, `/* */`, Javadoc(`/** */`), JSX `{/* */}`, `// TODO`, `// FIXME` 모두 포함한다.
- "추가함", "수정함"처럼 변경 내역을 적는 주석도 쓰지 않는다. 변경 설명은 커밋 메시지와 PR에 쓴다.
- 주석으로 설명하고 싶어지면 이름을 더 분명하게 바꾸거나 메서드로 뽑는다.
- 이미 있는 주석은 맡은 작업과 관계없으면 지우지 않는다.

이유: 4명이 짧은 기간에 같은 코드를 고치므로, 코드와 어긋난 주석이 남으면 잘못된 정보가 된다.

## 참고 문서

- 기능 명세: docs/feature-spec.md
- DB 명세: docs/db-spec.md
