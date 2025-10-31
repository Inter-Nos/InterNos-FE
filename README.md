# Inter Nos Frontend

Inter Nos는 힌트를 보고 정답을 맞혀야 비밀 콘텐츠(텍스트·사진)가 열리는 서비스를 위한 모바일 전용 PWA 프론트엔드입니다.

## 기술 스택

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: Zustand
- **PWA**: Manifest + Service Worker

## 시작하기

### 필수 요구사항

- Node.js 18 이상
- npm 또는 yarn

### 설치

```bash
npm install
```

### 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가하세요:

```env
# Service A - Identity & Portal
NEXT_PUBLIC_API_A=https://api.internos.app/a/v1

# Service B - Secret Room
NEXT_PUBLIC_API_B=https://api.internos.app/b/v1

# App Name
NEXT_PUBLIC_APP_NAME=Inter Nos
```

### 개발 서버 실행

```bash
npm run dev
```

브라우저에서 [http://localhost:3000](http://localhost:3000)을 열어 확인하세요.

### 빌드

```bash
npm run build
npm start
```

## 프로젝트 구조

```
.
├── app/              # Next.js App Router 페이지
│   ├── dashboard/    # 대시보드 페이지
│   ├── rooms/        # 공개 방 목록 페이지
│   ├── create/       # 방 만들기 페이지
│   ├── s/[id]/       # 방 풀이 페이지
│   └── login/        # 로그인/가입 페이지
├── components/       # 재사용 가능한 컴포넌트
│   ├── Layout.tsx    # 공통 레이아웃
│   ├── Toast.tsx     # 알림 메시지
│   ├── KpiCard.tsx   # KPI 카드
│   ├── RoomCard.tsx  # 방 카드
│   ├── ImageUploader.tsx  # 이미지 업로더
│   ├── SolveForm.tsx # 정답 제출 폼
│   └── ShareModal.tsx # 공유 모달
├── lib/              # 유틸리티 및 API 클라이언트
│   ├── api.ts        # API 클라이언트 (Service A/B)
│   └── session.ts    # 세션 관리
├── store/            # Zustand 상태 관리
│   └── auth.ts       # 인증 상태
└── types/            # TypeScript 타입 정의
    ├── api.ts        # API 타입
    └── index.ts      # 컴포넌트 Props 타입
```

## 주요 기능

### 인증 및 세션 관리

- 가입/로그인 (username + password)
- HTTP-only 쿠키 기반 세션
- CSRF 토큰 자동 관리 (더블서브밋 패턴)
- 세션 상태 자동 동기화

### 방 관리

- 방 생성 (TEXT/IMAGE, 공개/비공개, 정책 설정)
- 이미지 업로드 (presign → PUT → GCS)
- 방 목록 조회 및 필터링
- 방 삭제 및 수정

### 방 풀이

- Solve 메타 조회 (정책, 남은 횟수, 락 상태)
- Nonce 기반 정답 검증
- TEXT/IMAGE 콘텐츠 표시
- 서명 URL 기반 이미지 접근 (프리패치 금지)

### 대시보드

- KPI 표시 (방문, 방 수, 해결률 등)
- 내 방 목록 관리
- 통계 시각화

## 보안 기능

- **CSRF Protection**: 모든 상태 변경 요청에 CSRF 토큰 자동 첨부
- **민감 정보 보호**: 비밀번호, 정답 등 민감 정보 로깅 금지
- **서명 URL**: 이미지 접근은 서명 URL로만 가능, 메모리에 저장하지 않음
- **비공개 방 은닉**: 접근 불가 시 404 에러 메시지로 존재 여부 은닉

## 접근성

- 모든 폼 필드에 `<label>` 연결
- 터치 타겟 최소 44px
- 키보드 네비게이션 지원
- 색상 대비 4.5:1 이상 (다크 테마)

## 성능 최적화

- 이미지 lazy loading
- 번들 최적화 (트리셰이킹)
- 요청 에러 핸들링 및 재시도

## API 연동

### Service A (Identity & Portal)

- `/auth/register` - 가입
- `/auth/login` - 로그인
- `/auth/session` - 세션 조회 (CSRF 토큰 포함)
- `/me/dashboard` - 대시보드 데이터

### Service B (Secret Room)

- `/rooms` - 방 CRUD
- `/rooms/public` - 공개 방 목록
- `/s/{id}/meta` - Solve 메타
- `/solve` - 정답 제출
- `/upload/presign` - 이미지 업로드 URL 발급

## 개발 가이드

### 새로운 페이지 추가

1. `app/` 디렉토리에 새 페이지 디렉토리 생성
2. `page.tsx` 파일 생성
3. 필요시 `Layout` 컴포넌트로 감싸기

### API 호출

```typescript
import { apiA, apiB } from '@/lib/api';

// Service A 호출
const session = await apiA.getSession();

// Service B 호출
const rooms = await apiB.getPublicRooms({ sort: 'trending' });
```

### 상태 관리

```typescript
import { useAuthStore } from '@/store/auth';

const { authenticated, user, csrfToken } = useAuthStore();
```

## 빌드 및 배포

### 프로덕션 빌드

```bash
npm run build
```

### 환경 변수

프로덕션 배포 시 환경 변수를 올바르게 설정해야 합니다:

- `NEXT_PUBLIC_API_A`: Service A API URL
- `NEXT_PUBLIC_API_B`: Service B API URL

## 라이선스

ISC
