FROM python:3.5.1
WORKDIR /app
RUN groupadd --gid 1001 app && useradd -g app --uid 1001 --shell /usr/sbin/nologin app
COPY ./requirements.txt /app/requirements.txt
RUN pip install -U 'pip>=0.8' && pip install --upgrade --no-cache-dir -r requirements.txt
COPY . /app
RUN mkdir media && chown app:app media
USER app
ENV DJANGO_SETTINGS_MODULE=normandy.settings
ENV DJANGO_CONFIGURATION=Development
ENV PORT=8000
EXPOSE $PORT
CMD gunicorn normandy.wsgi:application --log-file -
