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
| 공모전 정보 조회 | 추천된 공모전의 상세 정보와 마감까지 남은 날(D-Day) 확인 |
| 관심 공고 저장 | 마음에 드는 공모전을 저장해 두고 모아 보기 |
| 팀원 모집 | 모집 방을 개설하거나 이미 만들어진 방에 참가 |
| 팀원 평가 | 팀원이 공모전에 얼마나 기여했는지 익명으로 평가 |

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
| 이도훈 | |

4명 모두 풀스택으로, 기능 하나를 DB·API·화면까지 맡습니다 (담당 A·B·C·D, [기능 명세서](docs/feature-spec.md)).

## 기술 스택

| 영역 | 선택 | 비고 |
|---|---|---|
| 백엔드 | Java 17 + Spring Boot 3.5.16 | Gradle 8.14 (wrapper 포함), 단일 애플리케이션 |
| DB 접근 | Spring Data JPA | 추천·방 목록 정렬은 `@Query(nativeQuery = true)` |
| DB | MySQL 8.4 (Docker) | `utf8mb4`, 로컬은 `docker compose`로 실행 |
| 프론트엔드 | React 19 + Vite 8 + TypeScript | React Router 7, Tailwind CSS 4 |
| API 문서 | springdoc-openapi (Swagger UI) | 기능 사이 API를 화면으로 맞춰 봄 |
| AI | 공통 인터페이스 `AiClient` + 대체 응답 | GPT로 가정 (키 `ET_GPT_API_KEY`), 회의에서 확정 (X-3) |
| 공모전 수집 | 백엔드 안의 수집 기능 (Java `RestClient`) | 공모아뷰 MCP 호출 → 파싱 → upsert (B-1) |

### 백엔드

- **Java 17**: 팀 PC에 이미 깔려 있는 버전(Corretto 17)에 맞춥니다.
- **Spring Boot 3.5.16**: 자료와 예제가 가장 많은 3.x 마지막 버전입니다. Spring Initializr에는 이제 4.x만 있으니 새로 만들지 말고 저장소의 `build.gradle`을 그대로 씁니다.
- 의존성: Spring Web, Spring Data JPA, MySQL Driver, Validation, Lombok, springdoc-openapi
- 사용자·방·요청·평가는 단순 CRUD라 JPA로 만들고, 겹침 점수 정렬(B-3, C-2)은 [DB 명세서](docs/db-spec.md) 5장의 SQL을 그대로 native query로 씁니다.
- **현재 사용자 (X-1)**: 로그인 대신 프론트가 모든 요청에 `X-User-Id` 헤더를 붙이고, 백엔드는 이 값을 현재 사용자로 씁니다. Spring Security는 넣지 않습니다.

담당자끼리 같은 파일을 덜 건드리도록 패키지는 계층이 아니라 기능으로 나눕니다.

```
backend/src/main/java/com/gdgoc/et/
├── common/     # X: 현재 사용자, AiClient, 예외 처리, 시드 러너
├── user/       # A: 가입, 카테고리 목록·확정
├── contest/    # B: 수집, 분류, 추천, 상세
├── team/       # C: 방, 참가 요청, 수락·거절, 팀원 목록
├── bookmark/   # D: 관심 공고 저장·목록
└── profile/    # D: 팀원 평가, 프로필
```

