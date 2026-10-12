
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
        EMAIL_TO = 'logeswaran2108@gmail.com'
        SHOULD_DEPLOY = 'false'
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

                    echo "Environment: ${env.DEPLOY_ENV}"
                    echo "Target branch: ${env.GIT_BRANCH}"
                }
            }
        }

        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Identify Commit') {
            steps {
                script {
                    env.COMMIT_SHA = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    env.COMMIT_AUTHOR = sh(
                        script: "git log -1 --pretty=format:'%an <%ae>'",
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

        stage('Validate Promotion') {
            steps {
                script {
                    if (env.DEPLOY_ENV == 'DEV') {
                        // Every new DEV commit is eligible for deployment.
                        env.SHOULD_DEPLOY = 'true'
                        echo "DEV commit detected: deployment is enabled."
                    } else {
                        def sourceBranch =
                            env.DEPLOY_ENV == 'SIT' ? 'DEV' : 'SIT'

                        def parentCount = sh(
                            script: "git rev-list --parents -n 1 HEAD | awk '{print NF-1}'",
                            returnStdout: true
                        ).trim().toInteger()

                        if (parentCount < 2) {
                            env.SHOULD_DEPLOY = 'false'
                            echo "SKIPPED: ${env.DEPLOY_ENV} commit is not a merge commit."
                        } else {
                            // Fetch the branch that is allowed to promote into this environment.
                            sh """
                                set -eu
                                git fetch origin \
                                  +refs/heads/${sourceBranch}:refs/remotes/origin/${sourceBranch}
                            """

                            def sourceParent = sh(
                                script: 'git rev-parse HEAD^2',
                                returnStdout: true
                            ).trim()

                            // The second parent must belong to the allowed source branch history.
                            def sourceIsValid = sh(
                                script: """
                                    git merge-base --is-ancestor \
                                      '${sourceParent}' \
                                      'refs/remotes/origin/${sourceBranch}'
                                """,
                                returnStatus: true
                            ) == 0

                            if (sourceIsValid) {
                                env.SHOULD_DEPLOY = 'true'
                                echo "Valid promotion merge from ${sourceBranch} detected."
                            } else {
                                env.SHOULD_DEPLOY = 'false'
                                echo "SKIPPED: Merge source is not in the ${sourceBranch} branch history."
                            }
                        }
                    }
                }
            }
        }

        stage('Deploy API and Migrate Database') {
            when {
                expression { env.SHOULD_DEPLOY == 'true' }
            }
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
            when {
                expression { env.SHOULD_DEPLOY == 'true' }
            }
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

                    echo "API health checks passed."
                '''
            }
        }

        stage('Deployment Skipped') {
            when {
                expression { env.SHOULD_DEPLOY != 'true' }
            }
            steps {
                echo "No deployment performed. The commit did not meet the promotion rule."
            }
        }
    }

    post {
        success {
            script {
                def outcome = env.SHOULD_DEPLOY == 'true'
                    ? 'Deployment succeeded'
                    : 'Build completed; deployment skipped'

                try {
                    emailext(
                        to: "${env.EMAIL_TO}",
                        subject: "${env.JOB_NAME}: ${outcome}",
                        body: """${outcome}

Job: ${env.JOB_NAME}
Environment: ${env.DEPLOY_ENV}
Branch: ${env.GIT_BRANCH}
Commit: ${env.COMMIT_SHA ?: 'unknown'}
Author: ${env.COMMIT_AUTHOR ?: 'unknown'}
Build: ${env.BUILD_URL}
"""
                    )
                } catch (Exception err) {
                    echo "Email notification failed: ${err.getMessage()}"
                }
            }
        }

        failure {
            script {
                try {
                    emailext(
                        to: "${env.EMAIL_TO}",
                        subject: "${env.JOB_NAME}: Deployment failed",
                        body: """API pipeline failed.

Job: ${env.JOB_NAME}
Environment: ${env.DEPLOY_ENV ?: 'unknown'}
Branch: ${env.GIT_BRANCH ?: 'unknown'}
Build: ${env.BUILD_URL}

Check Jenkins Console Output for the first error.
"""
                    )
                } catch (Exception err) {
                    echo "Email notification failed: ${err.getMessage()}"
                }
            }
        }
    }
}
