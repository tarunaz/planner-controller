node('nodejs') {

   stage('Build') {
       sh "oc status"

       // get latest code from github
       checkout scm

       sh "npm install"
   }
   stage('OpenShift Build') {
     sh """
         oc project planner-controller-amq-dev
     	 oc start-build planner-controller --wait -n planner-controller-amq-dev
     """
   }
    stage('OpenShift Deployment') {
     echo "Waiting on OpenShift Deployment..."
     openshiftVerifyDeployment depCfg: 'planner-controller', namespace: 'planner-controller-amq-dev', replicaCount: '1', verbose: 'false', verifyReplicaCount: 'true', waitTime: '300', waitUnit: 'sec'
   }
}
