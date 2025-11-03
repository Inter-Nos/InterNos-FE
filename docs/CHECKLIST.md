# 프론트엔드 구현 체크리스트

frontend-spec.md 13절 체크리스트에 따른 구현 상태입니다.

## ✅ 완료된 항목

- [x] `/auth/session`에서 `csrfToken` 수신 및 상태변경 요청에 `X-CSRF-Token` 자동 첨부
  - 구현 위치: `lib/api.ts` - `fetchWithAuth` 함수
  - `GET /auth/session` 호출 시 `csrfToken` 저장 (`lib/session.ts`, `store/auth.ts`)
  - 모든 POST/PATCH/DELETE 요청 시 자동 헤더 첨부

- [x] `/rooms/{id}`(일반 메타)와 `/s/{id}/meta`(solve 상태) **혼용 금지**
  - `app/s/[id]/page.tsx`: `/s/{id}/meta`만 사용 (Solve 메타)
  - `app/rooms/page.tsx`: `/rooms/public` 사용 (공개 목록)
  - `app/dashboard/page.tsx`: RoomMeta 타입 사용 (일반 메타)

- [x] Solve 성공 전 **signedUrl 요청 금지**
  - `app/s/[id]/page.tsx`: `solveResult`가 있을 때만 이미지 렌더링
  - SolveForm에서 nonce → solve 요청 후 성공 시에만 signedUrl 표시

- [x] `ownerName` 스냅샷을 카드에 표시(서비스 B만으로 렌더)
  - `components/RoomCard.tsx`: `ownerName` 필드 표시
  - `types/api.ts`: PublicRoomCard와 RoomMeta에 `ownerName` 타입 정의

- [x] `423/429` **Retry-After** 처리(헤더/바디 모두 지원)
  - `lib/api.ts`: `handleResponse`에서 Retry-After 헤더 파싱
  - `app/s/[id]/page.tsx`: 카운트다운 타이머 구현
  - `details.retryAfterSec` 필드로도 지원

- [x] 이미지 업로드: presign→PUT→fileRef 저장 흐름 재시도/에러 UX
  - `components/ImageUploader.tsx`: presign → PUT → fileRef 저장
  - 진행률 표시, 에러 처리, 재시도 UI 포함

- [x] 접근성(라벨/포커스/대비) & 모바일 레이아웃 안정성
  - 모든 폼 필드에 `<label>` 연결
  - 터치 타겟 최소 44px (`min-h-[44px]`)
  - 키보드 네비게이션 지원 (onKeyDown)
  - 다크 테마 기본 (대비 4.5:1 이상)

- [x] 로깅에 정답/비번/토큰이 남지 않음
  - `lib/tracking.ts`: `trackEvent`에서 민감 정보 자동 마스킹
  - password, answer, token 등 자동 `[REDACTED]` 처리

## ⚠️ 백엔드 API 확장 필요

- [ ] 대시보드 내 방 목록 API
  - 현재 상태: API 명세서에 해당 엔드포인트 없음
  - 필요 API: `GET /me/rooms` 또는 `GET /rooms?ownerId={userId}`
  - 필요 데이터: 각 방별 방문/시도/성공/성공률
  - 위치: `app/dashboard/page.tsx` - 주석으로 명시됨

## 📝 선택적 사항

- [ ] 대시보드 SSR (서버 컴포넌트)
  - 현재: 클라이언트 컴포넌트 (`'use client'`)
  - 권장: frontend-spec.md에서 SSR 선호하지만 선택적
  - 구현 시: 쿠키 기반 세션 확인을 서버에서 처리 필요

## 구현 완료 요약

- ✅ 모든 주요 페이지 구현 (login, dashboard, rooms, create, solve)
- ✅ CSRF 토큰 자동 관리
- ✅ Solve 메타 분리 구현
- ✅ 이미지 업로드 플로우
- ✅ 이벤트 트래킹 구현
- ✅ 방 수정 기능 구현
- ✅ 에러 처리 및 Retry-After 지원
- ✅ 접근성 요구사항 충족

