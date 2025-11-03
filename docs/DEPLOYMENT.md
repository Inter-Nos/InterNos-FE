# 배포 가이드

Inter Nos 프론트엔드를 Docker를 사용하여 배포하는 방법을 안내합니다.

## 필수 요구사항

- Docker 20.10 이상
- Docker Compose 2.0 이상 (선택사항)

## 빌드 및 실행

### 방법 1: Docker Compose 사용 (권장)

```bash
# 환경 변수 설정
export NEXT_PUBLIC_API_A=https://api.internos.app/a/v1
export NEXT_PUBLIC_API_B=https://api.internos.app/b/v1
export NEXT_PUBLIC_APP_NAME=Inter\ Nos

# 빌드 및 실행
docker-compose up -d

# 로그 확인
docker-compose logs -f app

# 중지
docker-compose down
```

### 방법 2: Docker 직접 사용

```bash
# 이미지 빌드
docker build -t internos-fe:latest .

# 컨테이너 실행
docker run -d \
  --name internos-fe \
  -p 3000:3000 \
  -e NEXT_PUBLIC_API_A=https://api.internos.app/a/v1 \
  -e NEXT_PUBLIC_API_B=https://api.internos.app/b/v1 \
  -e NEXT_PUBLIC_APP_NAME="Inter Nos" \
  internos-fe:latest

# 로그 확인
docker logs -f internos-fe

# 중지
docker stop internos-fe
docker rm internos-fe
```

## 환경 변수

다음 환경 변수들을 설정할 수 있습니다:

| 변수명 | 기본값 | 설명 |
|--------|--------|------|
| `NEXT_PUBLIC_API_A` | `https://api.internos.app/a/v1` | Service A API URL |
| `NEXT_PUBLIC_API_B` | `https://api.internos.app/b/v1` | Service B API URL |
| `NEXT_PUBLIC_APP_NAME` | `Inter Nos` | 애플리케이션 이름 |
| `NODE_ENV` | `production` | 실행 환경 |
| `PORT` | `3000` | 서버 포트 |

## 프로덕션 배포

### Kubernetes 배포 예시

```yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: internos-fe
spec:
  replicas: 2
  selector:
    matchLabels:
      app: internos-fe
  template:
    metadata:
      labels:
        app: internos-fe
    spec:
      containers:
      - name: app
        image: internos-fe:latest
        ports:
        - containerPort: 3000
        env:
        - name: NEXT_PUBLIC_API_A
          value: "https://api.internos.app/a/v1"
        - name: NEXT_PUBLIC_API_B
          value: "https://api.internos.app/b/v1"
        - name: NEXT_PUBLIC_APP_NAME
          value: "Inter Nos"
        resources:
          requests:
            memory: "256Mi"
            cpu: "200m"
          limits:
            memory: "512Mi"
            cpu: "500m"
---
apiVersion: v1
kind: Service
metadata:
  name: internos-fe
spec:
  selector:
    app: internos-fe
  ports:
  - port: 80
    targetPort: 3000
  type: LoadBalancer
```

## 헬스 체크

애플리케이션은 다음 엔드포인트를 통해 헬스 체크할 수 있습니다:

```bash
curl http://localhost:3000
```

정상 응답 시 200 상태 코드를 반환합니다.

## 빌드 최적화

- **Multi-stage build**: 이미지 크기 최소화
- **Standalone output**: Next.js 독립 실행 모드 사용
- **Non-root user**: 보안 강화
- **Layer caching**: 빌드 속도 향상

## 트러블슈팅

### 빌드 실패

```bash
# 캐시 없이 재빌드
docker build --no-cache -t internos-fe:latest .
```

### 메모리 부족

```bash
# Docker 메모리 증설
# macOS: Docker Desktop > Preferences > Resources > Memory
# Linux: Docker daemon 설정 수정
```

### 포트 충돌

```bash
# 다른 포트 사용
docker run -p 8080:3000 internos-fe:latest
```

## 모니터링

```bash
# 컨테이너 리소스 사용량 확인
docker stats internos-fe

# 컨테이너 로그 확인
docker logs -f internos-fe

# 컨테이너 상태 확인
docker ps | grep internos-fe
```

## 백업 및 복구

```bash
# 이미지 저장
docker save internos-fe:latest | gzip > internos-fe.tar.gz

# 이미지 로드
docker load < internos-fe.tar.gz
```

## CI/CD 통합

### GitHub Actions 예시

```yaml
name: Build and Push Docker Image

on:
  push:
    branches: [main]

jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Build Docker image
        run: docker build -t internos-fe:${{ github.sha }} .
      
      - name: Push to registry
        run: |
          echo "${{ secrets.DOCKER_PASSWORD }}" | docker login -u "${{ secrets.DOCKER_USERNAME }}" --password-stdin
          docker push internos-fe:${{ github.sha }}
```

## 보안 체크리스트

- [ ] Non-root user 사용
- [ ] 최신 베이스 이미지 사용
- [ ] 민감 정보 환경 변수로 관리
- [ ] HTTPS 강제
- [ ] Security headers 설정
- [ ] 정기적인 이미지 스캔

## 성능 튜닝

- Node.js 메모리 제한 조정: `NODE_OPTIONS="--max-old-space-size=512"`
- 워커 수 조정: 컨테이너 replicas 증가
- CDN 사용: 정적 자산 캐싱
- 로드 밸런싱: 다중 인스턴스 배포

## 참고 자료

- [Next.js Docker 예제](https://github.com/vercel/next.js/tree/canary/examples/with-docker)
- [Docker 문서](https://docs.docker.com/)
- [Kubernetes 문서](https://kubernetes.io/docs/)

