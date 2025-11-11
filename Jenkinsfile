// Jenkinsfile (Final & Complete Version for GKE Autopilot)
pipeline {
    // Kaniko 작업을 실행할 전용 작업 환경(Pod)을 직접 정의
    agent {
        kubernetes {
            // 이 Pod는 Jenkins가 설치된 'jenkins' 네임스페이스에 생성됨
            namespace 'jenkins'
            // Pod의 설계도 (YAML 형식)
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
              # 이 Pod가 'jenkins' 서비스 계정을 사용하도록 명시하여 Workload Identity 권한 상속
              serviceAccountName: jenkins
              containers:
              - name: kaniko
                image: gcr.io/kaniko-project/executor:debug
                imagePullPolicy: Always
                command:
                - /busybox/sleep
                args:
                - "3600"
                # 리소스 요청 추가: Autopilot의 기본 디스크(1Gi) 한계를 극복하기 위함
                resources:
                  requests:
                    # 임시 스토리지(디스크)를 5GiB 요청
                    ephemeral-storage: "5Gi"
            """
        }
    }

    // 파이프라인 전체에서 사용할 환경 변수
    environment {
        PROJECT_ID = 'k8s-cicd-lab'
        REGION = 'asia-northeast3'
        REPO_NAME = 'internos-repo'
        IMAGE_NAME = 'frontend'
    }

    stages {
        // 첫 번째 단계: 소스 코드 가져오기
        stage('Checkout Source Code') {
            steps {
                // 'kaniko' 라는 이름의 컨테이너 안에서 checkout 명령을 실행
                container('kaniko') {
                    // kaniko:debug 이미지에는 git이 포함되어 있음
                    checkout scm
                }
            }
        }

        // 두 번째 단계: Kaniko로 이미지 빌드 및 푸시
        stage('Build and Push with Kaniko') {
            steps {
                // 'kaniko' 컨테이너 안에서 모든 작업을 실행
                container('kaniko') {
                    script {
                        // 1. 최종적으로 푸시할 이미지의 전체 URL을 정의
                        def imageUrl = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
                        
                        // 2. Kaniko 실행!
                        // 이 명령어 한 줄이 Dockerfile을 읽어 이미지를 빌드하고,
                        // Workload Identity로 Artifact Registry에 자동 인증하여 푸시하는 모든 작업을 수행함.
                        sh """
                        /kaniko/executor --context=`pwd` \\
                                       --dockerfile=Dockerfile \\
                                       --destination=${imageUrl}
                        """
                    }
                }
            }
        }
    }
}