pipeline {
    agent any

    options {
        disableConcurrentBuilds()
        timestamps()
    }

    parameters {
        choice(
            name: 'TARGET_ENV',
            choices: ['DEV', 'SIT', 'UAT'],
            description: 'Select the environment to deploy'
        )
    }

    stages {
        stage('Checkout') {
            steps {
                deleteDir()
                git branch: "${params.TARGET_ENV}",
                    url: 'https://github.com/Loges2108/Product_api.git'
            }
        }

        stage('Validate') {
            steps {
                sh '''
                    test -f package.json
                    test -f package-lock.json
                    echo "API source files verified"
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    sudo -n /usr/local/sbin/deploy-product-api \
                      "$TARGET_ENV" "$WORKSPACE"
                '''
            }
        }

        stage('Health Check') {
            steps {
                script {
                    def ports = [
                        DEV: '5001',
                        SIT: '5002',
                        UAT: '5003'
                    ]
                    env.API_PORT = ports[params.TARGET_ENV]
                }

                sh '''
                    curl --fail --silent --show-error \
                      --retry 5 --retry-delay 3 \
                      "http://127.0.0.1:${API_PORT}/health"
                '''
            }
        }
    }
}
