# A containerfile to build the microservice that presents data held within an IBM Db2 database as API calls.
# This takes the node.js code in this repository and builds a container image to run it.
# This will build for the ppc64le architecture **only**.

# FROM quay.io/centos/ppc64le:centos7
FROM docker.io/ppc64le/centos:7
# FROM ubi7/ubi:7.9 # requires an account with the Red Hat container registry

LABEL "maintainer"="Andrew Laidlaw [andrew.laidlaw@uk.ibm.com]"
LABEL "version"="1.1"
LABEL "description"="Microservice to present data in IBM Db2 as API endpoints."

# runtime support to enable npm build capabilities
RUN yum -y install libstdc++ make gcc-c++ numactl-devel

# Required to install Python3 on CentOS7
RUN yum -y install https://dl.fedoraproject.org/pub/epel/epel-release-latest-7.noarch.rpm && yum -y install python36

# XLC runtime support - required by ibm_db node package
RUN curl -sL http://public.dhe.ibm.com/software/server/POWER/Linux/xl-compiler/eval/ppc64le/rhel7/ibm-xl-compiler-eval.repo > /etc/yum.repos.d/xl-compilers.repo \
        && yum -y install libxlc

# install most up-to-date LTS node for ppc64le
# RUN cd /usr/local \
#       && curl -sL https://nodejs.org/dist/v16.14.2/node-v16.14.2-linux-ppc64le.tar.gz > node-v16.14.2-Linux-ppc64le.tar.gz \
#       && tar --strip-components 1 -xf node-v16.14.2-Linux-ppc64le.tar.gz
RUN cd /usr/local \
       && curl -sL https://nodejs.org/dist/v14.17.5/node-v14.17.5-linux-ppc64le.tar.gz > node-v14.17.5-linux-ppc64le.tar.gz \
       && tar --strip-components 1 -xf node-v14.17.5-linux-ppc64le.tar.gz

# install required node.js pacakges using npm
COPY package*.json ./
RUN npm install

# copy our node.js application code into the image
COPY server.js .

# expose the required port to access our code
EXPOSE 8080

# on start run our node.js application
CMD [ "node", "server.js" ]
