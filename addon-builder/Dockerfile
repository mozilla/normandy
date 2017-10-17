FROM ubuntu:zesty
WORKDIR /root
ENV CACHEBUST=2017-10-16
RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        curl \
        git \
        python-software-properties \
        python2.7 \
        python3.6 \
        python3.6-venv \
        software-properties-common \
        xvfb \
        zip

# Install NodeJS
# Note: Zesty packages aren't available yet. Yakkety works fine
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_6.x yakkety main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_6.x yakkety main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-key adv --keyserver keyserver.ubuntu.com --recv-keys 323293EE && \
    echo 'deb http://ppa.launchpad.net/mercurial-ppa/releases/ubuntu yakkety main' > /etc/apt/sources.list.d/mercurial.list && \
    echo 'deb-src http://ppa.launchpad.net/mercurial-ppa/releases/ubuntu yakkety main' >> /etc/apt/sources.list.d/mercurial.list && \
    apt-get update && \
    apt-get install -y nodejs mercurial

RUN curl -O https://hg.mozilla.org/mozilla-central/raw-file/tip/python/mozboot/bin/bootstrap.py && \
    python2.7 bootstrap.py --no-interactive --application-choice=browser_artifact_mode

RUN hg clone https://hg.mozilla.org/hgcustom/version-control-tools/

COPY dot.hgrc ./.hgrc
