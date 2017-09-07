# The FROM will be replaced when building in OpenShift
FROM rhel7/rhel

MAINTAINER Tarun Mehra <tmehra@redhat.com>

# Install headless Java
USER root
RUN yum repolist --disablerepo=* && \
    yum clean all && \
    yum-config-manager --disable rhel* 1>/dev/null && \
    yum-config-manager --enable rhel-7-server-rpms && \
    yum-config-manager --enable rhel-7-server-ose-3.2-rpms && \
    export INSTALL_PKGS="tar curl jq" && \
    yum clean all && \
    yum install -y --setopt=tsflags=nodocs install $INSTALL_PKGS && \
    rpm -V $INSTALL_PKGS && \
    yum clean all && \
    curl -o ~/oc.tar.gz https://mirror.openshift.com/pub/openshift-v3/clients/3.4.1.18/linux/oc.tar.gz && \
    cd /usr/bin && tar xvzf ~/oc.tar.gz

# Copy the entrypoint
USER 1001


