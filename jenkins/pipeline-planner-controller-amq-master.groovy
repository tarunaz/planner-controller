node('nodejs') {
   def TAG_NAME
   stage('Build') {
       // Get some code from a GitHub repository
       checkout scm

       // Run the npm build
       sh "npm install"
   }
   stage('Test') {
       // Runs unit tests
       // sh "npm test"
       
   }
   stage('OpenShift Build') {
      // Get the package.json version and generate the server tag using it
      def TAGS, TAG_NEW, TAG_OLD
      def PACKAGE_VERSION=sh script: "node -p \"require('./package.json').version\"", returnStdout: true
      PACKAGE_VERSION = PACKAGE_VERSION.trim()
      TAG_NAME="v$PACKAGE_VERSION-$BUILD_NUMBER"
      
      echo "Tagging github project with tag: $TAG_NAME"
      // Create tag and write to GitHub
      sshagent(['git-SS-PlannerController']) {
          sh """
            git tag $TAG_NAME
            git push origin $TAG_NAME
          """
      }
      // Link to changeset on GitHub
      echo "Created a new tagged build at $TAG_NEW."
        
      sh """
        # Set the project to planner-controller-amq-test
        oc project planner-controller-amq-test
        # Patch the BuildConfig to pull from the git tag
        oc patch buildconfig planner-controller -p "{\\"spec\\": {\\"source\\": {\\"git\\": {\\"ref\\": \\"${TAG_NAME}\\" }}}}"  -n planner-controller-amq-test
        # Patch the BuildConfig to output the image to the docker tag
        oc patch buildconfig planner-controller -p "{\\"spec\\": {\\"output\\": {\\"to\\": {\\"name\\": \\"planner-controller:${TAG_NAME}\\" }}}}"  -n planner-controller-amq-test
        # Start the build and wait for completion
        oc start-build planner-controller --follow --wait -n planner-controller-amq-test
        oc tag planner-controller:${TAG_NAME} planner-controller:latest -n planner-controller-amq-test
      """
   }
   stage('OpenShift Deployment (Test)') {
     echo "Waiting on OpenShift Deployment..."
     openshiftVerifyDeployment depCfg: 'planner-controller', namespace: 'planner-controller-amq-test', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'
  }
  stage('Preprod Deployment') {
       input message: 'Push to Preprod', ok: 'Approve'
       sh "oc tag planner-controller-amq-test/planner-controller:${TAG_NAME} planner-controller-amq-preprod/planner-controller:latest"
       echo "Waiting on OpenShift Deployment..."
       openshiftVerifyDeployment depCfg: 'planner-controller', namespace: 'planner-controller-amq-preprod', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'
  }
  stage('Prod Deployment') {
       input message: 'Push to Prod', ok: 'Approve'

       sh """
         src_creds=openshift:\$(cat /var/run/secrets/kubernetes.io/serviceaccount/token)
         dest_creds=openshift:\$(cat /etc/planner-controller-amq-prod-secret-volume/token)
          
         skopeo copy --src-creds \$src_creds --dest-creds \$dest_creds docker://registry.tke.openshift.com/planner-controller-amq-preprod/planner-controller:latest docker://registry.prod-east-tke.openshift.com/planner-controller-amq-prod/planner-controller:latest
       """

       echo "Waiting on OpenShift Deployment..."
       openshiftVerifyDeployment depCfg: 'planner-controller', apiURL: 'api.prod-east-tke.openshift.com', authToken: readFile('/etc/planner-controller-amq-prod-secret-volume/token'), namespace: 'planner-controller-amq-prod', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'



  }
}
