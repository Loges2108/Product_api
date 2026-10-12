
pipeline {
    agent any

    triggers {
        pollSCM('H/2 * * * *')
    }

    options {
        timestamps()
        disableConcurrentBuilds()
        skipDefaultCheckout(true)
    }

    stages {

        // 1. Determine environment from the Jenkins job name
        stage('Determine Environment') {
            steps {
                script {
                    def job = env.JOB_NAME.toUpperCase()

                    if (job.endsWith('_DEV')) {
                        env.DEPLOY_ENV = 'DEV'
                        env.EXPECTED_BRANCH = 'DEV'
                        env.DEPLOY_PORT = '5001'
                        env.SOURCE_BRANCH = ''
                    } else if (job.endsWith('_SIT')) {
                        env.DEPLOY_ENV = 'SIT'
                        env.EXPECTED_BRANCH = 'SIT'
                        env.DEPLOY_PORT = '5002'
                        env.SOURCE_BRANCH = 'DEV'
                    } else if (job.endsWith('_UAT')) {
                        env.DEPLOY_ENV = 'UAT'
                        env.EXPECTED_BRANCH = 'UAT'
                        env.DEPLOY_PORT = '5003'
                        env.SOURCE_BRANCH = 'SIT'
                    } else {
                        error("Unknown Jenkins job name: ${env.JOB_NAME}")
                    }

                    env.SHOULD_DEPLOY = 'false'

                    echo "Jenkins Job      : ${env.JOB_NAME}"
                    echo "Deployment Env   : ${env.DEPLOY_ENV}"
                    echo "Expected Branch  : ${env.EXPECTED_BRANCH}"
                    echo "Deployment Port  : ${env.DEPLOY_PORT}"
                    echo "Promotion Source : ${env.SOURCE_BRANCH ?: 'N/A'}"
                }
            }
        }

        // 2. Checkout the branch configured in the Jenkins job
        stage('Checkout') {
            steps {
                deleteDir()
                checkout scm

                script {
                    env.COMMIT_SHA = sh(
                        script: 'git rev-parse HEAD',
                        returnStdout: true
                    ).trim()

                    echo "Checked-out commit: ${env.COMMIT_SHA}"

                    sh '''
                        set -eu

                        git fetch origin \
                          "+refs/heads/${EXPECTED_BRANCH}:refs/remotes/origin/${EXPECTED_BRANCH}"

                        ACTUAL_COMMIT="$(git rev-parse HEAD)"
                        BRANCH_COMMIT="$(git rev-parse "refs/remotes/origin/${EXPECTED_BRANCH}")"

                        echo "HEAD commit:   $ACTUAL_COMMIT"
                        echo "Branch commit: $BRANCH_COMMIT"

                        if [ "$ACTUAL_COMMIT" != "$BRANCH_COMMIT" ]; then
                            echo "ERROR: Checkout does not match the expected branch."
                            exit 1
                        fi
                    '''
                }
            }
        }

        // 3. Validate required API files
        stage('Validate Source') {
            steps {
                sh '''
                    set -eu

                    test -f package.json
                    test -f package-lock.json
                    test -f src/server.js
                    test -f scripts/create-database.js
                    test -f ecosystem.config.js

                    echo "API source files verified."
                '''
            }
        }

        // 4. DEV deploys directly.
        // SIT requires a regular merge commit from DEV.
        // UAT requires a regular merge commit from SIT.
        stage('Validate Promotion') {
            steps {
                script {
                    if (env.DEPLOY_ENV == 'DEV') {
                        env.SHOULD_DEPLOY = 'true'
                        echo 'DEV deployment is allowed.'
                    } else {
                        int result = sh(
                            script: '''
                                set -eu

                                echo "Target branch: ${EXPECTED_BRANCH}"
                                echo "Required source: ${SOURCE_BRANCH}"

                                git fetch origin \
                                  "+refs/heads/${SOURCE_BRANCH}:refs/remotes/origin/${SOURCE_BRANCH}"

                                PARENT_LINE="$(git rev-list --parents -n 1 HEAD)"
                                PARENT_COUNT="$(echo "$PARENT_LINE" | awk '{print NF - 1}')"

                                echo "Merge parent count: $PARENT_COUNT"

                                if [ "$PARENT_COUNT" -lt 2 ]; then
                                    echo "SKIP: This commit is not a merge commit."
                                    exit 10
                                fi

                                SOURCE_PARENT="$(git rev-parse HEAD^2)"

                                echo "Merged source commit: $SOURCE_PARENT"

                                if git merge-base --is-ancestor \
                                    "$SOURCE_PARENT" \
                                    "refs/remotes/origin/${SOURCE_BRANCH}"; then
                                    echo "Promotion validation passed."
                                    exit 0
                                else
                                    echo "SKIP: Merge source is not in ${SOURCE_BRANCH} history."
                                    exit 10
                                fi
                            ''',
                            returnStatus: true
                        )

                        if (result == 0) {
                            env.SHOULD_DEPLOY = 'true'
                        } else if (result == 10) {
                            env.SHOULD_DEPLOY = 'false'
                        } else {
                            error('Git promotion validation failed. Deployment blocked.')
                        }
                    }

                    echo "Should deploy: ${env.SHOULD_DEPLOY}"
                }
            }
        }

        // 5. Deploy to the environment selected from the job name
        stage('Deploy API') {
            when {
                expression {
                    env.SHOULD_DEPLOY == 'true'
                }
            }

            steps {
                sh '''
                    set -eu

                    echo "Deploying environment: ${DEPLOY_ENV}"
                    echo "Commit: ${COMMIT_SHA}"

                    sudo -n /usr/local/sbin/deploy-product-api \
                      "${DEPLOY_ENV}" \
                      "${WORKSPACE}"
                '''
            }
        }

        // 6. Health check for the matching environment
        stage('Health Check') {
            when {
                expression {
                    env.SHOULD_DEPLOY == 'true'
                }
            }

            steps {
                sh '''
                    set -eu

                    HEALTH_URL="http://127.0.0.1:${DEPLOY_PORT}/health"

                    echo "Checking $HEALTH_URL"

                    curl \
                      --fail \
                      --silent \
                      --show-error \
                      --retry 10 \
                      --retry-delay 3 \
                      --retry-connrefused \
                      "$HEALTH_URL"

                    echo ""
                    echo "Health check passed."
                '''
            }
        }

        // 7. Report skipped promotions without deploying
        stage('Deployment Skipped') {
            when {
                expression {
                    env.SHOULD_DEPLOY != 'true'
                }
            }

            steps {
                echo """
                Deployment skipped.

                Environment : ${env.DEPLOY_ENV}
                Branch      : ${env.EXPECTED_BRANCH}
                Commit      : ${env.COMMIT_SHA}

                Required promotion merge was not detected.
                No deployment command was executed.
                """
            }
        }
    }

    post {
        success {
            echo "Pipeline completed successfully for ${env.DEPLOY_ENV}."
        }

        failure {
            echo "Pipeline failed for ${env.DEPLOY_ENV ?: 'unknown environment'}."
        }

        always {
            echo "Job: ${env.JOB_NAME}"
            echo "Build: ${env.BUILD_NUMBER}"
        }
    }
}
