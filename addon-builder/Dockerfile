FROM ubuntu:zesty
WORKDIR /root
RUN apt-get update && apt-get install -y --no-install-recommends \
        apt-transport-https \
        curl \
        git \
        python2.7 \
        python3.6 \
        python3.6-venv \
        xvfb \
        zip

# Install NodeJS
# Note: Zesty packages aren't available yet. Yakkety works fine
RUN curl -s https://deb.nodesource.com/gpgkey/nodesource.gpg.key | apt-key add - && \
    echo 'deb https://deb.nodesource.com/node_6.x yakkety main' > /etc/apt/sources.list.d/nodesource.list && \
    echo 'deb-src https://deb.nodesource.com/node_6.x yakkety main' >> /etc/apt/sources.list.d/nodesource.list && \
    apt-get update && \
    apt-get install -y nodejs

RUN curl -O https://hg.mozilla.org/mozilla-central/raw-file/tip/python/mozboot/bin/bootstrap.py && \
    python2.7 bootstrap.py --no-interactive --application-choice=browser
