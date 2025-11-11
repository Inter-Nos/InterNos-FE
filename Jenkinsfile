// Jenkinsfile (진짜 최종본)
pipeline {
    // 도구가 모두 설치된 '만능 공구함' Pod를 Jenkinsfile 안에서 직접 정의!
    agent {
        kubernetes {
            defaultContainer 'main'
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
              containers:
              - name: main
                image: google/cloud-sdk:latest
                command:
                - sleep
                args:
                - "999999"
              # Docker-in-Docker 사이드카 컨테이너
              - name: dind
                image: docker:dind
                securityContext:
                  privileged: true
                volumeMounts:
                - name: dind-storage
                  mountPath: /var/lib/docker
              volumes:
              - name: dind-storage
                emptyDir: {}
            """
        }
    }

    environment {
        // Docker 데몬이 dind 컨테이너에 있음을 알려줌
        DOCKER_HOST = 'tcp://localhost:2375'
        PROJECT_ID = 'k8s-cicd-lab'
        REGION = 'asia-northeast3'
        REPO_NAME = 'internos-repo'
        IMAGE_NAME = 'frontend'
    }

    stages {
        stage('Checkout') {
            steps {
                // google/cloud-sdk 이미지에는 git이 포함되어 있음
                checkout scm
            }
        }

        stage('Build and Push Docker Image') {
            steps {
                script {
                    def imageUrl = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
                    
                    // gcloud로 Artifact Registry 인증
                    sh "gcloud auth configure-docker ${REGION}-docker.pkg.dev --quiet"
                    
                    // Docker 이미지 빌드
                    sh "docker build -t ${imageUrl} ."
                    
                    // Docker 이미지 푸시
                    sh "docker push ${imageUrl}"
                }
            }
        }
    }
}