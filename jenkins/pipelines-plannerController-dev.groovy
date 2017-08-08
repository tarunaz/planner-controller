node('nodejs') {

   stage('Build') {
       sh "oc status"

       // get latest code from github
       checkout scm

       sh "npm install"
   }
   stage('OpenShift Build') {
     sh """
         oc project optaplanner-jms-dev
     	 oc start-build node-amq --wait -n optaplanner-jms-dev
     """
   }
    stage('OpenShift Deployment') {
     echo "Waiting on OpenShift Deployment..."
     openshiftVerifyDeployment depCfg: 'node-amq', namespace: 'optaplanner-jms-dev', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'
   }
}
