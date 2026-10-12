
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
                        error(
                            "Unsupported API job: ${env.JOB_NAME}. " +
                            "Use Product_API_DEV, Product_API_SIT, or Product_API_UAT."
                        )
                    }

                    env.ENV_FILE =
                        "/var/www/product-api/.env.${env.DEPLOY_ENV.toLowerCase()}"

                    echo "Deploy environment: ${env.DEPLOY_ENV}"
                    echo "Git branch: ${env.GIT_BRANCH}"
                }
            }
        }

        stage('Checkout') {
            steps {
                git branch: "${env.GIT_BRANCH}",
                    url: "${env.API_REPO}",
                    poll: true,
                    changelog: true
            }
        }

        stage('Identify Commit') {
            steps {
                script {
                    env.COMMIT_AUTHOR = sh(
                        script: "git log -1 --pretty=format:'%an <%ae>'",
                        returnStdout: true
                    ).trim()

                    env.COMMIT_SHA = sh(
                        script: 'git rev-parse --short HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Commit: ${env.COMMIT_SHA}"
                    echo "Author: ${env.COMMIT_AUTHOR}"
                }
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
                    test -f ecosystem.config.js

                    echo "API source validation passed"
                '''
            }
        }

        stage('Deploy API and Migrate Database') {
            steps {
                sh '''
                    set -eu

                    test -f "${ENV_FILE}"

                    sudo -n /usr/local/sbin/deploy-product-api \
                        "${DEPLOY_ENV}" \
                        "${WORKSPACE}"
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
                        *)
                            echo "Invalid environment: ${DEPLOY_ENV}" >&2
                            exit 1
                            ;;
                    esac

                    echo "Checking API health on port ${PORT}"

                    curl --fail --silent --show-error \
                        --retry 20 --retry-delay 3 \
                        --retry-connrefused \
                        "http://127.0.0.1:${PORT}/health"

                    echo ""

                    curl --fail --silent --show-error \
                        "http://127.0.0.1:${PORT}/api/products" \
                        >/dev/null

                    echo "API health and products endpoint passed"
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
                        subject: "${env.JOB_NAME} succeeded (${env.DEPLOY_ENV})",
                        body: """API deployment succeeded.

Job: ${env.JOB_NAME}
Environment: ${env.DEPLOY_ENV}
Branch: ${env.GIT_BRANCH}
Commit: ${env.COMMIT_SHA ?: 'unknown'}
Author: ${env.COMMIT_AUTHOR ?: 'unknown'}
Build: ${env.BUILD_URL}
"""
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
                        subject: "${env.JOB_NAME} failed",
                        body: """API deployment failed.

Job: ${env.JOB_NAME}
Environment: ${env.DEPLOY_ENV ?: 'undetermined'}
Branch: ${env.GIT_BRANCH ?: 'undetermined'}
Build: ${env.BUILD_URL}

Check Jenkins Console Output for the error.
"""
                    )
                } catch (Exception err) {
                    echo "Email notification skipped: ${err.getMessage()}"
                }
            }
        }
    }
}
