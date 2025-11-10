// Jenkinsfile
pipeline {
    agent any

    // 환경 변수 설정
    environment {
        PROJECT_ID = 'k8s-cicd-lab' // 자네의 GCP 프로젝트 ID로 수정 완료!
        REGION = 'asia-northeast3'
        REPO_NAME = 'internos-repo'
        IMAGE_NAME = 'frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                // Git에서 소스 코드를 가져옴
                checkout scm
            }
        }

        stage('Build Docker Image') {
            steps {
                script {
                    // Docker 이미지 빌드 및 태깅
                    // 최종 이미지 URL: asia-northeast3-docker.pkg.dev/k8s-cicd-lab/internos-repo/frontend:latest
                    def imageUrl = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
                    sh "docker build -t ${imageUrl} ."
                }
            }
        }

        stage('Push to Artifact Registry') {
            steps {
                script {
                    def imageUrl = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
                    
                    // gcloud를 사용하여 Artifact Registry에 인증
                    // Workload Identity 덕분에 키 파일 없이 인증 가능!
                    sh "gcloud auth configure-docker ${REGION}-docker.pkg.dev"

                    // 이미지 푸시
                    sh "docker push ${imageUrl}"
                }
            }
        }
    }
}