// Jenkinsfile (Final Version without post block)
pipeline {
    agent {
        kubernetes {
            namespace 'jenkins'
            yaml """
            apiVersion: v1
            kind: Pod
            spec:
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
}