node('nodejs') {

   stage('Build') {
       sh "oc status"

       // get latest code from github
       checkout scm

       sh "npm install"
   }
   stage('Test') {
       // Runs unit tests
      sh """
       //     npm i fh-fhc@2.17.1-516
       //     npm test
        """
   }
   stage('OpenShift Build') {
     sh """
         oc project optaplanner-jms-dev
     	 oc start-build node-amq --wait
     """
   }
    stage('OpenShift Deployment') {
     echo "Waiting on OpenShift Deployment..."
     openshiftVerifyDeployment depCfg: 'node-amq', namespace: 'optaplanner-jms-dev', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'
   }
}
