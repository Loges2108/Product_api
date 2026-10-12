pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
    }

    environment {
        API_REPO = 'https://github.com/Loges2108/Product_api.git'
        EMAIL_TO = 'aws.saquib@gmail.com'
    }

    stages {
        stage('Clean Workspace') {
            steps {
                deleteDir()
            }
        }

        stage('Determine Environment') {
            steps {
                script {
                    def jobName = env.JOB_NAME?.toUpperCase() ?: ''

                    if (jobName.endsWith('_DEV')) {
                        env.DEPLOY_ENV = 'DEV'
                        env.GIT_BRANCH = 'DEV'
                    } else if (jobName.endsWith('_SIT')) {
                        env.DEPLOY_ENV = 'SIT'
                        env.GIT_BRANCH = 'SIT'
                    } else if (jobName.endsWith('_UAT')) {
                        env.DEPLOY_ENV = 'UAT'
                        env.GIT_BRANCH = 'UAT'
                    } else {
                        error("Unsupported API job: ${env.JOB_NAME}")
                    }

                    env.ENV_FILE = "/var/www/product-api/.env.${env.DEPLOY_ENV.toLowerCase()}"
                    env.APP_DIR = "/var/www/product-api/${env.DEPLOY_ENV.toLowerCase()}"
                    env.PM2_NAME = "product-api-${env.DEPLOY_ENV.toLowerCase()}"

                    echo "Deploy environment: ${env.DEPLOY_ENV}"
                    echo "Git branch: ${env.GIT_BRANCH}"
                    echo "Env file: ${env.ENV_FILE}"
                }
            }
        }

        stage('Checkout') {
            steps {
                git branch: "${env.GIT_BRANCH}", url: "${env.API_REPO}", poll: true, changelog: true
            }
        }

        stage('Identify Commit Author') {
            steps {
                sh '''
                    set +e
                    git log -1 --pretty=format:'%an <%ae>' || true
                '''
            }
        }

        stage('Validate Source') {
            steps {
                sh '''
                    set -eu
                    test -f package.json
                    test -f package-lock.json
                    test -f src/server.js
                    test -f scripts/create-database.js
                    test -f .sequelizerc
                    echo "API source validation passed"
                '''
            }
        }

        stage('Install Dependencies') {
            steps {
                sh '''
                    set -eu
                    npm ci --no-audit --no-fund
                '''
            }
        }

        stage('Deploy API') {
            steps {
                sh '''
                    set -eu
                    test -n "${ENV_FILE}"
                    test -f "${ENV_FILE}"

                    chmod +x ./deploy-product-api 2>/dev/null || true
                    ./deploy-product-api "${DEPLOY_ENV}" "${WORKSPACE}"
                '''
            }
        }

        stage('Health Check') {
            steps {
                sh '''
                    set -eu

                    case "${DEPLOY_ENV}" in
                      DEV) PORT=5001 ;;
                      SIT) PORT=5002 ;;
                      UAT) PORT=5003 ;;
                      *) echo "Invalid environment: ${DEPLOY_ENV}" >&2; exit 1 ;;
                    esac

                    curl --fail --silent --show-error \
                      --retry 20 --retry-delay 3 \
                      "http://127.0.0.1:${PORT}/health"

                    curl --fail --silent --show-error \
                      --retry 20 --retry-delay 3 \
                      "http://127.0.0.1:${PORT}/api/products"
                '''
            }
        }

        stage('Cleanup') {
            steps {
                sh '''
                    set +e
                    rm -rf .cache tmp build 2>/dev/null || true
                '''
            }
        }
    }

    post {
        success {
            script {
                try {
                    emailext(
                        to: "${env.EMAIL_TO}",
                        subject: "${env.JOB_NAME} build succeeded (${env.DEPLOY_ENV})",
                        body: "Build succeeded for ${env.JOB_NAME} on ${env.GIT_BRANCH}.\nCommit author: ${env.GIT_COMMIT?:'unknown'}"
                    )
                } catch (Exception err) {
                    echo "Email notification skipped: ${err.getMessage()}"
                }
            }
        }
        failure {
            script {
                try {
                    emailext(
                        to: "${env.EMAIL_TO}",
                        subject: "${env.JOB_NAME} build failed (${env.DEPLOY_ENV})",
                        body: "Build failed for ${env.JOB_NAME} on ${env.GIT_BRANCH}.\nCheck Jenkins logs for details."
                    )
                } catch (Exception err) {
                    echo "Email notification skipped: ${err.getMessage()}"
                }
            }
        }
    }
}