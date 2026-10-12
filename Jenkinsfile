
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

    environment {
        SHOULD_DEPLOY = 'false'
        DEPLOY_ENV = ''
        EXPECTED_BRANCH = ''
        SOURCE_BRANCH = ''
        DEPLOY_PORT = ''
        COMMIT_SHA = ''
    }

    stages {

        // --------------------------------------------------
        // 1. Determine environment from Jenkins job name
        // --------------------------------------------------
        stage('Determine Environment') {
            steps {
                script {
                    def jobName = env.JOB_NAME.toUpperCase()

                    if (jobName.endsWith('_DEV')) {
                        env.DEPLOY_ENV = 'DEV'
                        env.EXPECTED_BRANCH = 'DEV'
                        env.DEPLOY_PORT = '5001'
                    } else if (jobName.endsWith('_SIT')) {
                        env.DEPLOY_ENV = 'SIT'
                        env.EXPECTED_BRANCH = 'SIT'
                        env.SOURCE_BRANCH = 'DEV'
                        env.DEPLOY_PORT = '5002'
                    } else if (jobName.endsWith('_UAT')) {
                        env.DEPLOY_ENV = 'UAT'
                        env.EXPECTED_BRANCH = 'UAT'
                        env.SOURCE_BRANCH = 'SIT'
                        env.DEPLOY_PORT = '5003'
                    } else {
                        error(
                            "Unknown job name: ${env.JOB_NAME}. " +
                            "Expected suffix _DEV, _SIT, or _UAT."
                        )
                    }

                    echo "Jenkins Job      : ${env.JOB_NAME}"
                    echo "Deployment Env   : ${env.DEPLOY_ENV}"
                    echo "Expected Branch  : ${env.EXPECTED_BRANCH}"
                    echo "Deployment Port  : ${env.DEPLOY_PORT}"
                    echo "Promotion Source : ${env.SOURCE_BRANCH ?: 'N/A'}"
                }
            }
        }

        // --------------------------------------------------
        // 2. Checkout ONLY the branch configured for this job
        // --------------------------------------------------
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

                    /*
                     * Verify that the checked-out commit is the current
                     * tip of the branch configured for this environment.
                     *
                     * This prevents the UAT job from deploying a DEV
                     * checkout accidentally.
                     */
                    sh '''
                        set -eu

                        git fetch origin \
                          "+refs/heads/${EXPECTED_BRANCH}:refs/remotes/origin/${EXPECTED_BRANCH}"

                        ACTUAL_COMMIT="$(git rev-parse HEAD)"
                        BRANCH_COMMIT="$(git rev-parse "refs/remotes/origin/${EXPECTED_BRANCH}")"

                        echo "HEAD commit:   ${ACTUAL_COMMIT}"
                        echo "Branch commit: ${BRANCH_COMMIT}"

                        if [ "$ACTUAL_COMMIT" != "$BRANCH_COMMIT" ]; then
                            echo "ERROR: Checked-out commit does not match the configured environment branch."
                            exit 1
                        fi
                    '''
                }
            }
        }

        // --------------------------------------------------
        // 3. Validate source files
        // --------------------------------------------------
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

        // --------------------------------------------------
        // 4. Validate promotion rules
        // DEV: any commit on DEV
        // SIT: merge from DEV
        // UAT: merge from SIT
        // --------------------------------------------------
        stage('Validate Promotion') {
            steps {
                script {
                    if (env.DEPLOY_ENV == 'DEV') {
                        env.SHOULD_DEPLOY = 'true'
                        echo 'DEV deployment is allowed.'
                    } else {
                        def validationResult = sh(
                            script: '''
                                set -eu

                                echo "Checking promotion into ${EXPECTED_BRANCH}"
                                echo "Required source branch: ${SOURCE_BRANCH}"

                                git fetch origin \
                                  "+refs/heads/${SOURCE_BRANCH}:refs/remotes/origin/${SOURCE_BRANCH}"

                                # A valid promotion must be a two-parent
                                # merge commit.
                                PARENT_LINE="$(git rev-list --parents -n 1 HEAD)"
                                PARENT_COUNT="$(echo "$PARENT_LINE" | awk '{print NF - 1}')"

                                echo "Merge parent count: ${PARENT_COUNT}"

                                if [ "$PARENT_COUNT" -lt 2 ]; then
                                    echo "SKIP: Current commit is not a merge commit."
                                    exit 10
                                fi

                                # For a normal merge commit, HEAD^2 is the
                                # source-side commit brought into the target.
                                SOURCE_PARENT="$(git rev-parse HEAD^2)"

                                echo "Merged source commit: ${SOURCE_PARENT}"

                                if git merge-base --is-ancestor \
                                    "$SOURCE_PARENT" \
                                    "refs/remotes/origin/${SOURCE_BRANCH}"; then
                                    echo "Promotion validation passed."
                                    exit 0
                                else
                                    echo "SKIP: The second merge parent is not in ${SOURCE_BRANCH} history."
                                    exit 10
                                fi
                            ''',
                            returnStatus: true
                        )

                        if (validationResult == 0) {
                            env.SHOULD_DEPLOY = 'true'
                        } else if (validationResult == 10) {
                            env.SHOULD_DEPLOY = 'false'
                        } else {
                            error(
                                "Promotion validation failed due to a Git error. " +
                                "Deployment is blocked."
                            )
                        }
                    }

                    echo "Should deploy: ${env.SHOULD_DEPLOY}"
                }
            }
        }

        // --------------------------------------------------
        // 5. Deploy to the matching environment only
        // --------------------------------------------------
        stage('Deploy API') {
            when {
                expression {
                    return env.SHOULD_DEPLOY == 'true'
                }
            }

            steps {
                sh '''
                    set -eu

                    echo "Deploying ${DEPLOY_ENV}"
                    echo "Expected branch: ${EXPECTED_BRANCH}"
                    echo "Commit: ${COMMIT_SHA}"

                    sudo -n /usr/local/sbin/deploy-product-api \
                      "${DEPLOY_ENV}" \
                      "${WORKSPACE}"
                '''
            }
        }

        // --------------------------------------------------
        // 6. Verify deployed API
        // --------------------------------------------------
        stage('Health Check') {
            when {
                expression {
                    return env.SHOULD_DEPLOY == 'true'
                }
            }

            steps {
                sh '''
                    set -eu

                    HEALTH_URL="http://127.0.0.1:${DEPLOY_PORT}/health"

                    echo "Checking ${HEALTH_URL}"

                    curl \
                      --fail \
                      --silent \
                      --show-error \
                      --retry 10 \
                      --retry-delay 3 \
                      --retry-connrefused \
                      "$HEALTH_URL"

                    echo ""
                    echo "API health check passed."
                '''
            }
        }

        // --------------------------------------------------
        // 7. Explain why deployment was skipped
        // --------------------------------------------------
        stage('Deployment Skipped') {
            when {
                expression {
                    return env.SHOULD_DEPLOY != 'true'
                }
            }

            steps {
                echo """
                Deployment skipped.

                Environment : ${env.DEPLOY_ENV}
                Branch      : ${env.EXPECTED_BRANCH}
                Commit      : ${env.COMMIT_SHA}

                The required promotion merge was not detected.
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
            echo "Pipeline failed for ${env.DEPLOY_ENV}. Review the console output."
        }

        always {
            echo "Job: ${env.JOB_NAME}"
            echo "Build: #${env.BUILD_NUMBER}"
        }
    }
}
