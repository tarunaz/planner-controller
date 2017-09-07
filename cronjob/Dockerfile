# The FROM will be replaced when building in OpenShift
FROM rhel7/rhel

MAINTAINER Tarun Mehra <tmehra@redhat.com>

# Install headless Java
USER root
RUN yum repolist --disablerepo=* && \
    yum clean all && \
    yum-config-manager --disable rhel* 1>/dev/null && \
    yum-config-manager --enable rhel-7-server-rpms && \
    export INSTALL_PKGS="tar curl wget" && \
    yum clean all && \
    yum install -y --setopt=tsflags=nodocs install $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum clean all && \
    curl -o ~/oc.tar.gz https://mirror.openshift.com/pub/openshift-v3/clients/3.4.1.18/linux/oc.tar.gz && \
    cd /usr/bin && tar xvzf ~/oc.tar.gz && \
    wget -O jq https://github.com/stedolan/jq/releases/download/jq-1.5/jq-linux64 && \
    chmod +x ./jq

# Copy the entrypoint
USER 1001


