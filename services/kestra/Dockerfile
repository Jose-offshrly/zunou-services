# See https://kestra.io/docs/installation/docker#build-a-custom-docker-image

ARG IMAGE_TAG=latest
FROM kestra/kestra:$IMAGE_TAG

USER root
RUN mkdir -p /app/plugins && \
  apt-get update -y && \
  apt-get install -y --no-install-recommends golang python3-pip && \
  apt-get clean && \
  rm -rf /var/lib/apt/lists/* /var/tmp/*

# Copy requirements and install Python packages
COPY requirements.txt .
RUN pip3 install --no-cache-dir -r requirements.txt

ARG KESTRA_CONFIGURATION
ENV KESTRA_CONFIGURATION=$KESTRA_CONFIGURATION
