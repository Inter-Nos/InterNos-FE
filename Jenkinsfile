// Jenkinsfile (Final Version with serviceAccountName)
pipeline {
    agent {
        kubernetes {
            namespace 'jenkins'
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
              # 이 Pod가 'jenkins' 서비스 계정을 사용하도록 명시!
              serviceAccountName: jenkins
              containers:
              - name: kaniko
                image: gcr.io/kaniko-project/executor:debug
                imagePullPolicy: Always
                command:
                - /busybox/sleep
                args:
                - "3600"
            """
        }
    }

    environment {
        PROJECT_ID = 'k8s-cicd-lab'
        REGION = 'asia-northeast3'
        REPO_NAME = 'internos-repo'
        IMAGE_NAME = 'frontend'
    }

    stages {
        stage('Checkout Source Code') {
            steps {
                container('kaniko') {
                    checkout scm
                }
            }
        }

        stage('Build and Push with Kaniko') {
            steps {
                container('kaniko') {
                    script {
                        def imageUrl = "${REGION}-docker.pkg.dev/${PROJECT_ID}/${REPO_NAME}/${IMAGE_NAME}:latest"
                        
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
    
    post {
        always {
            // Workspace Cleanup 플러그인을 설치했거나, 
            // 설치하지 않았다면 이 블록은 삭제하거나 주석 처리
            // cleanWs()
        }
    }
}