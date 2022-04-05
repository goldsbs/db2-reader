# A containerfile to build the microservice that presents data held within an IBM Db2 database as API calls.
# This takes the node.js code in this repository and builds a container image to run it.
# This will build for the ppc64le architecture **only**.

# FROM quay.io/centos/ppc64le:stream9
# FROM ubi8/ubi:8.5
FROM ubi7/ubi:7.9
# requires an account with the Red Hat container registry

LABEL "maintainer"="Andrew Laidlaw [andrew.laidlaw@uk.ibm.com]"
LABEL "version"="1.0"
LABEL "description"="Microservice to present data in IBM Db2 as API endpoints."

# RUN yum provides libnuma.so.1
# runtime support to enable npm build capabilities
RUN yum -y install libstdc++ make gcc-c++ numactl-devel python39
# RUN yum -y install libstdc++ make gcc-c++ python39
# RUN yum -y install libstdc++ make gcc-c++ python39 openssl-devel

# XLC runtime support - required by ibm_db node package
RUN curl -sL http://public.dhe.ibm.com/software/server/POWER/Linux/xl-compiler/eval/ppc64le/rhel7/ibm-xl-compiler-eval.repo > /etc/yum.repos.d/xl-compilers.repo
RUN sed -i 's/gpgcheck=1/gpgcheck=0/g' /etc/yum.repos.d/xl-compilers.repo
RUN yum -y install libxlc
        
# install most up-to-date LTS node for ppc64le
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