담당끼리는 다른 패키지의 클래스를 import하지 않습니다. 다른 담당의 테이블은 native SQL로 읽기만 하고, 화면 이동은 경로로만 연결합니다 ([담당 사이 접점](docs/feature-spec.md#담당-사이-접점)).

### DB

- **MySQL 8**을 `docker compose`로 띄웁니다. 각자 PC에 MySQL을 설치하지 않아도 같은 환경이 됩니다.
- 문자셋은 `utf8mb4`입니다.
- `backend/src/main/resources/db/schema/`의 담당별 파일(`user.sql`, `contest.sql`, `team.sql`, `bookmark.sql`, `profile.sql`)로 테이블을 만들고(JPA `ddl-auto=none`, 앱을 켤 때마다 `application.yml`에 적은 순서로 실행), `seed` 프로필로 실행하면 DB가 시연 시작 상태로 돌아갑니다 (X-5). 시드는 담당별 `SeedContributor`가 자기 테이블만 넣고, 러너가 순서대로 부릅니다. 공모전 시드는 JSON 스냅샷을 읽어 수집과 **같은 upsert 코드**로 넣습니다.

### 프론트엔드

- **React + Vite + TypeScript**: 헤더 사용자 전환, 태그 빼고 더하기, AI 초안 채우기, 수락 후 모집 완료처럼 상태가 바뀌는 화면이 많아 React로 만듭니다. 태그 칩·방 카드·D-Day 배지 같은 컴포넌트는 네 사람이 같이 씁니다.
- **React Router**로 화면을 이동하고, **Tailwind CSS** 설정에 디자인의 색·간격을 한 번 넣어 같이 씁니다.
- 현재 사용자는 React Context에 두고 `localStorage`에 저장합니다. `fetch`를 감싼 `src/api/client.ts`의 `api()` 함수 하나에서 `X-User-Id`를 붙입니다.

화면 경로는 기능 폴더의 `routes.tsx`에만 추가합니다. `App.tsx`는 고치지 않아도 되게 만들어 두었습니다.

```
frontend/src/
├── api/client.ts         # API 호출 (X-User-Id 자동)
├── common/               # X: 공통 레이아웃·헤더, 현재 사용자 (useCurrentUser)
└── features/
    ├── user/routes.tsx     # A
    ├── contest/routes.tsx  # B
    ├── team/routes.tsx     # C
    ├── bookmark/routes.tsx # D
    └── profile/routes.tsx  # D
```

### 공통 코드 쓰는 법

코드에는 주석을 쓰지 않으므로([AGENTS.md](AGENTS.md)) 공통 코드 사용법은 여기에 적습니다.

| 하고 싶은 것 | 쓰는 법 |
|---|---|
| 백엔드에서 현재 사용자 ID 받기 | 컨트롤러 파라미터에 `@CurrentUser Long userId`. 헤더가 없으면 400. 없어도 되면 `@CurrentUser(required = false)` |
| 백엔드에서 에러 응답 | `throw new ApiException(HttpStatus.BAD_REQUEST, "메시지")` → `{"message": "메시지"}` |
| 테이블 만들기 | `backend/src/main/resources/db/schema/`의 내 담당 파일에 추가 ([DB 명세서 4장](docs/db-spec.md#4-ddl-dbschemasql) 기준). 파일이 없으면 건너뜀 |
| 프론트에서 API 호출 | `await api<Contest[]>('/api/contests/recommended')`, `await api('/api/...', { method: 'POST', body: {...} })`. 실패하면 `ApiError` (`status`, `message`) |
| 프론트에서 현재 사용자 | `const { userId, setUserId } = useCurrentUser()` |
| 화면 추가 | 내 기능 폴더의 `routes.tsx`에 `{ path, label, element }` 한 줄. 첫 화면(개발용 화면 목록)에 자동으로 링크가 생김 |
| 디자인 색 쓰기 | `frontend/src/index.css`의 `@theme`에 토큰 추가 → `bg-brand`, `text-brand`, `border-line`처럼 사용 |

## 저장소 구조

```
/
├── backend/            # Spring Boot (Gradle)
├── frontend/           # React + Vite
├── docker-compose.yml  # MySQL
├── .env.example        # DB 포트·비밀번호, AI 키 예시
└── docs/               # 기능 명세서, 시연용 데이터, DB 명세서
```

## 로컬 개발 환경

### 준비물

| 도구 | 버전 | 확인 명령 |
|---|---|---|
| JDK | 17 | `java -version` |
| Node.js | 20.19 이상 (권장 22 또는 24) | `node -v` |
| Docker Desktop | 최신 | `docker --version` (Docker Desktop을 **켜 둔 상태**여야 합니다) |
| Git | 아무 버전 | `git --version` |

Gradle과 MySQL은 따로 설치하지 않습니다. Gradle은 wrapper가 내려받고, MySQL은 Docker로 띄웁니다.

### 처음 한 번

```powershell
git clone https://github.com/Dohoon306/ET-gongmo.git
cd ET-gongmo
copy .env.example .env        # macOS: cp .env.example .env
cd frontend
npm install
```

PC에 MySQL이 이미 깔려 있어 3306 포트를 쓰고 있다면, `.env`의 `DB_PORT=3306`을 `DB_PORT=3307`로 바꿉니다. Docker와 백엔드가 같은 값을 읽으므로 다른 곳은 고칠 필요가 없습니다.

### 실행 (터미널 3개)

```powershell
# 1. 저장소 루트: MySQL
docker compose up -d

# 2. backend 폴더: Spring 8080 (macOS: ./gradlew bootRun)
.\gradlew.bat bootRun

# 3. frontend 폴더: Vite 5173
npm run dev
```

IntelliJ에서 `backend` 폴더를 열고 `EtApplication`을 실행해도 됩니다.

### 잘 됐는지 확인

- http://localhost:5173 을 열면 헤더 오른쪽에 초록색 **서버·DB 연결됨**이 보입니다.
- http://localhost:8080/swagger-ui.html 에서 API 목록을 봅니다.
- `.\gradlew.bat test`는 DB 없이도 통과합니다.

| 증상 | 해결 |
|---|---|
| `docker compose up`에서 `ports are not available` | 3306을 다른 프로그램이 쓰는 중입니다. `.env`의 `DB_PORT`를 3307로 바꾸고 다시 실행 |
| `docker` 명령이 `pipe` 오류를 냄 | Docker Desktop이 꺼져 있습니다. 켜고 고래 아이콘이 멈출 때까지 기다리기 |
| 헤더에 **서버 연결 안 됨** | 백엔드(8080)가 안 떠 있습니다 |
| 헤더에 **DB 연결 안 됨** | MySQL 컨테이너가 꺼져 있거나 `.env` 값이 다릅니다. `docker compose ps`로 확인 |
| DB를 처음 상태로 지우고 싶음 | `docker compose down -v` 후 다시 `docker compose up -d` |
| DDL 파일의 컬럼을 바꿨는데 반영이 안 됨 | 이미 있는 테이블은 건너뛰기 때문입니다. `docker compose down -v`로 지우고 다시 띄우기 |

### 그 밖에

- `/api` 요청은 Vite가 8080으로 넘기므로 CORS 설정이 필요 없습니다.
- 시연 당일에는 `npm run build` 결과를 Spring의 `static/`에 넣어 8080 하나로 띄울 수도 있습니다.
- 줄바꿈은 `.gitattributes`로 LF로 맞춰 두었습니다.
